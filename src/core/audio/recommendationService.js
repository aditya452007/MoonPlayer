import { useLibraryStore } from '../../store/libraryStore';
import { usePreferenceStore } from '../../store/preferenceStore';
import { MusicService } from '../api/MusicService';

let cachedResult = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes TTL

class RecommendationServiceImpl {
  /**
   * Generates personalized track clusters for the home page based on `recentlyPlayed`.
   * Returns an array of carousel objects: { title: string, tracks: Track[] }
   * Supports TTL caching, request cancellation, and error handling (R-1, R-2, R-3, R-4).
   * @param {AbortSignal} [signal] Optional abort signal to cancel request on page unmount
   */
  async getPersonalizedRecommendations(signal = null) {
    // R-3: Return cached recommendations if still valid
    if (Date.now() - cacheTime < CACHE_TTL && cachedResult && (!signal || !signal.aborted)) {
      return cachedResult;
    }

    const { recentlyPlayed } = useLibraryStore.getState();
    const { streamQuality, dataSaverEnabled } = usePreferenceStore.getState();

    const carousels = [];

    const GENRE_MOODS = [
      { q: 'bollywood love songs', title: 'Bollywood Romance' },
      { q: 'chill beats focus', title: 'Chill & Focus' },
      { q: 'workout pump up hits', title: 'Workout Energy' },
      { q: 'indie folk acoustic', title: 'Indie Folk' },
      { q: 'new releases this month', title: 'New Releases' },
    ];

    if (recentlyPlayed.length === 0) {
      try {
        if (signal?.aborted) return [];
        const trending = await MusicService.getTrending(streamQuality, dataSaverEnabled);
        
        if (signal?.aborted) return [];
        carousels.push({ title: 'Trending Now', tracks: trending });

        for (const { q, title } of GENRE_MOODS) {
          if (signal?.aborted) break;
          try {
            const results = await MusicService.searchSongs(q, 1, 15, streamQuality, dataSaverEnabled);
            if (results.length > 0) carousels.push({ title, tracks: results });
          } catch {
            /* Ignored */
          }
        }
      } catch (err) {
        console.error('Failed to fetch fallback recommendations:', err);
      }
      
      if (carousels.length > 0 && (!signal || !signal.aborted)) {
        cachedResult = carousels;
        cacheTime = Date.now();
      }
      return carousels;
    }


    // Extract top artists from recent history
    const artistCounts = {};
    recentlyPlayed.forEach(track => {
      if (track.artistNames && track.artistNames.length > 0) {
        // Just take the first (primary) artist
        const artist = track.artistNames[0];
        if (artist) {
          artistCounts[artist] = (artistCounts[artist] || 0) + 1;
        }
      }
    });

    // Sort artists by frequency
    const topArtists = Object.entries(artistCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 3); // Get up to 3 top artists

    // Fetch songs for each top artist
    const recentlyPlayedIds = new Set(recentlyPlayed.map(t => t.id));

    // Execute searches in parallel
    const artistPromises = topArtists.map(async (artist) => {
      try {
        if (signal?.aborted) return null;
        const results = await MusicService.searchSongs(artist, 1, 15, streamQuality, dataSaverEnabled);
        
        if (signal?.aborted) return null;
        // Filter out tracks the user recently played to keep it fresh
        const freshTracks = results.filter(t => !recentlyPlayedIds.has(t.id));
        
        if (freshTracks.length > 0) {
          return {
            title: `Because you listened to ${artist}`,
            tracks: freshTracks
          };
        }
      } catch (err) {
        console.error(`Failed to fetch recommendations for artist ${artist}:`, err);
      }
      return null;
    });

    if (signal?.aborted) return [];
    const artistCarousels = (await Promise.all(artistPromises)).filter(Boolean);
    carousels.push(...artistCarousels);

    // If we couldn't get enough personalized carousels, add a generic one
    if (carousels.length < 2 && !signal?.aborted) {
      try {
        const trending = await MusicService.getTrending(streamQuality, dataSaverEnabled);
        const freshTrending = trending.filter(t => !recentlyPlayedIds.has(t.id));
        if (freshTrending.length > 0) {
          carousels.push({
            title: 'Trending Now',
            tracks: freshTrending
          });
        }
      } catch (err) {
        // R-1: Catch and log trending fallback errors
        console.warn('Trending fallback fetch failed:', err);
      }
    }

    if (signal?.aborted) return [];

    // R-4: Log clear warning if all recommendation requests failed
    if (carousels.length === 0) {
      console.warn('All personalized recommendations failed or returned empty.');
    } else {
      // Cache valid result
      cachedResult = carousels;
      cacheTime = Date.now();
    }

    return carousels;
  }

  /**
   * Generates a randomized playlist of tracks from similar artists / same artist.
   * @param {string} artistId 
   * @param {string} artistName 
   * @returns {Promise<import('../../store/libraryStore').Track[]>}
   */
  async getArtistRadio(artistId, artistName) {
    if (!artistName) return [];
    try {
      let tracks = [];
      if (artistId) {
        try {
          const artistData = await MusicService.getArtistDetails(artistId);
          if (artistData && artistData.tracks) {
            tracks = artistData.tracks;
          }
        } catch (err) {
          console.warn('Failed to fetch artist details for radio, falling back to search:', err);
        }
      }
      
      const searchResults = await MusicService.searchSongs(artistName, 1, 20);
      const combined = [...tracks, ...searchResults];
      
      const seen = new Set();
      const unique = combined.filter(t => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });

      return unique.sort(() => Math.random() - 0.5);
    } catch (error) {
      console.error('getArtistRadio failed:', error);
      return [];
    }
  }

  /**
   * Fetches recently published tracks.
   * @returns {Promise<import('../../store/libraryStore').Track[]>}
   */
  async getNewReleases() {
    try {
      const currentYear = new Date().getFullYear();
      const results = await MusicService.searchSongs(`new releases ${currentYear}`, 1, 20);
      if (results.length > 0) return results;
      return MusicService.searchSongs('new releases', 1, 20);
    } catch (error) {
      console.error('getNewReleases failed:', error);
      return [];
    }
  }

  /**
   * Clears the active recommendation TTL cache.
   */
  clearCache() {
    cachedResult = null;
    cacheTime = 0;
  }
}

export const recommendationService = new RecommendationServiceImpl();

// Automatically clear recommendations cache when recentlyPlayed updates (R-3)
useLibraryStore.subscribe((state, prevState) => {
  if (state.recentlyPlayed !== prevState.recentlyPlayed) {
    recommendationService.clearCache();
  }
});
