import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AudioEngineImpl } from '../AudioEngine';
import { Howl } from 'howler';

describe('AudioEngine', () => {
  let audioEngine;

  beforeEach(() => {
    audioEngine = new AudioEngineImpl();
    vi.clearAllMocks();
  });

  afterEach(() => {
    audioEngine.destroy();
    vi.restoreAllMocks();
  });

  it('should initialize and play a track', () => {
    const playSpy = vi.spyOn(Howl.prototype, 'play');
    
    audioEngine.playTrack('http://test.url/song.mp3', 0.5);
    
    expect(audioEngine.sound).toBeDefined();
    expect(playSpy).toHaveBeenCalled();
  });

  it('should pause playback', () => {
    const pauseSpy = vi.spyOn(Howl.prototype, 'pause');
    vi.spyOn(Howl.prototype, 'playing').mockReturnValue(true);
    
    audioEngine.playTrack('http://test.url/song.mp3', 0.5);
    audioEngine.pause();
    
    expect(pauseSpy).toHaveBeenCalled();
  });

  it('should seek to a specific time', () => {
    const seekSpy = vi.spyOn(Howl.prototype, 'seek');
    const stateSpy = vi.spyOn(Howl.prototype, 'state').mockReturnValue('loaded');
    
    audioEngine.playTrack('http://test.url/song.mp3', 0.5);
    audioEngine.seek(30);
    
    expect(seekSpy).toHaveBeenCalledWith(30);
    stateSpy.mockRestore();
  });

  it('should update equalizer preset', () => {
    audioEngine.setEqualizerPreset('Bass Boost');
    expect(audioEngine.currentPreset).toBe('Bass Boost');
  });
});
