import { MusicService } from '../api/MusicService';

class LyricsServiceImpl {
  /**
   * Fetch lyrics for a given track using JioSaavn natively, 
   * falling back to LRCLIB for synced LRC if necessary.
   */
  async getLyrics(track) {
    if (!track) return null;

    let lrcString = null;
    let isSynced = false;

    // 1. Try JioSaavn native first if the track claims to have lyrics
    if (track.lyricsId) {
      const nativeLyrics = await MusicService.getLyrics(track.lyricsId);
      if (nativeLyrics && nativeLyrics.lyrics) {
        // JioSaavn usually returns plain HTML/text without sync tags
        // Sometimes it has <br>, so we'll normalize it
        lrcString = nativeLyrics.lyrics.replace(/<br\s*\/?>/gi, '\n');
        isSynced = false;
      }
    }

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
          
          const response = await fetch(`https://lrclib.net/api/get?${params}`);
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
        }
      } catch (err) {
        console.warn('LRCLIB fallback failed:', err);
      }
    }

    if (!lrcString) return null;

    return this.parseLRC(lrcString, isSynced);
  }

  /**
   * Parses an LRC string into an array of { time, text } objects.
   * If not synced, time is -1.
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
          const text = trimmed.replace(timeRegex, '').trim();
          
          parsed.push({ time: timeInSeconds, text });
        } else {
          // If a line is missing timestamps in a synced file, just give it -1 or skip
          // Usually metadata tags like [ti:Title]
          if (!trimmed.startsWith('[')) {
            parsed.push({ time: -1, text: trimmed });
          }
        }
      } else {
        // Plain text
        parsed.push({ time: -1, text: trimmed });
      }
    }

    return {
      isSynced,
      lines: parsed
    };
  }
}

export const lyricsService = new LyricsServiceImpl();
