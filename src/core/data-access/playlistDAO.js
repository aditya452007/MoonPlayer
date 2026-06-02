import { db } from '../db/schema';

export const playlistDAO = {
  async get(id) {
    return db.getPlaylistWithTracks(id);
  },

  async put(playlist) {
    const { tracks: _tracks, ...doc } = playlist;
    return db.playlists.put(doc);
  },

  async delete(id) {
    return db.transaction('rw', db.playlists, db.playlist_entries, async () => {
      await db.playlists.delete(id);
      await db.playlist_entries.where('playlistId').equals(id).delete();
    });
  },

  async getAll() {
    const lists = await db.playlists.toArray();
    const withTracks = [];
    for (const pl of lists) {
      const full = await db.getPlaylistWithTracks(pl.id);
      if (full) withTracks.push(full);
    }
    return withTracks;
  },
};
