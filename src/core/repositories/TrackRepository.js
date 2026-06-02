import { MusicService } from '../api/MusicService';
import { trackDAO } from '../data-access/trackDAO';
import { CacheLRU } from '../utils/CacheLRU';

const streamUrlCache = new CacheLRU(200);

export class TrackRepository {
  async getTrackDetails(id, { signal, quality, dataSaver } = {}) {
    const cached = streamUrlCache.get(id);
    if (cached) return cached;

    const stored = await trackDAO.get(id);
    if (stored && stored.streamUrl) {
      streamUrlCache.set(id, stored);
      return stored;
    }

    const track = await MusicService.getTrackDetails(id, quality, dataSaver, signal);
    if (track) {
      streamUrlCache.set(id, track);
      await trackDAO.put(track);
    }
    return track;
  }

  async searchTracks(query, { page, limit, quality, dataSaver, signal } = {}) {
    const results = await MusicService.searchSongs(query, page, limit, quality, dataSaver, signal);
    if (Array.isArray(results)) {
      results.forEach(t => trackDAO.put(t).catch(() => {}));
    }
    return results;
  }

  invalidateCache(id) {
    streamUrlCache.delete(id);
  }

  clearCache() {
    streamUrlCache.clear();
  }
}

export const trackRepository = new TrackRepository();
