import { db } from './schema';

const MIGRATIONS = {
  v4_add_favorites_index: async () => {
    const count = await db.recently_played.count();
    if (count > 100) {
      const oldest = await db.recently_played
        .orderBy('playedAt')
        .limit(count - 100)
        .toArray();
      await db.recently_played.bulkDelete(oldest.map(r => r.trackId));
    }
  },
};

export async function runPostMigration() {
  const pref = await db.preferences.get('migration_state');
  const lastMigration = pref?.lastMigration;
  const keys = Object.keys(MIGRATIONS);

  for (const key of keys) {
    if (!lastMigration || keys.indexOf(key) > keys.indexOf(lastMigration)) {
      console.warn(`Running migration: ${key}`);
      await MIGRATIONS[key]();
      await db.preferences.put({ id: 'migration_state', lastMigration: key });
    }
  }
}
