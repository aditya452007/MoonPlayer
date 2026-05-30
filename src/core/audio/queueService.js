import { usePlayerStore } from '../../store/playerStore';
import { MusicService } from '../api/MusicService';
import { usePreferenceStore } from '../../store/preferenceStore';

let currentFetchTrackId = null;

export function initQueueService() {
  // Subscribe to changes in the playerStore
  usePlayerStore.subscribe(async (state, prevState) => {
    // Only proceed if queue index changed or queue length changed
    if (state.queueIndex === prevState.queueIndex && state.queue.length === prevState.queue.length) {
      return;
    }

    const remainingTracks = state.queue.length - state.queueIndex - 1;

    // If we have less than 3 tracks upcoming, auto-queue more (Q-1: race condition resolution)
    if (remainingTracks < 3 && state.currentTrack) {
      const trackId = state.currentTrack.id;
      const currentArtist = state.currentTrack.artistNames?.[0] || '';
      
      if (!currentArtist) return;

      // If we are already fetching for this track, skip it. If a different track requested,
      // allow fetching for it instead of locking onto the stale previous track.
      if (currentFetchTrackId === trackId) {
        return;
      }

      currentFetchTrackId = trackId;

      try {
        // Get stream quality settings
        const { streamQuality, dataSaverEnabled } = usePreferenceStore.getState();

        // Search for songs by the same artist as a form of "similar tracks"
        const similarTracks = await MusicService.searchSongs(currentArtist, 1, 15, streamQuality, dataSaverEnabled);
        
        // Double check that the user didn't skip to a different track while the fetch was in flight
        const currentState = usePlayerStore.getState();
        if (currentState.currentTrack?.id === trackId && similarTracks && similarTracks.length > 0) {
          usePlayerStore.getState().addToQueue(similarTracks);
        }
      } catch (error) {
        console.error('Failed to auto-queue similar tracks:', error);
      } finally {
        if (currentFetchTrackId === trackId) {
          currentFetchTrackId = null;
        }
      }
    }
  });
}
