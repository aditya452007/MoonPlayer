import { Howl, Howler } from 'howler';

export class AudioEngineImpl {
  constructor() {
    this.sound = null;
    this.onEndCallback = null;
    this.onPlayCallback = null;
    this.onPauseCallback = null;
    this.onProgressCallback = null;
    this.onErrorCallback = null;
    
    this._rafId = null;
    this._progressRunning = false;
    this._currentSessionId = null;
    
    // Equalizer state
    this.eqContext = null;
    this.eqFilters = [];
    this.currentPreset = 'Normal';
    this.eqEnabled = true;
    this._bandGains = [0, 0, 0, 0, 0];

    // Crossfade state
    this.crossfadeDuration = 0; // seconds, 0 = off
    this.nextPlayer = null;
    this.preloadedTrack = null;
    this._crossfadeTriggered = false;
    this.onCurrentTrackCallback = null;
  }

  playTrack(streamUrl, volume = 1) {
    if (!streamUrl) return;

    const sessionId = Date.now();
    this._currentSessionId = sessionId;

    if (this.sound) {
      try {
        this.sound.unload();
      } catch (err) {
        console.warn('Failed to unload previous sound:', err);
      }
    }

    Howler.volume(volume);

    this.sound = new Howl({
      src: [streamUrl],
      html5: true,
      format: ['mp4', 'm4a', 'aac', 'mp3'],
      volume: 1,
      onplay: () => {
        if (this._currentSessionId !== sessionId) {
          if (this.sound) {
            try { this.sound.unload(); } catch { /* ignore */ }
          }
          return;
        }
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
        this._stopProgressLoop();
        if (this._currentSessionId !== sessionId) return;
        console.error('AudioEngine.sound load failed:', error);
        if (this.onErrorCallback) {
          this.onErrorCallback('Failed to load audio track', error);
        }
      },
      onplayerror: (id, error) => {
        this._stopProgressLoop();
        if (this._currentSessionId !== sessionId) return;
        console.error('AudioEngine.sound playback blocked or failed:', error);
        if (this.onErrorCallback) {
          this.onErrorCallback('Playback failed', error);
        }
      }
    });

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

  setVolume(vol) {
    const clamped = Math.max(0, Math.min(1, vol));
    Howler.volume(clamped);
  }

  setPlaybackSpeed(speed) {
    if (this.sound) {
      this.sound.rate(speed);
    }
  }

  setEqualizerPreset(presetName) {
    this.currentPreset = presetName || 'Normal';
    if (!this.eqFilters || this.eqFilters.length !== 5) {
      console.warn('Equalizer is not initialized yet. Skipping preset update.');
      return;
    }
    
    const presets = {
      'Normal': [0, 0, 0, 0, 0],
      'Bass Boost': [6, 4, 0, -2, -2],
      'Vocal': [-2, 0, 4, 4, 1],
      'Treble': [-3, -2, 0, 4, 6],
      'Rock': [5, 3, -1, 3, 5],
      'Pop': [-1, 2, 5, 2, -1],
    };

    const gains = presets[this.currentPreset] || presets['Normal'];
    this._bandGains = [...gains];
    this.eqFilters.forEach((filter, i) => {
      filter.gain.setTargetAtTime(gains[i], this.eqContext.currentTime, 0.1);
    });
  }

  setEqualizerBandGain(index, gain) {
    if (index < 0 || index >= 5) return;
    this._bandGains[index] = gain;
    if (!this.eqEnabled) return;
    if (this.eqFilters && this.eqFilters[index] && this.eqContext) {
      this.eqFilters[index].gain.setTargetAtTime(gain, this.eqContext.currentTime, 0.05);
    }
  }

  setEqualizerEnabled(enabled) {
    this.eqEnabled = enabled;
    if (!this.eqFilters || this.eqFilters.length === 0 || !this.eqContext) return;
    const applyGains = enabled ? this._bandGains : [0, 0, 0, 0, 0];
    this.eqFilters.forEach((filter, i) => {
      filter.gain.setTargetAtTime(applyGains[i], this.eqContext.currentTime, 0.1);
    });
  }

  _setupEqualizer() {
    if (!this.sound || !this.sound._sounds || !this.sound._sounds[0] || !this.sound._sounds[0]._node) return;
    const audioNode = this.sound._sounds[0]._node;
    
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

        for (let i = 0; i < this.eqFilters.length - 1; i++) {
          this.eqFilters[i].connect(this.eqFilters[i + 1]);
        }
        
        this.eqFilters[this.eqFilters.length - 1].connect(this.eqContext.destination);
      }

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

  getPosition() {
    if (this.sound) {
      const pos = this.sound.seek();
      return typeof pos === 'number' ? pos : 0;
    }
    return 0;
  }

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
        // ignore disconnect
      }
      this.eqFilters = [];
    }

    this.eqContext = null;
  }

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
    this._progressRunning = true;

    const tick = () => {
      if (!this._progressRunning) return;
      if (this.onProgressCallback && this.sound) {
        this.onProgressCallback(this.getPosition());
      }
      this._checkCrossfade();
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  }

  _stopProgressLoop() {
    this._progressRunning = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  async preloadNext(streamUrl) {
    if (!streamUrl || this.crossfadeDuration <= 0) return;
    if (this.nextPlayer) {
      try { this.nextPlayer.unload(); } catch { /* Ignored */ }
    }
    this.nextPlayer = new Howl({
      src: [streamUrl],
      html5: true,
      format: ['mp4', 'm4a', 'aac', 'mp3'],
      volume: 0,
    });
    this._crossfadeTriggered = false;
  }

  _checkCrossfade() {
    if (this.crossfadeDuration <= 0 || !this.sound || !this.nextPlayer) return;
    if (this._crossfadeTriggered) return;
    const pos = this.getPosition();
    const dur = this.sound.duration();
    if (!dur || dur <= 0) return;
    const remaining = dur - pos;
    if (remaining <= this.crossfadeDuration && remaining > 0.5) {
      this._crossfadeTriggered = true;
      this._executeCrossfade();
    }
  }

  _executeCrossfade() {
    const fadeDurationMs = this.crossfadeDuration * 1000;
    if (!this.nextPlayer) return;
    this.nextPlayer.volume(0);
    this.nextPlayer.play();
    this.nextPlayer.fade(0, 1, fadeDurationMs);
    if (this.sound) this.sound.fade(this.sound.volume(), 0, fadeDurationMs);

    setTimeout(() => {
      if (this.sound) {
        try { this.sound.unload(); } catch { /* Ignored */ }
      }
      this.sound = this.nextPlayer;
      this.nextPlayer = null;
      this._crossfadeTriggered = false;
      this._setupEqualizer();
      if (this.onEndCallback) this.onEndCallback();
    }, fadeDurationMs + 300);
  }
}

export const AudioEngine = new AudioEngineImpl();
