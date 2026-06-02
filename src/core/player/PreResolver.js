import { useQueueStore } from '../../store/queueStore';

const PRE_RESOLVE_COUNT = 2;

export function initPreResolver() {
  useQueueStore.subscribe((state, prevState) => {
    if (!prevState) return;
    if (state.queueIndex === prevState.queueIndex && state.queue.length === prevState.queue.length) {
      return;
    }
    const { queue, queueIndex } = state;
    if (queue.length === 0 || queueIndex < 0) return;

    for (let i = 1; i <= PRE_RESOLVE_COUNT; i++) {
      const idx = queueIndex + i;
      if (idx >= queue.length) break;
      const track = queue[idx];
      if (!track.streamUrl) {
        import('./TrackResolver')
          .then(({ trackResolver }) => {
            trackResolver.resolve(track).catch(() => {});
          })
          .catch(() => {});
      }
    }
  });
}
