import { create } from 'zustand';
import { db } from '../core/db/schema';

export const useLibraryStore = create((set, get) => ({
  playlists: [],
  likedSongs: [], // Technically a special playlist, but easier to track separately in UI
  isHydrated: false,

  hydrate: async () => {
    try {
      const allPlaylists = await db.playlists.toArray();
      const likedPlaylist = allPlaylists.find(p => p.id === 'liked_songs');
      const customPlaylists = allPlaylists.filter(p => p.id !== 'liked_songs');

      set({
        playlists: customPlaylists,
        likedSongs: likedPlaylist ? likedPlaylist.tracks : [],
        isHydrated: true
      });
    } catch (error) {
      console.error('Failed to hydrate library:', error);
      set({ isHydrated: true });
    }
  },

  createPlaylist: async (name) => {
    const newPlaylist = {
      id: crypto.randomUUID(),
      name,
      tracks: [],
      dateUpdated: Date.now(),
      coverImage: null,
    };
    
    set((state) => ({ playlists: [...state.playlists, newPlaylist] }));
    await db.playlists.put(newPlaylist);
  },

  toggleLikeTrack: async (track) => {
    const { likedSongs } = get();
    const isLiked = likedSongs.some(t => t.id === track.id);
    
    let newLikedSongs;
    if (isLiked) {
      newLikedSongs = likedSongs.filter(t => t.id !== track.id);
    } else {
      newLikedSongs = [...likedSongs, track];
    }
    
    set({ likedSongs: newLikedSongs });
    
    await db.playlists.put({
      id: 'liked_songs',
      name: 'Liked Songs',
      tracks: newLikedSongs,
      dateUpdated: Date.now()
    });
  }
}));
