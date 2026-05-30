import { Howler } from 'howler';

/**
 * VisualizerEngine
 * Connects to Howler's master gain to extract frequency data.
 * Fallbacks to a realistic simulation if Web Audio API data is zeroed out by CORS.
 */
class VisualizerEngineImpl {
  constructor() {
    this.analyser = null;
    this.dataArray = null;
    this.isSimulating = false;
    this.simulatedPhase = 0;
  }

  init() {
    if (this.analyser) return; // already initialized

    try {
      if (!Howler.ctx) {
        console.warn('Howler context not ready for VisualizerEngine.');
        return;
      }

      this.analyser = Howler.ctx.createAnalyser();
      this.analyser.fftSize = 128; // 64 bins
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      // Connect Howler's master node to our analyser
      Howler.masterGain.connect(this.analyser);
    } catch (e) {
      console.warn('Failed to initialize VisualizerEngine analyser:', e);
    }
  }

  /**
   * Retrieves real-time frequency data.
   * If real data is blocked (all zeros due to CORS), it falls back to simulation.
   * @param {boolean} isPlaying - Current playback state (to drive simulation)
   * @returns {Uint8Array} Frequency data (0-255)
   */
  getFrequencyData(isPlaying) {
    if (!this.analyser || !this.dataArray) {
      return this._generateSimulatedData(isPlaying);
    }

    // Attempt to get real data
    this.analyser.getByteFrequencyData(this.dataArray);

    // Check if data is completely flat (CORS block symptom)
    // We only check the first few bins for efficiency
    let sum = 0;
    for (let i = 0; i < 5; i++) sum += this.dataArray[i];

    if (sum === 0 && isPlaying) {
      this.isSimulating = true;
      return this._generateSimulatedData(isPlaying);
    }

    this.isSimulating = false;
    return this.dataArray;
  }

  /**
   * Generates realistic-looking audio frequency data using math.
   * High values in bass (low indices), dropping off towards treble.
   */
  _generateSimulatedData(isPlaying) {
    const bins = 64; // matches fftSize = 128
    const arr = new Uint8Array(bins);

    if (!isPlaying) {
      // Return flat zeros when paused
      return arr;
    }

    // Advance phase to animate
    this.simulatedPhase += 0.15;

    for (let i = 0; i < bins; i++) {
      // Base curve: drops off as i increases (like real EQ)
      const dropoff = Math.max(0, 1 - (i / bins));
      
      // Moving waves
      const wave1 = Math.sin(this.simulatedPhase + i * 0.2);
      const wave2 = Math.cos(this.simulatedPhase * 0.5 - i * 0.1);
      
      // Noise
      const noise = Math.random() * 0.2;

      // Combine and scale to 0-255
      const value = (wave1 * 0.4 + wave2 * 0.4 + noise + 1) * 0.5; // 0 to 1
      arr[i] = Math.floor(value * 255 * dropoff);
    }

    return arr;
  }
}

export const visualizerEngine = new VisualizerEngineImpl();
