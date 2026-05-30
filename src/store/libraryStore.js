import { create } from 'zustand';
import { db } from '../core/db/schema';

export const useLibraryStore = create((set, get) => ({
  playlists: [],
  likedSongs: [], 
  recentlyPlayed: [],
  isHydrated: false,

  hydrate: async () => {
    try {
      const allPlaylists = await db.playlists.toArray();
      const likedPlaylist = allPlaylists.find(p => p.id === 'liked_songs');
      const customPlaylists = allPlaylists.filter(p => p.id !== 'liked_songs' && p.id !== 'recently_played');
      
      const recentlyPlayedPlaylist = allPlaylists.find(p => p.id === 'recently_played');

      set({
        playlists: customPlaylists,
        likedSongs: likedPlaylist ? likedPlaylist.tracks : [],
        recentlyPlayed: recentlyPlayedPlaylist ? recentlyPlayedPlaylist.tracks : [],
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

  deletePlaylist: async (playlistId) => {
    set((state) => ({ playlists: state.playlists.filter(p => p.id !== playlistId) }));
    await db.playlists.delete(playlistId);
  },

  renamePlaylist: async (playlistId, newName) => {
    const { playlists } = get();
    const target = playlists.find(p => p.id === playlistId);
    if (target) {
      const updated = { ...target, name: newName, dateUpdated: Date.now() };
      set({ playlists: playlists.map(p => p.id === playlistId ? updated : p) });
      await db.playlists.put(updated);
    }
  },

  addTrackToPlaylist: async (playlistId, track) => {
    const { playlists } = get();
    const target = playlists.find(p => p.id === playlistId);
    if (target) {
      // Don't add if it exists
      if (target.tracks.some(t => t.id === track.id)) return;
      const updated = { ...target, tracks: [...target.tracks, track], dateUpdated: Date.now() };
      set({ playlists: playlists.map(p => p.id === playlistId ? updated : p) });
      await db.playlists.put(updated);
    }
  },

  removeTrackFromPlaylist: async (playlistId, trackId) => {
    const { playlists } = get();
    const target = playlists.find(p => p.id === playlistId);
    if (target) {
      const updated = { 
        ...target, 
        tracks: target.tracks.filter(t => t.id !== trackId),
        dateUpdated: Date.now() 
      };
      set({ playlists: playlists.map(p => p.id === playlistId ? updated : p) });
      await db.playlists.put(updated);
    }
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
  },

  addToRecentlyPlayed: async (track) => {
    const { recentlyPlayed } = get();
    
    // Remove if exists to move it to the top
    const filtered = recentlyPlayed.filter(t => t.id !== track.id);
    const newRecent = [track, ...filtered].slice(0, 20); // Keep max 20
    
    set({ recentlyPlayed: newRecent });
    
    await db.playlists.put({
      id: 'recently_played',
      name: 'Recently Played',
      tracks: newRecent,
      dateUpdated: Date.now()
    });
  }
}));
