import { MusicService } from '../api/MusicService';

class LyricsServiceImpl {
  /**
   * Fetch lyrics for a given track using JioSaavn natively, 
   * falling back to LRCLIB for synced LRC if necessary.
   * Supports request cancellation and network timeouts (LYR-1, LYR-2, LYR-3).
   * @param {import('../../store/libraryStore').Track} track 
   * @param {AbortSignal} [signal] Optional abort signal to cancel request on song skip
   * @returns {Promise<{isSynced: boolean, lines: Array<{time: number, text: string}>}|null>}
   */
  async getLyrics(track, signal = null) {
    if (!track) return null;

    let lrcString = null;
    let isSynced = false;

    // 1. Try JioSaavn native first if the track claims to have lyrics
    if (track.lyricsId) {
      try {
        // LYR-1: Wrapped in try/catch to gracefully fall back on native failure
        const nativeLyrics = await MusicService.getLyrics(track.lyricsId);
        if (nativeLyrics && nativeLyrics.lyrics) {
          // JioSaavn usually returns plain HTML/text without sync tags
          // Sometimes it has <br>, so we'll normalize it
          lrcString = nativeLyrics.lyrics.replace(/<br\s*\/?>/gi, '\n');
          isSynced = false;
        }
      } catch (err) {
        console.warn('Native lyrics fetch failed, trying fallback:', err);
      }
    }

    if (signal?.aborted) return null;

    // 2. Try LRCLIB Fallback (Great for synced lyrics)
    // We clean the title to maximize match rate (remove (Remastered), (feat.), etc)
    if (!isSynced) {
      try {
        const cleanTitle = track.title.replace(/\([^)]*\)/g, '').trim();
        const primaryArtist = track.artistNames && track.artistNames.length > 0 
          ? track.artistNames[0] 
          : '';
          
        if (cleanTitle && primaryArtist) {
          const params = new URLSearchParams({
            track_name: cleanTitle,
            artist_name: primaryArtist
          });
          
          const baseUrl = import.meta.env.VITE_LRCLIB_BASE_URL || 'https://lrclib.net/api';
          
          // LYR-2 & LYR-3: Fetch with custom 15-second timeout and abort signal support
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 15000);
          
          // Merge input signal if provided
          let abortHandler;
          if (signal) {
            abortHandler = () => {
              controller.abort();
              clearTimeout(timeout);
            };
            signal.addEventListener('abort', abortHandler);
          }

          try {
            const response = await fetch(`${baseUrl}/get?${params}`, {
              signal: controller.signal
            });
            if (response.ok) {
              const data = await response.json();
              if (data && data.syncedLyrics) {
                lrcString = data.syncedLyrics;
                isSynced = true;
              } else if (data && data.plainLyrics && !lrcString) {
                lrcString = data.plainLyrics;
                isSynced = false;
              }
            }
          } finally {
            clearTimeout(timeout);
            if (signal && abortHandler) {
              signal.removeEventListener('abort', abortHandler);
            }
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          console.warn('Lyrics fetch aborted for track:', track.title);
        } else {
          console.warn('LRCLIB fallback failed:', err);
        }
      }
    }

    if (!lrcString || signal?.aborted) return null;

    return this.parseLRC(lrcString, isSynced);
  }

  /**
   * Parses an LRC string into an array of { time, text } objects.
   * If not synced, time is -1. Sanitizes HTML contents (LYR-4).
   * @param {string} lrc
   * @param {boolean} isSynced
   * @returns {{isSynced: boolean, lines: Array<{time: number, text: string}>}}
   */
  parseLRC(lrc, isSynced) {
    const lines = lrc.split('\n');
    const parsed = [];

    // Regex to match [mm:ss.xx]
    const timeRegex = /\[(\d{2}):(\d{2}(?:\.\d+)?)\]/;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (isSynced) {
        const match = timeRegex.exec(trimmed);
        if (match) {
          const minutes = parseInt(match[1], 10);
          const seconds = parseFloat(match[2]);
          const timeInSeconds = (minutes * 60) + seconds;
          
          // LYR-4: Strip HTML tags to prevent XSS
          const rawText = trimmed.replace(timeRegex, '').trim();
          const cleanText = rawText.replace(/<[^>]*>/g, '');
          
          parsed.push({ time: timeInSeconds, text: cleanText });
        } else {
          // If a line is missing timestamps in a synced file, just give it -1 or skip
          if (!trimmed.startsWith('[')) {
            const cleanText = trimmed.replace(/<[^>]*>/g, '');
            parsed.push({ time: -1, text: cleanText });
          }
        }
      } else {
        // Plain text - strip HTML
        const cleanText = trimmed.replace(/<[^>]*>/g, '');
        parsed.push({ time: -1, text: cleanText });
      }
    }

    return {
      isSynced,
      lines: parsed
    };
  }
}

export const lyricsService = new LyricsServiceImpl();
