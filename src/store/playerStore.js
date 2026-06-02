import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AudioEngine } from '../core/audio/AudioEngine';
import { useToastStore } from './toastStore';
import { useQueueStore } from './queueStore';
import { usePreferenceStore } from './preferenceStore';
import { discordService } from '../core/api/discordService';

let sleepTimerInterval = null;

export const usePlayerStore = create(
  persist(
    (set, get) => {
      AudioEngine.setMediaSessionHandlers({
        onPlay: () => get().resume(),
        onPause: () => get().pause(),
        onNext: () => get().next(),
        onPrev: () => get().prev(),
      });

      return {
        currentTrack: null,
        queue: [],
        queueIndex: -1,
        isPlaying: false,
        volume: 1,
        loopMode: 'none',
        isShuffled: false,
        progress: 0,
        isQueueVisible: false,
        isFullscreen: false,
        isLyricsVisible: false,
        isMuted: false,
        previousVolume: 1,
        sleepTimerEnd: null,
        sleepTimerMode: 'time',
        failedTrack: null,

        toggleQueueVisibility: () => set((state) => ({ isQueueVisible: !state.isQueueVisible })),
        setQueueVisibility: (isVisible) => set({ isQueueVisible: isVisible }),
        toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
        setFullscreen: (isFullscreen) => set({ isFullscreen }),
        toggleLyrics: () => set((state) => ({ isLyricsVisible: !state.isLyricsVisible })),
        setLyricsVisible: (isLyricsVisible) => set({ isLyricsVisible }),

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

        play: async (track) => {
          if (!track) return;

          const queueState = useQueueStore.getState();
          const existingIdx = queueState.queue.findIndex(t => t.id === track.id);
          let newQueue = queueState.queue;
          const newIndex = existingIdx !== -1 ? existingIdx : 0;
          if (existingIdx === -1) {
            newQueue = [track];
            useQueueStore.setState({ queue: newQueue, queueIndex: newIndex });
          }
          useQueueStore.setState({ queueIndex: newIndex });

          set({
            currentTrack: track,
            isPlaying: true,
            progress: 0,
            queue: newQueue,
            queueIndex: newIndex
          });

          const { playbackOrchestrator } = await import('../core/player/PlaybackOrchestrator');
          await playbackOrchestrator.play(track);
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

        stop: () => {
          try {
            AudioEngine.pause();
            AudioEngine.seek(0);
          } catch (error) {
            console.error('AudioEngine.stop failed:', error);
          }
          set({
            currentTrack: null,
            isPlaying: false,
            progress: 0,
            queue: [],
            queueIndex: -1
          });
          useQueueStore.setState({ queue: [], queueIndex: -1 });
          try {
            discordService.clearPresence();
          } catch {
            /* Ignored */
          }
        },

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
          const { loopMode, sleepTimerMode, play, pause } = get();
          const { queue, queueIndex } = useQueueStore.getState();
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

          useQueueStore.setState({ queueIndex: nextIndex });
          set({ queueIndex: nextIndex });
          play(queue[nextIndex]);
        },

        prev: () => {
          const { progress, play } = get();
          const { queue, queueIndex } = useQueueStore.getState();
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

          useQueueStore.setState({ queueIndex: prevIndex });
          set({ queueIndex: prevIndex });
          play(queue[prevIndex]);
        },

        toggleLoop: () => set((state) => {
          const nextMode = { none: 'all', all: 'one', one: 'none' };
          return { loopMode: nextMode[state.loopMode] };
        }),

        toggleShuffled: () => set((state) => ({ isShuffled: !state.isShuffled })),

        // Queue compatibility delegates
        addToQueue: (tracks) => {
          useQueueStore.getState().addToQueue(tracks);
          set({ queue: useQueueStore.getState().queue });
        },
        removeFromQueue: (index) => {
          useQueueStore.getState().removeFromQueue(index);
          const qs = useQueueStore.getState();
          set({ queue: qs.queue, queueIndex: qs.queueIndex });
        },
        clearQueue: () => {
          useQueueStore.getState().clearQueue();
          const qs = useQueueStore.getState();
          set({ queue: qs.queue, queueIndex: qs.queueIndex });
        },
        reorderQueue: (newQueue) => {
          useQueueStore.getState().reorderQueue(newQueue);
          const qs = useQueueStore.getState();
          set({ queue: qs.queue, queueIndex: qs.queueIndex });
        },
        shuffleQueue: () => {
          useQueueStore.getState().shuffleQueue();
          const qs = useQueueStore.getState();
          set({ queue: qs.queue, queueIndex: qs.queueIndex, isShuffled: !get().isShuffled });
        },
        playNext: (track) => {
          useQueueStore.getState().playNext(track);
          set({ queue: useQueueStore.getState().queue });
        },
      };
    },
    {
      name: 'moonplayer-playback',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentTrack: state.currentTrack,
        volume: state.volume,
        loopMode: state.loopMode,
        isShuffled: state.isShuffled,
        isMuted: state.isMuted,
        previousVolume: state.previousVolume,
        queue: state.queue,
        queueIndex: state.queueIndex,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          try {
            AudioEngine.setVolume(state.volume);
          } catch (error) {
            console.error('AudioEngine.setVolume failed during storage rehydration:', error);
          }
        }
      }
    }
  )
);

AudioEngine.onEndCallback = () => {
  const state = usePlayerStore.getState();
  if (state.loopMode === 'one') {
    state.play(state.currentTrack);
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
