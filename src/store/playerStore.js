import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AudioEngine } from '../core/audio/AudioEngine';
import { useLibraryStore } from './libraryStore';
import { usePreferenceStore } from './preferenceStore';
import { useToastStore } from './toastStore';
import { discordService } from '../core/api/discordService';

/**
 * @typedef {import('./libraryStore').Track} Track
 */

let sleepTimerInterval = null;

export const usePlayerStore = create(
  persist(
    (set, get) => {
      // Bind Media Session API handlers
      AudioEngine.setMediaSessionHandlers({
        onPlay: () => get().resume(),
        onPause: () => get().pause(),
        onNext: () => get().next(),
        onPrev: () => get().prev(),
      });

      return {
        currentTrack: null, // Track object
        queue: [],          // Array of Track objects
        queueIndex: -1,
        isPlaying: false,
        volume: 1,
        loopMode: 'none',   // 'none', 'all', 'one'
        isShuffled: false,
        progress: 0,
        isQueueVisible: false, // For desktop layout
        isFullscreen: false,
        isLyricsVisible: false,
        isMuted: false,
        previousVolume: 1,
        sleepTimerEnd: null,
        sleepTimerMode: 'time', // 'time' | 'endOfTrack'
        failedTrack: null,

        // Actions
        toggleQueueVisibility: () => set((state) => ({ isQueueVisible: !state.isQueueVisible })),
        setQueueVisibility: (isVisible) => set({ isQueueVisible: isVisible }),
        toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
        setFullscreen: (isFullscreen) => set({ isFullscreen }),
        toggleLyrics: () => set((state) => ({ isLyricsVisible: !state.isLyricsVisible })),
        setLyricsVisible: (isLyricsVisible) => set({ isLyricsVisible }),
        
        /**
         * Sets a sleep timer to pause audio after specified minutes.
         * @param {number} minutes 
         */
        setSleepTimer: (minutes, mode = 'time') => {
          if (sleepTimerInterval) {
            clearInterval(sleepTimerInterval);
            sleepTimerInterval = null;
          }

          if (mode === 'endOfTrack') {
            set({ sleepTimerEnd: -1, sleepTimerMode: 'endOfTrack' });
            useToastStore.getState().addToast('Playback stops after current track', 'info');
            return;
          }

          if (!minutes || minutes <= 0) {
            set({ sleepTimerEnd: null, sleepTimerMode: 'time' });
            return;
          }

          const endMs = Date.now() + minutes * 60 * 1000;
          set({ sleepTimerEnd: endMs, sleepTimerMode: 'time' });
          useToastStore.getState().addToast(`Sleep timer set for ${minutes} minutes`, 'info');

          sleepTimerInterval = setInterval(() => {
            const { sleepTimerEnd, sleepTimerMode, pause } = get();
            if (sleepTimerMode === 'time' && sleepTimerEnd && sleepTimerEnd > 0 && Date.now() >= sleepTimerEnd) {
              pause();
              if (sleepTimerInterval) {
                clearInterval(sleepTimerInterval);
                sleepTimerInterval = null;
              }
              set({ sleepTimerEnd: null, sleepTimerMode: 'time' });
              useToastStore.getState().addToast('Sleep timer reached. Playback paused.', 'info');
            }
          }, 1000);
        },

        /**
         * Plays the specified track, configuring AudioEngine and updating state.
         * Extracts side effects out of set() updater closure (P-1, P-9).
         * @param {Track} track 
         */
        play: (track) => {
          if (!track) return;
          
          const state = get();
          let newQueue = state.queue;
          let newIndex = state.queueIndex;
          
          if (!state.currentTrack || state.currentTrack.id !== track.id) {
            const existingIdx = state.queue.findIndex(t => t.id === track.id);
            if (existingIdx !== -1) {
              newIndex = existingIdx;
            } else {
              newQueue = [track];
              newIndex = 0;
            }
          }

          if (track.streamUrl) {
            try {
              const { playbackSpeed } = usePreferenceStore.getState();
              AudioEngine.playTrack(track.streamUrl, state.volume);
              AudioEngine.setPlaybackSpeed(playbackSpeed);
              AudioEngine.updateMediaSession(track);
            } catch (error) {
              // P-4: Robust AudioEngine operations error handling
              console.error('AudioEngine.playTrack failed:', error);
              useToastStore.getState().addToast('Playback failed to start', 'error');
              return;
            }
          }

          set({
            currentTrack: track,
            queue: newQueue,
            queueIndex: newIndex,
            isPlaying: true,
            progress: 0,
          });
          
          try {
            discordService.updatePresence(track, true);
          } catch {
            /* Ignored */
          }
          
          // P-3: Catch potential Dexie addToRecentlyPlayed failures
          useLibraryStore.getState().addToRecentlyPlayed(track).catch((err) => {
            console.error('Failed to log recently played:', err);
          });
        },

        pause: () => {
          try {
            AudioEngine.pause();
          } catch (error) {
            console.error('AudioEngine.pause failed:', error);
          }
          set({ isPlaying: false });
          const cur = get().currentTrack;
          if (cur) {
            try { discordService.updatePresence(cur, false); } catch { /* Ignored */ }
          }
        },

        resume: () => {
          try {
            AudioEngine.resume();
          } catch (error) {
            console.error('AudioEngine.resume failed:', error);
            useToastStore.getState().addToast('Failed to resume playback', 'error');
            return;
          }
          set({ isPlaying: true });
          const cur = get().currentTrack;
          if (cur) {
            try { discordService.updatePresence(cur, true); } catch { /* Ignored */ }
          }
        },

        /**
         * Set the playback volume (clamped between 0 and 1) (P-6).
         * @param {number} volume 
         */
        setVolume: (volume) => {
          const clamped = Math.max(0, Math.min(1, Number.isNaN(volume) || typeof volume !== 'number' ? 1 : volume));
          try {
            AudioEngine.setVolume(clamped);
          } catch (error) {
            console.error('AudioEngine.setVolume failed:', error);
          }
          set({ volume: clamped, isMuted: clamped === 0 });
        },

        toggleMute: () => {
          const state = get();
          try {
            if (state.isMuted) {
              const newVol = state.previousVolume > 0 ? state.previousVolume : 1;
              AudioEngine.setVolume(newVol);
              set({ volume: newVol, isMuted: false });
            } else {
              AudioEngine.setVolume(0);
              set({ isMuted: true, previousVolume: state.volume, volume: 0 });
            }
          } catch (error) {
            console.error('AudioEngine.toggleMute failed:', error);
          }
        },
        
        /**
         * Seeks playback progress to a specific duration in seconds (clamped >= 0) (P-6).
         * @param {number} seconds 
         */
        seek: (seconds) => {
          const clamped = Math.max(0, Number.isNaN(seconds) || typeof seconds !== 'number' ? 0 : seconds);
          try {
            AudioEngine.seek(clamped);
          } catch (error) {
            console.error('AudioEngine.seek failed:', error);
          }
          set({ progress: clamped });
        },

        next: () => {
          const { queue, queueIndex, loopMode, sleepTimerMode, play, pause } = get();
          if (queue.length === 0) return;

          if (sleepTimerMode === 'endOfTrack') {
            pause();
            set({ sleepTimerEnd: null, sleepTimerMode: 'time' });
            useToastStore.getState().addToast('Sleep timer reached. Playback paused.', 'info');
            return;
          }

          let nextIndex = queueIndex + 1;
          if (nextIndex >= queue.length) {
            if (loopMode === 'all') {
              nextIndex = 0;
            } else {
              try {
                AudioEngine.pause();
              } catch (error) {
                console.error('AudioEngine.pause failed:', error);
              }
              set({ isPlaying: false, progress: 0 });
              return;
            }
          }
          
          play(queue[nextIndex]);
        },

        prev: () => {
          const { queue, queueIndex, progress, play } = get();
          if (queue.length === 0) return;

          if (progress > 3) {
            try {
              AudioEngine.seek(0);
            } catch (error) {
              console.error('AudioEngine.seek failed:', error);
            }
            set({ progress: 0 });
            return;
          }

          let prevIndex = queueIndex - 1;
          if (prevIndex < 0) prevIndex = 0;
          
          play(queue[prevIndex]);
        },

        toggleLoop: () => set((state) => {
          const nextMode = { none: 'all', all: 'one', one: 'none' };
          return { loopMode: nextMode[state.loopMode] };
        }),

        /**
         * Inserts a track directly after the active track in the playback queue.
         * Adjusts the current index correctly if the track was shifted (P-2).
         * @param {Track} track 
         */
        playNext: (track) => {
          if (!track) return;
          let newQueueIndex = 0;
          let filteredQueue = [];
          
          set((state) => {
            const currentIdx = state.queue.findIndex(t => t.id === track.id);
            const wasRemoved = currentIdx !== -1;
            filteredQueue = state.queue.filter(t => t.id !== track.id);
            const insertIdx = state.queueIndex !== -1 ? state.queueIndex + 1 : 0;
            // Adjust if the removed element was before the current position in the queue
            const adjustedInsertIdx = (wasRemoved && currentIdx < state.queueIndex) ? insertIdx - 1 : insertIdx;
            filteredQueue.splice(Math.max(0, adjustedInsertIdx), 0, track);
            const newCurrentIdx = filteredQueue.findIndex(t => t.id === state.currentTrack?.id);
            newQueueIndex = newCurrentIdx !== -1 ? newCurrentIdx : 0;
            return { queue: filteredQueue, queueIndex: newQueueIndex };
          });
          
          useToastStore.getState().addToast(`Added "${track.title}" to play next`, 'success');
        },

        /**
         * Appends tracks to the queue, ensuring no duplicate entries are introduced.
         * @param {Track|Track[]} tracks 
         */
        addToQueue: (tracks) => {
          const toAdd = Array.isArray(tracks) ? tracks : [tracks];
          let uniqueToAdd = [];
          
          set((state) => {
            const existingIds = new Set(state.queue.map(t => t.id));
            uniqueToAdd = toAdd.filter(t => !existingIds.has(t.id));
            return { queue: [...state.queue, ...uniqueToAdd] };
          });
          
          if (uniqueToAdd.length === 1) {
            useToastStore.getState().addToast(`Added "${uniqueToAdd[0].title}" to queue`, 'success');
          } else if (uniqueToAdd.length > 1) {
            useToastStore.getState().addToast(`Added ${uniqueToAdd.length} tracks to queue`, 'success');
          }
        },

        removeFromQueue: (index) => set((state) => {
          if (index === state.queueIndex) return state; // Don't remove currently playing track from here
          const newQueue = [...state.queue];
          newQueue.splice(index, 1);
          
          // Adjust queue index if an earlier item was removed
          let newIndex = state.queueIndex;
          if (index < state.queueIndex) {
            newIndex -= 1;
          }
          return { queue: newQueue, queueIndex: newIndex };
        }),

        clearQueue: () => {
          set((state) => {
            if (!state.currentTrack) return { queue: [], queueIndex: -1 };
            return {
              queue: [state.currentTrack],
              queueIndex: 0
            };
          });
          useToastStore.getState().addToast('Queue cleared', 'info');
        },

        reorderQueue: (newQueue) => set((state) => {
          // Re-evaluate current track index after reordering
          const newCurrentIdx = newQueue.findIndex(t => t.id === state.currentTrack?.id);
          return { 
            queue: newQueue, 
            queueIndex: newCurrentIdx !== -1 ? newCurrentIdx : 0 
          };
        }),

        shuffleQueue: () => set((state) => {
          if (state.queue.length <= 1) return state;
          
          // Keep current track at the current position, shuffle the rest
          const current = state.queue[state.queueIndex];
          const upcoming = state.queue.slice(state.queueIndex + 1);
          const history = state.queue.slice(0, state.queueIndex);
          
          // Fisher-Yates shuffle on upcoming
          for (let i = upcoming.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [upcoming[i], upcoming[j]] = [upcoming[j], upcoming[i]];
          }
          
          return { 
            queue: [...history, current, ...upcoming],
            isShuffled: !state.isShuffled 
          };
        })
      };
    },
    {
      name: 'moonplayer-playback',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        currentTrack: state.currentTrack,
        queue: state.queue,
        queueIndex: state.queueIndex,
        volume: state.volume,
        loopMode: state.loopMode,
        isShuffled: state.isShuffled,
        isMuted: state.isMuted,
        previousVolume: state.previousVolume
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          try {
            // P-8: Wrap rehydration volume init in try/catch guard
            AudioEngine.setVolume(state.volume);
          } catch (error) {
            console.error('AudioEngine.setVolume failed during storage rehydration:', error);
          }
        }
      }
    }
  )
);

