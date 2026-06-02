import { db } from './db/schema';
import { AudioEngine } from './audio/AudioEngine';
import { initQueueService } from './audio/queueService';
import { recommendationService } from './audio/recommendationService';
import { serviceContainer } from './di/ServiceContainer';
import { MusicService } from './api/MusicService';
import { downloadService } from './api/downloadService';
import { trackRepository } from './repositories/TrackRepository';
import { playlistRepository } from './repositories/PlaylistRepository';
import { settingsRepository } from './repositories/SettingsRepository';
import { runPostMigration } from './db/migrations';
import { initOfflineDetector } from './cache/OfflineDetector';
import { initPreResolver } from './player/PreResolver';
import { initPlaybackSync } from './sync/playbackSync';
import { initLibrarySync } from './sync/librarySync';

class Bootstrapper {
  constructor() {
    this.currentPhase = 'db';
    this.onProgress = null;
    this.bootPromise = null;
  }

  setProgressCallback(cb) {
    this.onProgress = cb;
  }

  _report(phase, index, total) {
    this.currentPhase = phase;
    this.onProgress?.(phase, index, total);
  }

  async boot() {
    if (this.bootPromise) return this.bootPromise;

    const phases = [
      'db', 'preferences', 'library', 'likes', 'history',
      'usage', 'player', 'audio', 'queue', 'recommendations', 'sw', 'done'
    ];
    const total = phases.length;

    this.bootPromise = (async () => {
      this._report('db', 1, total);
      await db.open();
      await runPostMigration().catch((e) => console.warn('Post-migration failed:', e));

      const { usePreferenceStore } = await import('../store/preferenceStore');
      this._report('preferences', 2, total);
      await usePreferenceStore.getState().hydrate();

      const { useLibraryStore } = await import('../store/libraryStore');
      const { useDownloadStore } = await import('../store/downloadStore');
      this._report('library', 3, total);
      await useLibraryStore.getState().hydrate();
      await useDownloadStore.getState().hydrate();

      const { useLikesStore } = await import('../store/likesStore');
      this._report('likes', 4, total);
      await useLikesStore.getState().hydrate();

      const { useHistoryStore } = await import('../store/historyStore');
      this._report('history', 5, total);
      await useHistoryStore.getState().hydrate();

      const { useUsageStore } = await import('../store/usageStore');
      this._report('usage', 6, total);
      await useUsageStore.getState().hydrate();

      this._report('player', 7, total);
      const { usePlayerStore } = await import('../store/playerStore');
      await new Promise(r => setTimeout(r, 0));
      const playerState = usePlayerStore.getState();
      if (playerState.volume !== undefined) {
        AudioEngine.setVolume(playerState.volume);
      }

      this._report('audio', 8, total);
      AudioEngine.setMediaSessionHandlers({
        onPlay: () => usePlayerStore.getState().resume(),
        onPause: () => usePlayerStore.getState().pause(),
        onNext: () => usePlayerStore.getState().next(),
        onPrev: () => usePlayerStore.getState().prev(),
      });

      this._report('queue', 9, total);
      initQueueService();
      initPreResolver();

      this._report('recommendations', 10, total);
      recommendationService.getPersonalizedRecommendations().catch(() => {});

      serviceContainer.register('musicService', MusicService);
      serviceContainer.register('recommendationService', recommendationService);
      serviceContainer.register('downloadService', downloadService);
      serviceContainer.register('audioEngine', AudioEngine);
      serviceContainer.register('trackRepository', trackRepository);
      serviceContainer.register('playlistRepository', playlistRepository);
      serviceContainer.register('settingsRepository', settingsRepository);

      initOfflineDetector();
      initPlaybackSync();
      initLibrarySync();
      await this.reconcileState().catch((e) => console.warn('Reconciliation failed:', e));

      this._report('sw', 11, total);
      try {
        const { registerSW } = await import('virtual:pwa-register');
        registerSW({ immediate: true, onRegisterError: (e) => console.warn('SW registration failed:', e) });
      } catch (e) {
        console.warn('SW registration skipped:', e);
      }

      this._report('done', 12, total);
    })();

    return this.bootPromise;
  }

  async reconcileState() {
    const { usePlayerStore } = await import('../store/playerStore');
    const { useQueueStore } = await import('../store/queueStore');
    const playerState = usePlayerStore.getState();
    const queueState = useQueueStore.getState();

    if (playerState.currentTrack) {
      const { trackRepository } = await import('./repositories/TrackRepository');
      try {
        const fresh = await trackRepository.getTrackDetails(playerState.currentTrack.id);
        if (!fresh || !fresh.streamUrl) {
          console.warn('Reconciliation: currentTrack is stale, clearing player');
          usePlayerStore.setState({ currentTrack: null, isPlaying: false });
          useQueueStore.setState({ queue: [], queueIndex: -1 });
        }
      } catch {
        console.warn('Reconciliation: could not verify currentTrack, keeping it');
      }
    }

    if (queueState.queueIndex >= queueState.queue.length) {
      useQueueStore.setState({ queueIndex: queueState.queue.length > 0 ? 0 : -1 });
    }
  }
}

export const bootstrapper = new Bootstrapper();
