import { db } from '../db/schema';

const MAX_ERRORS = 100;

export const ErrorTracker = {
  async log(error, context = {}) {
    try {
      const entry = {
        id: crypto.randomUUID(),
        message: error.message,
        category: error.category || 'unknown',
        recoverable: error.recoverable !== false,
        recoveryHint: error.recoveryHint || null,
        stack: error.stack,
        context: JSON.stringify(context),
        timestamp: Date.now(),
      };

      await db.history.add(entry);

      const count = await db.history.count();
      if (count > MAX_ERRORS) {
        const oldest = await db.history
          .orderBy('timestamp')
          .limit(count - MAX_ERRORS)
          .toArray();
        await db.history.bulkDelete(oldest.map(e => e.id));
      }
    } catch (e) {
      console.warn('ErrorTracker failed to log:', e);
    }
  },

  async getRecent(limit = 20) {
    return db.history
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray();
  },

  async clear() {
    await db.history.clear();
  },
};
