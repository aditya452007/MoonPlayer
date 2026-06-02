import { create } from 'zustand';
import { playlistRepository } from '../core/repositories/PlaylistRepository';

export const useLibraryStore = create((set, get) => ({
  playlists: [],
  isHydrated: false,
  hydrationError: null,

  hydrate: async () => {
    try {
      const playlists = await playlistRepository.getAllPlaylists();
      const custom = playlists.filter(p => p.id !== 'liked_songs' && p.id !== 'recently_played');
      set({ playlists: custom, isHydrated: true, hydrationError: null });
    } catch (error) {
      set({ isHydrated: true, hydrationError: error.message });
    }
  },

  createPlaylist: async (name, description) => {
    const playlist = await playlistRepository.createPlaylist(name, description);
    set(s => ({ playlists: [...s.playlists, playlist] }));
    return playlist;
  },

  deletePlaylist: async (id) => {
    const prev = get().playlists;
    set(s => ({ playlists: s.playlists.filter(p => p.id !== id) }));
    try { 
      await playlistRepository.deletePlaylist(id); 
    } catch (e) { 
      set({ playlists: prev }); 
      throw e; 
    }
  },

  renamePlaylist: async (id, name) => {
    const updated = await playlistRepository.renamePlaylist(id, name);
    set(s => ({ playlists: s.playlists.map(p => p.id === id ? updated : p) }));
  },

  addTrackToPlaylist: async (playlistId, track) => {
    const updated = await playlistRepository.addTrack(playlistId, track);
    set(s => ({ playlists: s.playlists.map(p => p.id === playlistId ? updated : p) }));
  },

  removeTrackFromPlaylist: async (playlistId, trackId) => {
    const updated = await playlistRepository.removeTrack(playlistId, trackId);
    set(s => ({ playlists: s.playlists.map(p => p.id === playlistId ? updated : p) }));
  },

  reorderPlaylists: async (newOrder) => {
    set({ playlists: newOrder });
  }
}));
