import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Define comprehensive mock structures
const mockHowler = {
  ctx: {
    currentTime: 0,
    createBiquadFilter: () => ({
      type: '',
      frequency: { value: 0 },
      gain: {
        value: 0,
        setTargetAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    }),
    createMediaElementSource: () => ({
      connect: vi.fn(),
    }),
    destination: {},
    state: 'running',
    resume: vi.fn(),
  },
  volume: vi.fn(),
};

class mockHowl {
  constructor(options) {
    this.options = options || {};
    this._sounds = [{
      _node: {
        crossOrigin: '',
        _eqSourceConnected: false,
      }
    }];
    
    // Simulate async load
    setTimeout(() => {
      if (this.options.onload) this.options.onload();
    }, 0);
  }

  play() {
    if (this.options.onplay) this.options.onplay();
    return 1;
  }

  pause() {
    if (this.options.onpause) this.options.onpause();
  }

  seek(seconds) {
    if (typeof seconds === 'number') {
      this._seekPos = seconds;
      return this;
    }
    return this._seekPos || 0;
  }

  rate(speed) {
    if (speed !== undefined) {
      this._rate = speed;
      return this;
    }
    return this._rate || 1.0;
  }

  unload() {
    if (this.options.onunload) this.options.onunload();
  }

  playing() {
    return true;
  }

  state() {
    return 'loaded';
  }

  once(event, callback) {
    if (event === 'load') {
      callback();
    }
  }

  stop() {
    if (this.options.onstop) this.options.onstop();
  }
}

// vi.mock is automatically hoisted before ES imports!
vi.mock('howler', () => ({
  Howl: mockHowl,
  Howler: mockHowler,
}));

// Also define on globalThis in case any third-party/legacy modules look for them
globalThis.Howl = mockHowl;
globalThis.Howler = mockHowler;

// Mock IndexedDB (Dexie) if needed
import 'fake-indexeddb/auto';
