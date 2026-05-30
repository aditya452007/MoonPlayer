import { Howler } from 'howler';

/**
 * VisualizerEngine
 * Connects to Howler's master gain to extract frequency data.
 * Fallbacks to a realistic simulation if Web Audio API data is zeroed out by CORS.
 */
export class VisualizerEngineImpl {
  constructor() {
    this.analyser = null;
    this.dataArray = null;
    this.isSimulating = false;
    this.simulatedPhase = 0;
    // Low (Allocation reduction): Pre-allocate simulated buffer to eliminate GC overhead at 60fps
    this.simulatedArray = new Uint8Array(64);
  }

  /**
   * Initializes the analyser node and connects it safely to Howler's master gain graph.
   */
  init() {
    if (this.analyser) return; // already initialized

    try {
      if (!Howler.ctx || !Howler.masterGain) {
        console.warn('Howler context/masterGain not ready for VisualizerEngine.');
        return;
      }

      const analyser = Howler.ctx.createAnalyser();
      analyser.fftSize = 128; // 64 bins
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      // Connect Howler's master node to our analyser
      Howler.masterGain.connect(analyser);

      // Save references on instance only after ALL connection steps succeed (State Inconsistency fix)
      this.analyser = analyser;
      this.dataArray = dataArray;
    } catch (e) {
      console.warn('Failed to initialize VisualizerEngine analyser:', e);
      this.analyser = null;
      this.dataArray = null;
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
    // Low (CORS check): Expand check scope from 5 bins to 15 bins to prevent false silences
    let sum = 0;
    const checkCount = Math.min(15, this.dataArray.length);
    for (let i = 0; i < checkCount; i++) {
      sum += this.dataArray[i];
    }

    if (sum === 0 && isPlaying) {
      this.isSimulating = true;
      return this._generateSimulatedData(isPlaying);
    }

    this.isSimulating = false;
    return this.dataArray;
  }

  /**
   * Generates realistic-looking audio frequency data using math.
   * Writes into pre-allocated simulatedArray buffer to prevent memory garbage pressure.
   * @param {boolean} isPlaying 
   * @returns {Uint8Array}
   */
  _generateSimulatedData(isPlaying) {
    const bins = 64; // matches fftSize = 128

    if (!isPlaying) {
      this.simulatedArray.fill(0);
      return this.simulatedArray;
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
      this.simulatedArray[i] = Math.floor(value * 255 * dropoff);
    }

    return this.simulatedArray;
  }

  /**
   * Teardown visualizer analyser and disconnect from audio masterGain graph (Memory cleanup).
   */
  destroy() {
    if (this.analyser) {
      try {
        if (Howler.masterGain) {
          Howler.masterGain.disconnect(this.analyser);
        }
        this.analyser.disconnect();
      } catch (e) {
        console.warn('Failed to disconnect analyser on destroy:', e);
      }
      this.analyser = null;
    }
    this.dataArray = null;
    this.isSimulating = false;
  }
}

export const visualizerEngine = new VisualizerEngineImpl();
