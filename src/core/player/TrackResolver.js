import { MusicService } from '../api/MusicService';
import { StreamURLCache } from '../cache/StreamURLCache';

const RESOLVE_TIMEOUT = 15000;

export class TrackResolver {
  constructor() {
    this._inFlight = new Map();
  }

  async resolve(track, { quality = '320kbps', dataSaver = false } = {}) {
    this.cancel(track.id);

    const ac = new AbortController();
    this._inFlight.set(track.id, ac);

    try {
      const cachedUrl = await StreamURLCache.get(track.id);
      if (cachedUrl) {
        this._inFlight.delete(track.id);
        return cachedUrl;
      }

      if (track.streamUrl) {
        await StreamURLCache.set(track.id, track.streamUrl);
        this._inFlight.delete(track.id);
        return track.streamUrl;
      }

      const timeoutId = setTimeout(() => ac.abort(), RESOLVE_TIMEOUT);

      const resolved = await MusicService.getTrackDetails(
        track.id, quality, dataSaver, ac.signal
      );
      clearTimeout(timeoutId);

      if (ac.signal.aborted) {
        this._inFlight.delete(track.id);
        return null;
      }

      if (resolved?.streamUrl) {
        await StreamURLCache.set(track.id, resolved.streamUrl);
        this._inFlight.delete(track.id);
        return resolved.streamUrl;
      }

      const fallbackQualities = dataSaver
        ? ['96kbps', '48kbps']
        : ['192kbps', '160kbps', '96kbps'];

      for (const q of fallbackQualities) {
        if (ac.signal.aborted) break;
        const fallback = await MusicService.getTrackDetails(track.id, q, true, ac.signal);
        if (fallback?.streamUrl) {
          await StreamURLCache.set(track.id, fallback.streamUrl);
          this._inFlight.delete(track.id);
          return fallback.streamUrl;
        }
      }

      this._inFlight.delete(track.id);
      return null;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error(`TrackResolver failed for ${track.id}:`, error);
      }
      this._inFlight.delete(track.id);
      return null;
    }
  }

  cancel(trackId) {
    const existing = this._inFlight.get(trackId);
    if (existing) {
      existing.abort();
      this._inFlight.delete(trackId);
    }
  }

  cancelAll() {
    this._inFlight.forEach(ac => ac.abort());
    this._inFlight.clear();
  }
}

export const trackResolver = new TrackResolver();
