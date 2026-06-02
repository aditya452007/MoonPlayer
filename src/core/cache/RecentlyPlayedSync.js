import { db } from '../db/schema';

let pending = [];
let timer = null;

const FLUSH_DEBOUNCE = 5000;

export const RecentlyPlayedSync = {
  push(track) {
    pending = pending.filter(t => t.id !== track.id);
    pending.push(track);
    if (pending.length >= 10) {
      this.flush();
    } else if (!timer) {
      timer = setTimeout(() => this.flush(), FLUSH_DEBOUNCE);
    }
  },

  async flush() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (pending.length === 0) return;
    const batch = [...pending];
    pending = [];
    try {
      const existing = await db.playlists.get('recently_played');
      const tracks = existing?.tracks || [];
      const merged = [...batch];
      for (const t of tracks) {
        if (!merged.some(m => m.id === t.id)) merged.push(t);
      }
      await db.playlists.put({
        id: 'recently_played',
        name: 'Recently Played',
        tracks: merged.slice(0, 20),
        dateUpdated: Date.now(),
      });
    } catch {
      pending = [...batch, ...pending];
    }
  },
};
