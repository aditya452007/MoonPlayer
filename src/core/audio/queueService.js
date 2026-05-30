import { usePlayerStore } from '../../store/playerStore';
import { MusicService } from '../api/MusicService';
import { usePreferenceStore } from '../../store/preferenceStore';

let isFetching = false;

export function initQueueService() {
  // Subscribe to changes in the playerStore
  usePlayerStore.subscribe(async (state, prevState) => {
    // Only proceed if queue index changed or queue length changed
    if (state.queueIndex === prevState.queueIndex && state.queue.length === prevState.queue.length) {
      return;
    }

    const remainingTracks = state.queue.length - state.queueIndex - 1;

    // If we have less than 3 tracks upcoming, auto-queue more
    if (remainingTracks < 3 && state.currentTrack && !isFetching) {
      try {
        isFetching = true;
        const currentArtist = state.currentTrack.artistNames?.[0] || '';
        
        if (!currentArtist) {
          isFetching = false;
          return;
        }

        // Get stream quality settings
        const { streamQuality, dataSaverEnabled } = usePreferenceStore.getState();

        // Search for songs by the same artist as a form of "similar tracks"
        // In a real production app, we would hit a dedicated `/recommendations` endpoint
        const similarTracks = await MusicService.searchSongs(currentArtist, 1, 15, streamQuality, dataSaverEnabled);
        
        if (similarTracks && similarTracks.length > 0) {
          usePlayerStore.getState().addToQueue(similarTracks);
        }
      } catch (error) {
        console.error('Failed to auto-queue similar tracks:', error);
      } finally {
        isFetching = false;
      }
    }
  });
}
