import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AudioEngine } from '../core/audio/AudioEngine';

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

      return {
        currentTrack: null, // Track object
        queue: [],          // Array of Track objects
        queueIndex: -1,
        isPlaying: false,
        volume: 1,
        loopMode: 'none',   // 'none', 'all', 'one'
        isShuffled: false,
        progress: 0,

        // Actions
        play: (track) => {
          set((state) => {
            // If track is not the current one, update queue
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

            // Start audio playback
            if (track.streamUrl) {
              AudioEngine.playTrack(track.streamUrl, state.volume);
            }

            return {
              currentTrack: track,
              queue: newQueue,
              queueIndex: newIndex,
              isPlaying: true,
              progress: 0,
            };
          });
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
          set({ volume });
        },
        
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
              nextIndex = 0; // wrap around
            } else {
              // End of queue
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

          // If we are more than 3 seconds in, just restart current track
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
        isShuffled: state.isShuffled
      }),
      // On rehydrate, ensure audio engine volume is synced
      onRehydrateStorage: () => (state) => {
        if (state) {
          AudioEngine.setVolume(state.volume);
          // Note: We don't auto-resume playback on refresh
        }
      }
    }
  )
);
