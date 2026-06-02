import { db } from '../db/schema';

const STALE_TTL = 5 * 60 * 1000;
const MAX_AGE = 30 * 60 * 1000;

export const HomeCache = {
  async getOrFetch(key, fetchFn) {
    const cached = await db.cache.get(key);
    const isFresh = cached && (Date.now() - cached.savedAt) < STALE_TTL;
    const isUsable = cached && (Date.now() - cached.savedAt) < MAX_AGE;

    if (isFresh) {
      return { data: cached.value, stale: false };
    }

    if (isUsable) {
      fetchFn().then(fresh => {
        db.cache.put({
          key,
          value: fresh,
          savedAt: Date.now(),
          expiresAt: Date.now() + MAX_AGE,
        }).catch(() => {});
      }).catch(() => {});
      return { data: cached.value, stale: true };
    }

    const fresh = await fetchFn();
    await db.cache.put({
      key,
      value: fresh,
      savedAt: Date.now(),
      expiresAt: Date.now() + MAX_AGE,
    }).catch(() => {});
    return { data: fresh, stale: false };
  },
};
