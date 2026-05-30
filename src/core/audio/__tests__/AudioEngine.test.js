import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AudioEngine } from '../AudioEngine';

describe('AudioEngine', () => {
  beforeEach(() => {
    // Reset any internal state
    AudioEngine.sound = null;
    AudioEngine.currentPreset = 'Normal';
    vi.clearAllMocks();
  });

  it('should initialize and play a track', () => {
    const playSpy = vi.spyOn(global.Howl.prototype, 'play');
    
    AudioEngine.playTrack('http://test.url/song.mp3', 0.5);
    
    expect(AudioEngine.sound).toBeDefined();
    expect(playSpy).toHaveBeenCalled();
  });

  it('should pause playback', () => {
    const pauseSpy = vi.spyOn(global.Howl.prototype, 'pause');
    const playingSpy = vi.spyOn(global.Howl.prototype, 'playing').mockReturnValue(true);
    
    AudioEngine.playTrack('http://test.url/song.mp3', 0.5);
    AudioEngine.pause();
    
    expect(pauseSpy).toHaveBeenCalled();
    playingSpy.mockRestore();
  });

  it('should seek to a specific time', () => {
    const seekSpy = vi.spyOn(global.Howl.prototype, 'seek');
    
    AudioEngine.playTrack('http://test.url/song.mp3', 0.5);
    AudioEngine.seek(30);
    
    expect(seekSpy).toHaveBeenCalledWith(30);
  });

  it('should update equalizer preset', () => {
    AudioEngine.setEqualizerPreset('Bass Boost');
    expect(AudioEngine.currentPreset).toBe('Bass Boost');
  });
});
