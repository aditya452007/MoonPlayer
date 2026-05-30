import { create } from 'zustand';
import { db } from '../core/db/schema';
import { useToastStore } from './toastStore';

/**
 * @typedef {Object} Track
 * @property {string} id - Unique track identifier.
 * @property {string} title - Track title.
 * @property {string[]} artistNames - Names of the artists.
 * @property {string} streamUrl - Audio source URL.
 * @property {number} duration - Track duration in seconds.
 * @property {string} imageUrl - Album/Track cover image URL.
 * @property {string|null} [lyricsId] - Optional native lyrics ID.
 */

/**
 * @typedef {Object} Playlist
 * @property {string} id - Unique playlist identifier.
 * @property {string} name - Playlist name.
 * @property {Track[]} tracks - Array of tracks.
 * @property {number} dateUpdated - Epoch timestamp of last update.
 * @property {string|null} coverImage - Image URL of the playlist cover.
 */

export const useLibraryStore = create((set, get) => ({
  playlists: [],
  likedSongs: [], 
  recentlyPlayed: [],
  isHydrated: false,
  hydrationError: null,

  hydrate: async () => {
    try {
      set({ hydrationError: null });
      const allPlaylists = await db.playlists.toArray();
      const likedPlaylist = allPlaylists.find(p => p.id === 'liked_songs');
      const customPlaylists = allPlaylists.filter(p => p.id !== 'liked_songs' && p.id !== 'recently_played');
      
      const recentlyPlayedPlaylist = allPlaylists.find(p => p.id === 'recently_played');

      set({
        playlists: customPlaylists,
        likedSongs: likedPlaylist ? likedPlaylist.tracks : [],
        recentlyPlayed: recentlyPlayedPlaylist ? recentlyPlayedPlaylist.tracks : [],
        isHydrated: true,
        hydrationError: null
      });
    } catch (error) {
      console.error('Failed to hydrate library:', error);
      set({ 
        isHydrated: true, 
        hydrationError: error.message || 'Failed to load library database' 
      });
    }
  },

  /**
   * Creates a new playlist in memory and persists to IndexedDB.
   * @param {string} name 
   */
  createPlaylist: async (name) => {
    const newPlaylist = {
      id: crypto.randomUUID(),
      name,
      tracks: [],
      dateUpdated: Date.now(),
      coverImage: null, // L-4: Retained null as consistent placeholder
    };
    
    const previousPlaylists = get().playlists;
    set((state) => ({ playlists: [...state.playlists, newPlaylist] }));

    try {
      await db.playlists.put(newPlaylist);
      useToastStore.getState().addToast(`Playlist "${name}" created`, 'success');
    } catch (error) {
      console.error('Failed to create playlist in DB:', error);
      // L-2: Rollback on database failure
      set({ playlists: previousPlaylists });
      useToastStore.getState().addToast('Failed to create playlist', 'error');
    }
  },

  /**
   * Deletes a playlist in memory and persists to IndexedDB.
   * @param {string} playlistId 
   */
  deletePlaylist: async (playlistId) => {
    const previousPlaylists = get().playlists;
    const target = previousPlaylists.find(p => p.id === playlistId);
    
    // L-3: Guard and notify if playlist does not exist
    if (!target) {
      console.warn(`Playlist ${playlistId} not found for deletion`);
      useToastStore.getState().addToast('Playlist not found', 'error');
      return;
    }

    set((state) => ({ playlists: state.playlists.filter(p => p.id !== playlistId) }));

    try {
      await db.playlists.delete(playlistId);
      useToastStore.getState().addToast(`Playlist "${target.name}" deleted`, 'success');
    } catch (error) {
      console.error('Failed to delete playlist in DB:', error);
      set({ playlists: previousPlaylists });
      useToastStore.getState().addToast('Failed to delete playlist', 'error');
    }
  },

  /**
   * Renames an existing playlist.
   * @param {string} playlistId 
   * @param {string} newName 
   */
  renamePlaylist: async (playlistId, newName) => {
    const { playlists } = get();
    const target = playlists.find(p => p.id === playlistId);
    
    if (!target) {
      console.warn(`Playlist ${playlistId} not found for renaming`);
      useToastStore.getState().addToast('Playlist not found', 'error');
      return;
    }

    const previousPlaylists = playlists;
    const updated = { ...target, name: newName, dateUpdated: Date.now() };
    set({ playlists: playlists.map(p => p.id === playlistId ? updated : p) });

    try {
      await db.playlists.put(updated);
      useToastStore.getState().addToast(`Playlist renamed to "${newName}"`, 'success');
    } catch (error) {
      console.error('Failed to rename playlist in DB:', error);
      set({ playlists: previousPlaylists });
      useToastStore.getState().addToast('Failed to rename playlist', 'error');
    }
  },

  /**
   * Adds a track to a custom playlist.
   * @param {string} playlistId 
   * @param {Track} track 
   */
  addTrackToPlaylist: async (playlistId, track) => {
    const { playlists } = get();
    const target = playlists.find(p => p.id === playlistId);
    
    if (!target) {
      console.warn(`Playlist ${playlistId} not found for adding track`);
      useToastStore.getState().addToast('Playlist not found', 'error');
      return;
    }

    // Don't add if it already exists in the playlist
    if (target.tracks.some(t => t.id === track.id)) {
      useToastStore.getState().addToast(`"${track.title}" is already in this playlist`, 'info');
      return;
    }

    const previousPlaylists = playlists;
    const updated = { ...target, tracks: [...target.tracks, track], dateUpdated: Date.now() };
    set({ playlists: playlists.map(p => p.id === playlistId ? updated : p) });

    try {
      await db.playlists.put(updated);
      useToastStore.getState().addToast(`Added "${track.title}" to playlist`, 'success');
    } catch (error) {
      console.error('Failed to add track to playlist in DB:', error);
      set({ playlists: previousPlaylists });
      useToastStore.getState().addToast('Failed to add song to playlist', 'error');
    }
  },

  /**
   * Removes a track from a custom playlist.
   * @param {string} playlistId 
   * @param {string} trackId 
   */
  removeTrackFromPlaylist: async (playlistId, trackId) => {
    const { playlists } = get();
    const target = playlists.find(p => p.id === playlistId);
    
    if (!target) {
      console.warn(`Playlist ${playlistId} not found for removing track`);
      useToastStore.getState().addToast('Playlist not found', 'error');
      return;
    }

    const previousPlaylists = playlists;
    const trackToRemove = target.tracks.find(t => t.id === trackId);
    const updated = { 
      ...target, 
      tracks: target.tracks.filter(t => t.id !== trackId),
      dateUpdated: Date.now() 
    };
    set({ playlists: playlists.map(p => p.id === playlistId ? updated : p) });

    try {
      await db.playlists.put(updated);
      if (trackToRemove) {
        useToastStore.getState().addToast(`Removed "${trackToRemove.title}" from playlist`, 'info');
      }
    } catch (error) {
      console.error('Failed to remove track from playlist in DB:', error);
      set({ playlists: previousPlaylists });
      useToastStore.getState().addToast('Failed to remove song', 'error');
    }
  },

  /**
   * Likes/Unlikes a track (adds/removes from liked songs playlist).
   * @param {Track} track 
   */
  toggleLikeTrack: async (track) => {
    const { likedSongs } = get();
    const isLiked = likedSongs.some(t => t.id === track.id);
    
    let newLikedSongs;
    if (isLiked) {
      newLikedSongs = likedSongs.filter(t => t.id !== track.id);
    } else {
      newLikedSongs = [...likedSongs, track];
    }
    
    const previousLikedSongs = likedSongs;
    set({ likedSongs: newLikedSongs });

    try {
      await db.playlists.put({
        id: 'liked_songs',
        name: 'Liked Songs',
        tracks: newLikedSongs,
        dateUpdated: Date.now()
      });
      useToastStore.getState().addToast(
        isLiked ? `Removed "${track.title}" from Liked Songs` : `Added "${track.title}" to Liked Songs`,
        'success'
      );
    } catch (error) {
      console.error('Failed to toggle like in DB:', error);
      set({ likedSongs: previousLikedSongs });
      useToastStore.getState().addToast('Failed to update Liked Songs', 'error');
    }
  },

  /**
   * Adds a track to recently played history list.
   * @param {Track} track 
   */
  addToRecentlyPlayed: async (track) => {
    const { recentlyPlayed } = get();
    
    // Remove if exists to move it to the top
    const filtered = recentlyPlayed.filter(t => t.id !== track.id);
    const newRecent = [track, ...filtered].slice(0, 20); // Keep max 20
    
    const previousRecentlyPlayed = recentlyPlayed;
    set({ recentlyPlayed: newRecent });

    try {
      await db.playlists.put({
        id: 'recently_played',
        name: 'Recently Played',
        tracks: newRecent,
        dateUpdated: Date.now()
      });
    } catch (error) {
      console.error('Failed to add to recently played in DB:', error);
      set({ recentlyPlayed: previousRecentlyPlayed });
    }
  }
}));
