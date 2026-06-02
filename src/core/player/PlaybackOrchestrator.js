import { usePlayerStore } from '../../store/playerStore';
import { useQueueStore } from '../../store/queueStore';
import { usePreferenceStore } from '../../store/preferenceStore';
import { useToastStore } from '../../store/toastStore';
import { AudioEngine } from '../audio/AudioEngine';
import { trackResolver } from './TrackResolver';
import { eventBus, Events } from '../events/EventBus';

export class PlaybackOrchestrator {
  constructor() {
    this._currentResolveId = null;
  }

  async play(track) {
    if (!track) return;

    const resolveId = Date.now();
    this._currentResolveId = resolveId;

    const { volume } = usePlayerStore.getState();
    const { streamQuality, dataSaverEnabled } = usePreferenceStore.getState();

    const url = await trackResolver.resolve(track, {
      quality: streamQuality,
      dataSaver: dataSaverEnabled,
    });

    if (resolveId !== this._currentResolveId) return;

    if (!url) {
      useToastStore.getState().addToast('Could not load this track', 'error');
      const queueState = useQueueStore.getState();
      if (queueState.queueIndex < queueState.queue.length - 1) {
        const nextTrack = queueState.queue[queueState.queueIndex + 1];
        useToastStore.getState().addToast('Skipping to next track', 'info');
        return this.play(nextTrack);
      }
      return;
    }

    try {
      AudioEngine.playTrack(url, volume);
      AudioEngine.updateMediaSession(track);

      usePlayerStore.setState({ currentTrack: track, isPlaying: true, progress: 0 });

      eventBus.emit(Events.TRACK_PLAYED, track);
    } catch (error) {
      console.error('Playback failed:', error);
      useToastStore.getState().addToast('Playback failed', 'error');
    }
  }

  cancelPending() {
    this._currentResolveId = null;
    trackResolver.cancelAll();
  }
}

export const playbackOrchestrator = new PlaybackOrchestrator();
