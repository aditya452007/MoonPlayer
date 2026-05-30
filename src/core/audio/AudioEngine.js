import { Howl, Howler } from 'howler';

/**
 * AudioEngine
 * Singleton wrapper around Howler.js for robust audio playback.
 * Completely decoupled from React to ensure gapless playback.
 */
class AudioEngineImpl {
  constructor() {
    this.sound = null;
    this.onEndCallback = null;
    this.onPlayCallback = null;
    this.onPauseCallback = null;
    this.onProgressCallback = null;
    this.progressInterval = null;
  }

  /**
   * Initialize a new track
   */
  playTrack(streamUrl, volume = 1) {
    if (this.sound) {
      this.sound.unload(); // Destroy previous instance
    }

    // Update global volume
    Howler.volume(volume);

    this.sound = new Howl({
      src: [streamUrl],
      html5: true, // Force HTML5 Audio to stream rather than download full file
      format: ['mp4', 'm4a', 'aac', 'mp3'],
      volume: 1, // Handled by global Howler volume
      onplay: () => {
        if (this.onPlayCallback) this.onPlayCallback();
        this._startProgressLoop();
      },
      onpause: () => {
        if (this.onPauseCallback) this.onPauseCallback();
        this._stopProgressLoop();
      },
      onend: () => {
        this._stopProgressLoop();
        if (this.onEndCallback) this.onEndCallback();
      },
      onstop: () => {
        this._stopProgressLoop();
      }
    });

    this.sound.play();
  }

  pause() {
    if (this.sound && this.sound.playing()) {
      this.sound.pause();
    }
  }

  resume() {
    if (this.sound && !this.sound.playing()) {
      this.sound.play();
    }
  }

  setVolume(vol) {
    Howler.volume(vol);
  }

  setPlaybackSpeed(speed) {
    if (this.sound) {
      this.sound.rate(speed);
    }
  }

  seek(seconds) {
    if (this.sound) {
      this.sound.seek(seconds);
    }
  }

  getPosition() {
    if (this.sound && this.sound.playing()) {
      return this.sound.seek();
    }
    return 0;
  }

  // --- Internal loops for progress sync ---
  
  updateMediaSession(track) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: track.title,
        artist: track.artistNames?.join(', ') || '',
        album: track.albumName || '',
        artwork: track.imageUrl ? [
          { src: track.imageUrl, sizes: '500x500', type: 'image/jpeg' }
        ] : []
      });
    }
  }

  setMediaSessionHandlers(handlers) {
    if ('mediaSession' in navigator) {
      const { onPlay, onPause, onNext, onPrev } = handlers;
      navigator.mediaSession.setActionHandler('play', onPlay || null);
      navigator.mediaSession.setActionHandler('pause', onPause || null);
      navigator.mediaSession.setActionHandler('previoustrack', onPrev || null);
      navigator.mediaSession.setActionHandler('nexttrack', onNext || null);
    }
  }

  _startProgressLoop() {
    this._stopProgressLoop();
    this.progressInterval = setInterval(() => {
      if (this.onProgressCallback && this.sound) {
        this.onProgressCallback(this.getPosition());
      }
    }, 1000);
  }

  _stopProgressLoop() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }
}

export const AudioEngine = new AudioEngineImpl();
