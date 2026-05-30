import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AudioEngine } from '../core/audio/AudioEngine';
import { useLibraryStore } from './libraryStore';
import { usePreferenceStore } from './preferenceStore';
import { useToastStore } from './toastStore';

// Wire up AudioEngine callbacks to a standalone updater 
// so we don't have to keep binding/unbinding in the React tree.
let storeAPI = null;

AudioEngine.onEndCallback = () => {
  if (storeAPI) {
    const state = storeAPI.getState();
    
    if (state.loopMode === 'one') {
      storeAPI.getState().play(state.currentTrack); // replay current
    } else {
      storeAPI.getState().next();
    }
  }
};

AudioEngine.onPlayCallback = () => {
  if (storeAPI) storeAPI.setState({ isPlaying: true });
};

AudioEngine.onPauseCallback = () => {
  if (storeAPI) storeAPI.setState({ isPlaying: false });
};

AudioEngine.onProgressCallback = (seconds) => {
  if (storeAPI) storeAPI.setState({ progress: seconds });
};

export const usePlayerStore = create(
  persist(
    (set, get) => {
      // Expose the API to the outer scope for AudioEngine callbacks
      storeAPI = { getState: get, setState: set };

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

        // Actions
        toggleQueueVisibility: () => set((state) => ({ isQueueVisible: !state.isQueueVisible })),
        setQueueVisibility: (isVisible) => set({ isQueueVisible: isVisible }),
        toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
        setFullscreen: (isFullscreen) => set({ isFullscreen }),
        toggleLyrics: () => set((state) => ({ isLyricsVisible: !state.isLyricsVisible })),
        setLyricsVisible: (isLyricsVisible) => set({ isLyricsVisible }),

        play: (track) => {
          set((state) => {
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
              const { playbackSpeed } = usePreferenceStore.getState();
              AudioEngine.playTrack(track.streamUrl, state.volume);
              AudioEngine.setPlaybackSpeed(playbackSpeed);
              AudioEngine.updateMediaSession(track);
            }

            return {
              currentTrack: track,
              queue: newQueue,
              queueIndex: newIndex,
              isPlaying: true,
              progress: 0,
            };
          });
          
          // Log to recently played
          useLibraryStore.getState().addToRecentlyPlayed(track);
        },

        pause: () => {
          AudioEngine.pause();
          set({ isPlaying: false });
        },

        resume: () => {
          AudioEngine.resume();
          set({ isPlaying: true });
        },

        setVolume: (volume) => {
          AudioEngine.setVolume(volume);
          set({ volume, isMuted: volume === 0 });
        },

        toggleMute: () => set((state) => {
          if (state.isMuted) {
            const newVol = state.previousVolume > 0 ? state.previousVolume : 1;
            AudioEngine.setVolume(newVol);
            return { volume: newVol, isMuted: false };
          } else {
            AudioEngine.setVolume(0);
            return { isMuted: true, previousVolume: state.volume, volume: 0 };
          }
        }),
        
        seek: (seconds) => {
          AudioEngine.seek(seconds);
          set({ progress: seconds });
        },

        next: () => {
          const { queue, queueIndex, loopMode, play } = get();
          if (queue.length === 0) return;

          let nextIndex = queueIndex + 1;
          if (nextIndex >= queue.length) {
            if (loopMode === 'all') {
              nextIndex = 0;
            } else {
              AudioEngine.pause();
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
            AudioEngine.seek(0);
            set({ progress: 0 });
            return;
          }

          let prevIndex = queueIndex - 1;
          if (prevIndex < 0) prevIndex = 0;
          
          play(queue[prevIndex]);
        },

        toggleLoop: () => set((state) => {
          const next = { none: 'all', all: 'one', one: 'none' };
          return { loopMode: next[state.loopMode] };
        }),

        // Queue Management Actions
        playNext: (track) => set((state) => {
          const newQueue = [...state.queue];
          // Remove if it already exists to avoid duplicates
          const filteredQueue = newQueue.filter(t => t.id !== track.id);
          // Insert after current track
          const insertIdx = state.queueIndex !== -1 ? state.queueIndex + 1 : 0;
          filteredQueue.splice(insertIdx, 0, track);
          
          // Re-evaluate current index if it shifted
          const newCurrentIdx = filteredQueue.findIndex(t => t.id === state.currentTrack?.id);
          
          useToastStore.getState().addToast(`Added "${track.title}" to play next`, 'success');
          
          return { queue: filteredQueue, queueIndex: newCurrentIdx !== -1 ? newCurrentIdx : 0 };
        }),

        addToQueue: (tracks) => set((state) => {
          const toAdd = Array.isArray(tracks) ? tracks : [tracks];
          // Filter out tracks already in queue
          const existingIds = new Set(state.queue.map(t => t.id));
          const uniqueToAdd = toAdd.filter(t => !existingIds.has(t.id));
          
          if (uniqueToAdd.length === 1) {
            useToastStore.getState().addToast(`Added "${uniqueToAdd[0].title}" to queue`, 'success');
          } else if (uniqueToAdd.length > 1) {
            useToastStore.getState().addToast(`Added ${uniqueToAdd.length} tracks to queue`, 'success');
          }
          
          return { queue: [...state.queue, ...uniqueToAdd] };
        }),

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

        clearQueue: () => set((state) => {
          useToastStore.getState().addToast('Queue cleared', 'info');
          if (!state.currentTrack) return { queue: [], queueIndex: -1 };
          return {
            queue: [state.currentTrack],
            queueIndex: 0
          };
        }),

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
          
          // Keep current track at the current position, shuffle the rest (or shuffle upcoming)
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
        previousVolume: state.previousVolume,
        isFullscreen: state.isFullscreen,
        isLyricsVisible: state.isLyricsVisible
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          AudioEngine.setVolume(state.volume);
        }
      }
    }
  )
);