// P-5: Expose static API callbacks using the declared usePlayerStore reference
// directly. Eliminates module-scoped mutable variables.
AudioEngine.onEndCallback = () => {
  const state = usePlayerStore.getState();
  if (state.loopMode === 'one') {
    state.play(state.currentTrack); // replay current
  } else {
    state.next();
  }
};

AudioEngine.onPlayCallback = () => {
  usePlayerStore.setState({ isPlaying: true });
  const track = usePlayerStore.getState().currentTrack;
  if (track) {
    try { discordService.updatePresence(track, true); } catch { /* Ignored */ }
  }
};

AudioEngine.onPauseCallback = () => {
  usePlayerStore.setState({ isPlaying: false });
  const track = usePlayerStore.getState().currentTrack;
  if (track) {
    try { discordService.updatePresence(track, false); } catch { /* Ignored */ }
  }
};

AudioEngine.onProgressCallback = (seconds) => {
  usePlayerStore.setState({ progress: seconds });
};

AudioEngine.onErrorCallback = async (_message, _rawErr) => {
  const { currentTrack } = usePlayerStore.getState();
  if (!currentTrack) return;

  try {
    const { trackReplacementService } = await import('../core/api/trackReplacementService');
    const replaced = await trackReplacementService.attemptReplacement(currentTrack, usePlayerStore);
    if (!replaced) {
      usePlayerStore.setState({ failedTrack: currentTrack });
    }
  } catch {
    usePlayerStore.setState({ failedTrack: currentTrack });
  }
};

usePreferenceStore.subscribe((state, prev) => {
  if (state.crossfade !== prev.crossfade) {
    AudioEngine.crossfadeDuration = state.crossfade || 0;
  }
});
