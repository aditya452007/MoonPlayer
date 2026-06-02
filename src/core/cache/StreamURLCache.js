import { db } from '../db/schema';
import { CacheLRU } from '../utils/CacheLRU';

const STREAM_TTL = 24 * 60 * 60 * 1000;
const L1 = new CacheLRU(200, STREAM_TTL);

export const StreamURLCache = {
  async get(trackId) {
    const l1 = L1.get(trackId);
    if (l1) return l1;

    const entry = await db.cache.get(trackId);
    if (entry && entry.expiresAt > Date.now()) {
      L1.set(trackId, entry.value);
      return entry.value;
    }
    return null;
  },

  async set(trackId, streamUrl) {
    L1.set(trackId, streamUrl);
    await db.cache.put({
      key: trackId,
      value: streamUrl,
      expiresAt: Date.now() + STREAM_TTL,
    });
  },

  async invalidate(trackId) {
    L1.delete(trackId);
    await db.cache.delete(trackId);
  },

  async clear() {
    L1.clear();
    await db.cache.clear();
  },
};
