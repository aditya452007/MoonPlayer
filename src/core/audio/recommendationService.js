import { useHistoryStore } from '../../store/historyStore';
import { usePreferenceStore } from '../../store/preferenceStore';
import { MusicService } from '../api/MusicService';
import { HomeCache } from '../cache/HomeCache';
import { db } from '../db/schema';

class RecommendationServiceImpl {
  async getPersonalizedRecommendations(signal = null) {
    const key = 'home_recommendations';
    const { data } = await HomeCache.getOrFetch(key, async () => {
      const { recentlyPlayed } = useHistoryStore.getState();
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
          const trending = await MusicService.getTrending(streamQuality, dataSaverEnabled, signal);
          
          if (signal?.aborted) return [];
          carousels.push({ title: 'Trending Now', tracks: trending });

          for (const { q, title } of GENRE_MOODS) {
            if (signal?.aborted) break;
            try {
              const results = await MusicService.searchSongs(q, 1, 15, streamQuality, dataSaverEnabled, signal);
              if (results.length > 0) carousels.push({ title, tracks: results });
            } catch {
              /* Ignored */
            }
          }
        } catch (err) {
          console.error('Failed to fetch fallback recommendations:', err);
        }
        return carousels;
      }

      const artistCounts = {};
      recentlyPlayed.forEach(track => {
        if (track.artistNames && track.artistNames.length > 0) {
          const artist = track.artistNames[0];
          if (artist) {
            artistCounts[artist] = (artistCounts[artist] || 0) + 1;
          }
        }
      });

      const topArtists = Object.entries(artistCounts)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0])
        .slice(0, 3);

      const recentlyPlayedIds = new Set(recentlyPlayed.map(t => t.id));

      const artistPromises = topArtists.map(async (artist) => {
        try {
          if (signal?.aborted) return null;
          const results = await MusicService.searchSongs(artist, 1, 15, streamQuality, dataSaverEnabled, signal);
          
          if (signal?.aborted) return null;
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

      if (carousels.length < 2 && !signal?.aborted) {
        try {
          const trending = await MusicService.getTrending(streamQuality, dataSaverEnabled, signal);
          const freshTrending = trending.filter(t => !recentlyPlayedIds.has(t.id));
          if (freshTrending.length > 0) {
            carousels.push({
              title: 'Trending Now',
              tracks: freshTrending
            });
          }
        } catch (err) {
          console.warn('Trending fallback fetch failed:', err);
        }
      }

      if (signal?.aborted) return [];

      if (carousels.length === 0) {
        console.warn('All personalized recommendations failed or returned empty.');
      }

      return carousels;
    });

    return data || [];
  }

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

  clearCache() {
    // Under HomeCache, we can clear the db cache row
    db.cache.delete('home_recommendations').catch(() => {});
  }
}

export const recommendationService = new RecommendationServiceImpl();

useHistoryStore.subscribe((state, prevState) => {
  if (state.recentlyPlayed !== prevState.recentlyPlayed) {
    recommendationService.clearCache();
  }
});
