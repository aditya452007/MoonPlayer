import { db } from '../db/schema';

const PREF_ID = 'user_prefs';

export const preferenceDAO = {
  async get() {
    const prefs = await db.preferences.get(PREF_ID);
    return prefs || null;
  },

  async upsert(key, value) {
    const existing = (await db.preferences.get(PREF_ID)) || { id: PREF_ID };
    existing[key] = value;
    return db.preferences.put(existing);
  },

  async replace(prefs) {
    return db.preferences.put({ ...prefs, id: PREF_ID });
  },

  async delete() {
    return db.preferences.delete(PREF_ID);
  },
};
