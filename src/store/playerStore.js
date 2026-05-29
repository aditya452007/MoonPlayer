import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const usePlayerStore = create(
  persist(
    (set, get) => ({
      currentTrack: null, // Track object
      queue: [],          // Array of Track objects
      queueIndex: -1,
      isPlaying: false,
      volume: 1,
      loopMode: 'none',   // 'none', 'all', 'one'
      isShuffled: false,

      // Actions
      play: (track) => {
        set((state) => {
          // If we just clicked a track not in queue, start a new queue
          const newQueue = [track];
          return {
            currentTrack: track,
            queue: newQueue,
            queueIndex: 0,
            isPlaying: true,
          };
        });
      },

      pause: () => set({ isPlaying: false }),
      resume: () => set({ isPlaying: true }),

      setVolume: (volume) => set({ volume }),
      
      toggleLoop: () => set((state) => {
        const next = { none: 'all', all: 'one', one: 'none' };
        return { loopMode: next[state.loopMode] };
      }),

      // We'll expand next(), prev(), shuffle(), and addToQueue() in Phase 4 
      // when we integrate the audio engine.
    }),
    {
      name: 'moonplayer-playback', // unique name in localStorage
      storage: createJSONStorage(() => localStorage),
      // We don't persist 'isPlaying' so it doesn't auto-play on refresh
      partialize: (state) => ({ 
        currentTrack: state.currentTrack,
        queue: state.queue,
        queueIndex: state.queueIndex,
        volume: state.volume,
        loopMode: state.loopMode,
        isShuffled: state.isShuffled
      }),
    }
  )
);
