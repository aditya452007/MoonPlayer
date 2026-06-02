import { create } from 'zustand';
import { db } from '../core/db/schema';

const MAX_HISTORY = 20;

export const useHistoryStore = create((set, get) => ({
  recentlyPlayed: [],
  isHydrated: false,

  hydrate: async () => {
    const playlist = await db.playlists.get('recently_played');
    set({ recentlyPlayed: playlist?.tracks || [], isHydrated: true });
  },

  addTrack: async (track) => {
    const { recentlyPlayed } = get();
    const filtered = recentlyPlayed.filter(t => t.id !== track.id);
    const updated = [track, ...filtered].slice(0, MAX_HISTORY);
    set({ recentlyPlayed: updated });
    try {
      const { RecentlyPlayedSync } = await import('../core/cache/RecentlyPlayedSync');
      RecentlyPlayedSync.push(track);
    } catch (e) {
      console.warn('RecentlyPlayedSync failed:', e);
    }
  },
}));
