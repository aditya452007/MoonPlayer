import Dexie from 'dexie';

/**
 * MoonDatabase Configuration
 * This is the central IndexedDB instance for local caching and persistence.
 * Note: Audio blobs are explicitly EXCLUDED per architectural decisions.
 */
export class MoonDatabase extends Dexie {
  constructor() {
    super('MoonDatabase');

    // Define schema versions and indices.
    // '&' indicates a unique index.
    this.version(1).stores({
      preferences: '&id', // Single row table for user settings (id: 'user_prefs')
      playlists: '&id, name, dateUpdated', 
      tracks: '&id, albumId', // Cached track metadata
      artists: '&id', // Cached artist metadata
      history: '&id, timestamp', // Last 20 played tracks
      lyrics: '&trackId' // Cached lyrics
    });

    this.version(2).stores({
      preferences: '&id',
      playlists: '&id, name, dateUpdated',
      tracks: '&id, albumId',
      artists: '&id',
      history: '&id, timestamp',
      lyrics: '&trackId',
      downloads: '&id, trackId, downloadedAt', // Persisted downloaded tracks
    });
  }
}

export const db = new MoonDatabase();
