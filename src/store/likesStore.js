import { create } from 'zustand';
import { db } from '../core/db/schema';
import { useToastStore } from './toastStore';

export const useLikesStore = create((set, get) => ({
  likedSongs: [],
  isHydrated: false,

  hydrate: async () => {
    const playlist = await db.playlists.get('liked_songs');
    set({ likedSongs: playlist?.tracks || [], isHydrated: true });
  },

  isLiked: (trackId) => get().likedSongs.some(t => t.id === trackId),

  toggleLike: async (track) => {
    const { likedSongs } = get();
    const isLiked = likedSongs.some(t => t.id === track.id);
    const newLiked = isLiked
      ? likedSongs.filter(t => t.id !== track.id)
      : [...likedSongs, track];
    const prev = likedSongs;
    set({ likedSongs: newLiked });
    try {
      await db.playlists.put({ id: 'liked_songs', name: 'Liked Songs', tracks: newLiked, dateUpdated: Date.now() });
      useToastStore.getState().addToast(
        isLiked ? `Removed "${track.title}" from Liked Songs` : `Added "${track.title}" to Liked Songs`,
        'success'
      );
    } catch (e) {
      set({ likedSongs: prev });
      throw e;
    }
  },
}));
