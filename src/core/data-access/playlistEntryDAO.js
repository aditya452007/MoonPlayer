import { db } from '../db/schema';

export const playlistEntryDAO = {
  async getByPlaylist(playlistId) {
    return db.playlist_entries
      .where('playlistId')
      .equals(playlistId)
      .sortBy('order');
  },

  async add(playlistId, trackId) {
    const entries = await this.getByPlaylist(playlistId);
    const maxOrder = entries.length > 0 ? entries[entries.length - 1].order : -1;
    return db.playlist_entries.add({
      id: `${playlistId}_${trackId}`,
      playlistId,
      trackId,
      order: maxOrder + 1,
      addedAt: Date.now(),
    });
  },

  async remove(playlistId, trackId) {
    return db.playlist_entries
      .where('[playlistId+trackId]')
      .equals([playlistId, trackId])
      .delete();
  },

  async reorder(playlistId, trackIds) {
    await db.transaction('rw', db.playlist_entries, async () => {
      await db.playlist_entries
        .where('playlistId')
        .equals(playlistId)
        .delete();
      await db.playlist_entries.bulkAdd(
        trackIds.map((trackId, idx) => ({
          id: `${playlistId}_${trackId}`,
          playlistId,
          trackId,
          order: idx,
          addedAt: Date.now(),
        }))
      );
    });
  },
};
