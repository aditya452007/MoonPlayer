import { useLibraryStore } from '../../store/libraryStore';
import { usePreferenceStore } from '../../store/preferenceStore';
import { MusicService } from '../api/MusicService';

class RecommendationServiceImpl {
  /**
   * Generates personalized track clusters for the home page based on `recentlyPlayed`.
   * Returns an array of carousel objects: { title: string, tracks: Track[] }
   */
  async getPersonalizedRecommendations() {
    const { recentlyPlayed } = useLibraryStore.getState();
    const { streamQuality, dataSaverEnabled } = usePreferenceStore.getState();

    const carousels = [];

    if (recentlyPlayed.length === 0) {
      // Empty state: Return generic trending / top hits
      try {
        const trending = await MusicService.getTrending(streamQuality, dataSaverEnabled);
        carousels.push({
          title: 'Trending Now',
          tracks: trending
        });
        
        const newReleases = await MusicService.searchSongs('new hits', 1, 15, streamQuality, dataSaverEnabled);
        carousels.push({
          title: 'New Releases',
          tracks: newReleases
        });
      } catch (err) {
        console.error('Failed to fetch fallback recommendations:', err);
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
        const results = await MusicService.searchSongs(artist, 1, 15, streamQuality, dataSaverEnabled);
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

    const artistCarousels = (await Promise.all(artistPromises)).filter(Boolean);
    carousels.push(...artistCarousels);

    // If we couldn't get enough personalized carousels, add a generic one
    if (carousels.length < 2) {
      try {
        const trending = await MusicService.getTrending(streamQuality, dataSaverEnabled);
        const freshTrending = trending.filter(t => !recentlyPlayedIds.has(t.id));
        if (freshTrending.length > 0) {
          carousels.push({
            title: 'Trending Now',
            tracks: freshTrending
          });
        }
      } catch {
        // ignore
      }
    }

    return carousels;
  }
}

export const recommendationService = new RecommendationServiceImpl();
