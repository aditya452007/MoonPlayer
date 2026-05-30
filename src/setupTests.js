import '@testing-library/jest-dom';

// Mock Howler for tests
global.Howler = {
  ctx: null,
  volume: () => {},
  masterGain: {
    connect: () => {}
  }
};

global.Howl = class {
  constructor(options) {
    this.options = options;
  }
  play() {
    if (this.options.onplay) this.options.onplay();
  }
  pause() {
    if (this.options.onpause) this.options.onpause();
  }
  seek() { return 0; }
  rate() {}
  unload() {}
  playing() { return false; }
};

// Mock IndexedDB (Dexie) if needed
import 'fake-indexeddb/auto';
