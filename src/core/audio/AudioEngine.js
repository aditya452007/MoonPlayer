import { Howl, Howler } from 'howler';
import { useToastStore } from '../../store/toastStore';

/**
 * AudioEngineImpl
 * Wrapper around Howler.js for robust audio playback.
 * Completely decoupled from React to ensure gapless playback.
 */
export class AudioEngineImpl {
  constructor() {
    this.sound = null;
    this.onEndCallback = null;
    this.onPlayCallback = null;
    this.onPauseCallback = null;
    this.onProgressCallback = null;
    this.onErrorCallback = null;
    this.progressInterval = null;
    
    // Equalizer state
    this.eqContext = null;
    this.eqFilters = [];
    this.currentPreset = 'Normal';
  }

  /**
   * Initialize a new track and start playing.
   * @param {string} streamUrl - Audio source streaming URL.
   * @param {number} [volume=1] - Volume between 0 and 1.
   */
  playTrack(streamUrl, volume = 1) {
    if (!streamUrl) return;

    if (this.sound) {
      try {
        this.sound.unload(); // Destroy previous instance
      } catch (err) {
        console.warn('Failed to unload previous sound:', err);
      }
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
        this._setupEqualizer();
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
      },
      onloaderror: (id, error) => {
        console.error('AudioEngine.sound load failed:', error);
        this._stopProgressLoop();
        useToastStore.getState().addToast('Failed to load audio track', 'error');
        if (this.onErrorCallback) {
          this.onErrorCallback('Failed to load audio track', error);
        }
      },
      onplayerror: (id, error) => {
        console.error('AudioEngine.sound playback blocked or failed:', error);
        this._stopProgressLoop();
        useToastStore.getState().addToast('Playback blocked or failed', 'error');
        if (this.onErrorCallback) {
          this.onErrorCallback('Playback failed', error);
        }
      }
    });

    // CORS Timing fix: Set crossOrigin synchronously immediately after creation
    // so the browser sees it before starting the actual network fetch.
    if (this.sound && this.sound._sounds && this.sound._sounds[0] && this.sound._sounds[0]._node) {
      this.sound._sounds[0]._node.crossOrigin = 'anonymous';
    }

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

  /**
   * Set global playback volume.
   * @param {number} vol - Volume clamped between 0 and 1.
   */
  setVolume(vol) {
    const clamped = Math.max(0, Math.min(1, vol));
    Howler.volume(clamped);
  }

  /**
   * Adjust playback speed rate.
   * @param {number} speed - Playback rate factor (e.g. 1.0, 1.5).
   */
  setPlaybackSpeed(speed) {
    if (this.sound) {
      this.sound.rate(speed);
    }
  }

  /**
   * Apply an equalizer frequency preset.
   * @param {'Normal'|'Bass Boost'|'Vocal'|'Treble'|'Rock'|'Pop'} presetName 
   */
  setEqualizerPreset(presetName) {
    this.currentPreset = presetName || 'Normal';
    if (!this.eqFilters || this.eqFilters.length !== 5) {
      console.warn('Equalizer is not initialized yet. Skipping preset update.');
      return;
    }
    
    // Gains for [60, 230, 910, 3600, 14000] Hz
    const presets = {
      'Normal': [0, 0, 0, 0, 0],
      'Bass Boost': [6, 4, 0, -2, -2],
      'Vocal': [-2, 0, 4, 4, 1],
      'Treble': [-3, -2, 0, 4, 6],
      'Rock': [5, 3, -1, 3, 5],
      'Pop': [-1, 2, 5, 2, -1],
    };

    const gains = presets[this.currentPreset] || presets['Normal'];
    this.eqFilters.forEach((filter, i) => {
      filter.gain.setTargetAtTime(gains[i], this.eqContext.currentTime, 0.1);
    });
  }

  /**
   * Connect and configure equalizer biquad filters on active audio element.
   */
  _setupEqualizer() {
    if (!this.sound || !this.sound._sounds || !this.sound._sounds[0] || !this.sound._sounds[0]._node) return;
    const audioNode = this.sound._sounds[0]._node;
    
    // Safety verification of anonymous origin
    if (audioNode.crossOrigin !== 'anonymous') {
      audioNode.crossOrigin = 'anonymous';
    }

    try {
      if (!this.eqContext) {
        if (!Howler.ctx) {
          console.warn('Howler.ctx is not initialized yet. Delaying equalizer setup.');
          return;
        }
        this.eqContext = Howler.ctx;
        
        const bands = [60, 230, 910, 3600, 14000];
        this.eqFilters = bands.map((freq, index) => {
          const filter = this.eqContext.createBiquadFilter();
          filter.type = index === 0 ? 'lowshelf' : (index === bands.length - 1 ? 'highshelf' : 'peaking');
          filter.frequency.value = freq;
          filter.gain.value = 0;
          return filter;
        });

        // Chain filters together
        for (let i = 0; i < this.eqFilters.length - 1; i++) {
          this.eqFilters[i].connect(this.eqFilters[i + 1]);
        }
        
        // Connect the last filter to the context destination
        this.eqFilters[this.eqFilters.length - 1].connect(this.eqContext.destination);
      }

      // We only create one MediaElementSource per Audio element to avoid InvalidStateError
      if (!audioNode._eqSourceConnected) {
        const source = this.eqContext.createMediaElementSource(audioNode);
        source.connect(this.eqFilters[0]);
        audioNode._eqSourceConnected = true;
      }
      
      this.setEqualizerPreset(this.currentPreset);

      if (this.eqContext.state === 'suspended') {
        this.eqContext.resume();
      }

    } catch (err) {
      console.warn("EQ setup failed (CORS or browser policy):", err);
    }
  }

  /**
   * Seek playback progress to a specific duration in seconds.
   * Queues seek if sound is still loading (HTML5).
   * @param {number} seconds 
   */
  seek(seconds) {
    if (!this.sound) return;
    
    if (this.sound.state() === 'loaded') {
      this.sound.seek(seconds);
    } else {
      this.sound.once('load', () => {
        this.sound.seek(seconds);
      });
    }
  }

  /**
   * Retrieve active playback position in seconds.
   * Correctly returns current playhead even when paused.
   * @returns {number}
   */
  getPosition() {
    if (this.sound) {
      const pos = this.sound.seek();
      return typeof pos === 'number' ? pos : 0;
    }
    return 0;
  }

  /**
   * Disposes all created audio graphs, closes context, and unloads sound (Memory teardown).
   */
  destroy() {
    this._stopProgressLoop();
    if (this.sound) {
      try {
        this.sound.unload();
      } catch (err) {
        console.warn('Failed to unload sound during destroy:', err);
      }
      this.sound = null;
    }
    
    if (this.eqFilters && this.eqFilters.length > 0) {
      try {
        this.eqFilters.forEach(f => f.disconnect());
      } catch {
        // ignore disconnect errors on cleanup
      }
      this.eqFilters = [];
    }

    this.eqContext = null;
  }

  // --- Internal loops for progress sync ---
  
  /**
   * Updates global system media session metadata with active track properties.
   * @param {Object} track 
   */
  updateMediaSession(track) {
    if ('mediaSession' in navigator && track) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: track.title || 'Unknown Track',
        artist: track.artistNames?.join(', ') || 'Unknown Artist',
        album: track.albumName || '',
        artwork: track.imageUrl ? [
          { src: track.imageUrl, sizes: '500x500', type: 'image/jpeg' }
        ] : []
      });
    }
  }

  /**
   * Registers callback functions for media control interface commands.
   * @param {Object} handlers 
   */
  setMediaSessionHandlers(handlers) {
    if ('mediaSession' in navigator && handlers) {
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
