import { eventBus, Events } from '../events/EventBus';
import { useHistoryStore } from '../../store/historyStore';
import { useUsageStore } from '../../store/usageStore';

export function initPlaybackSync() {
  const unsub = eventBus.on(Events.TRACK_PLAYED, async (track) => {
    useHistoryStore.getState().addTrack(track);
    useUsageStore.getState().recordPlay(track);
  });
  return unsub;
}
