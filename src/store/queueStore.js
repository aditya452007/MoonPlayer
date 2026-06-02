import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useToastStore } from './toastStore';

export const useQueueStore = create(
  persist(
    (set, _get) => ({
      queue: [],
      queueIndex: -1,

      setQueue: (tracks, startIndex = 0) => set({ queue: tracks, queueIndex: startIndex }),

      playNext: (track) => {
        if (!track) return;
        set(state => {
          const filtered = state.queue.filter(t => t.id !== track.id);
          const insertIdx = state.queueIndex + 1;
          filtered.splice(insertIdx, 0, track);
          return { queue: filtered };
        });
        useToastStore.getState().addToast(`Added "${track.title}" to play next`, 'success');
      },

      addToQueue: (tracks) => {
        const toAdd = Array.isArray(tracks) ? tracks : [tracks];
        let uniqueAddedCount = 0;
        set(state => {
          const existing = new Set(state.queue.map(t => t.id));
          const unique = toAdd.filter(t => !existing.has(t.id));
          uniqueAddedCount = unique.length;
          return { queue: [...state.queue, ...unique] };
        });
        if (uniqueAddedCount === 1) {
          const addedTrack = toAdd[0];
          useToastStore.getState().addToast(`Added "${addedTrack.title}" to queue`, 'success');
        } else if (uniqueAddedCount > 1) {
          useToastStore.getState().addToast(`Added ${uniqueAddedCount} tracks to queue`, 'success');
        }
      },

      removeFromQueue: (index) => set(state => {
        if (index === state.queueIndex) return state;
        const newQueue = [...state.queue];
        newQueue.splice(index, 1);
        const newIndex = index < state.queueIndex ? state.queueIndex - 1 : state.queueIndex;
        return { queue: newQueue, queueIndex: newIndex };
      }),

      clearQueue: () => {
        set(state => ({
          queue: state.queue.length > 0 ? [state.queue[state.queueIndex]] : [],
          queueIndex: 0,
        }));
        useToastStore.getState().addToast('Queue cleared', 'info');
      },

      reorderQueue: (newQueue) => set(state => {
        const idx = newQueue.findIndex(t => t.id === state.queue[state.queueIndex]?.id);
        return { queue: newQueue, queueIndex: idx >= 0 ? idx : 0 };
      }),

      shuffleQueue: () => set(state => {
        if (state.queue.length <= 1) return state;
        const current = state.queue[state.queueIndex];
        const rest = state.queue.filter((_, i) => i !== state.queueIndex);
        for (let i = rest.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [rest[i], rest[j]] = [rest[j], rest[i]];
        }
        return { queue: [current, ...rest], queueIndex: 0 };
      }),
    }),
    {
      name: 'moonplayer-queue',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
