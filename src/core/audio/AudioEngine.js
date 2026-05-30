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
    
    // Equalizer state
    this.eqContext = null;
    this.eqFilters = [];
    this.currentPreset = 'Normal';
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

  setEqualizerPreset(presetName) {
    this.currentPreset = presetName || 'Normal';
    if (!this.eqFilters || this.eqFilters.length !== 5) return;
    
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
      // Smoothly transition gains
      filter.gain.setTargetAtTime(gains[i], this.eqContext.currentTime, 0.1);
    });
  }

  _setupEqualizer() {
    if (!this.sound || !this.sound._sounds[0] || !this.sound._sounds[0]._node) return;
    const audioNode = this.sound._sounds[0]._node;
    
    // Ensure crossOrigin is set for MediaElementAudioSourceNode
    if (audioNode.crossOrigin !== 'anonymous') {
      audioNode.crossOrigin = 'anonymous';
    }

    try {
      if (!this.eqContext) {
        this.eqContext = Howler.ctx || new (window.AudioContext || window.webkitAudioContext)();
        
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
