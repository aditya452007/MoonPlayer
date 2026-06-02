import { create } from 'zustand';
import { db } from '../core/db/schema';

export const useUsageStore = create((set, get) => ({
  artistPlayCounts: {},
  genrePlayCounts: {},
  lastUpdated: 0,

  hydrate: async () => {
    const stored = await db.preferences.get('usage_stats');
    if (stored) {
      set({
        artistPlayCounts: stored.artistPlayCounts || {},
        genrePlayCounts: stored.genrePlayCounts || {},
        lastUpdated: stored.lastUpdated || 0,
      });
    }
  },

  recordPlay: async (track) => {
    set(state => {
      const newArtistCounts = { ...state.artistPlayCounts };
      (track.artistNames || []).forEach(a => {
        newArtistCounts[a] = (newArtistCounts[a] || 0) + 1;
      });
      return { artistPlayCounts: newArtistCounts, lastUpdated: Date.now() };
    });
    await get().persist();
  },

  persist: async () => {
    const { artistPlayCounts, genrePlayCounts, lastUpdated } = get();
    await db.preferences.put({ id: 'usage_stats', artistPlayCounts, genrePlayCounts, lastUpdated });
  },
}));
