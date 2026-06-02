import { useQueueStore } from '../../store/queueStore';
import { usePlayerStore } from '../../store/playerStore';
import { trackRepository } from '../repositories/TrackRepository';

let activeFetchId = null;

export function initQueueService() {
  useQueueStore.subscribe((state, prevState) => {
    if (state.queueIndex === prevState.queueIndex && state.queue.length === prevState.queue.length) {
      return;
    }

    const { queue, queueIndex } = state;
    const remaining = queue.length - queueIndex - 1;
    if (remaining >= 3) return;

    const currentTrack = usePlayerStore.getState().currentTrack;
    if (!currentTrack) return;

    const artist = currentTrack.artistNames?.[0];
    if (!artist) return;

    const fetchId = `${currentTrack.id}-${Date.now()}`;
    activeFetchId = fetchId;

    trackRepository.searchTracks(artist, { limit: 15 })
      .then(tracks => {
        if (activeFetchId !== fetchId) return;
        if (usePlayerStore.getState().currentTrack?.id !== currentTrack.id) return;
        useQueueStore.getState().addToQueue(tracks);
      })
      .catch(err => console.error('Auto-queue failed:', err))
      .finally(() => {
        if (activeFetchId === fetchId) {
          activeFetchId = null;
        }
      });
  });
}
