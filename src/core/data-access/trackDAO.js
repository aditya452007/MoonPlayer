import { db } from '../db/schema';

export const trackDAO = {
  async get(id) {
    const track = await db.tracks.get(id);
    return track || null;
  },

  async put(track) {
    return db.tracks.put(track);
  },

  async delete(id) {
    return db.tracks.delete(id);
  },

  async getAll() {
    return db.tracks.toArray();
  },

  async getByAlbum(albumId) {
    return db.tracks
      .where('[albumId+id]')
      .between([albumId, ''], [albumId, '\uffff'])
      .toArray();
  },

  async bulkPut(tracks) {
    return db.tracks.bulkPut(tracks, { allKeys: true });
  },
};
