import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { usePlayerStore } from '../playerStore';

describe('playerStore', () => {
  beforeEach(() => {
    const { clearQueue } = usePlayerStore.getState();
    clearQueue();
    usePlayerStore.setState({
      currentTrack: null,
      queue: [],
      queueIndex: -1,
      isPlaying: false,
      volume: 1,
      loopMode: 'none',
      isShuffled: false,
      progress: 0,
      isMuted: false,
      previousVolume: 1,
      sleepTimerEnd: null,
    });
  });

  afterEach(() => {
    const { setSleepTimer } = usePlayerStore.getState();
    setSleepTimer(0); // Ensure timer is cleaned up
  });

  it('should add tracks to queue and play', () => {
    const { play, playNext } = usePlayerStore.getState();
    const track1 = { id: '1', title: 'Song 1', streamUrl: 'http://test/1.mp3' };
    const track2 = { id: '2', title: 'Song 2', streamUrl: 'http://test/2.mp3' };
    
    play(track1);
    
    let state = usePlayerStore.getState();
    expect(state.currentTrack).toEqual(track1);
    expect(state.isPlaying).toBe(true);
    expect(state.queue).toHaveLength(1);

    playNext(track2);
    
    state = usePlayerStore.getState();
    expect(state.queue).toHaveLength(2);
    expect(state.queue[1]).toEqual(track2);
  });

  it('should pause and resume playback', () => {
    const { play, pause, resume } = usePlayerStore.getState();
    const track1 = { id: '1', title: 'Song 1', streamUrl: 'http://test/1.mp3' };
    
    play(track1);
    expect(usePlayerStore.getState().isPlaying).toBe(true);

    pause();
    expect(usePlayerStore.getState().isPlaying).toBe(false);

    resume();
    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });

  it('should adjust volume and toggle mute', () => {
    const { setVolume, toggleMute } = usePlayerStore.getState();

    setVolume(0.8);
    expect(usePlayerStore.getState().volume).toBe(0.8);
    expect(usePlayerStore.getState().isMuted).toBe(false);

    toggleMute();
    expect(usePlayerStore.getState().volume).toBe(0);
    expect(usePlayerStore.getState().isMuted).toBe(true);
    expect(usePlayerStore.getState().previousVolume).toBe(0.8);

    toggleMute();
    expect(usePlayerStore.getState().volume).toBe(0.8);
    expect(usePlayerStore.getState().isMuted).toBe(false);
  });

  it('should seek to a progress position', () => {
    const { seek } = usePlayerStore.getState();
    
    seek(45);
    expect(usePlayerStore.getState().progress).toBe(45);

    // Negative values should be clamped to 0
    seek(-10);
    expect(usePlayerStore.getState().progress).toBe(0);
  });

  it('should toggle loop mode sequentially', () => {
    const { toggleLoop } = usePlayerStore.getState();

    expect(usePlayerStore.getState().loopMode).toBe('none');

    toggleLoop();
    expect(usePlayerStore.getState().loopMode).toBe('all');

    toggleLoop();
    expect(usePlayerStore.getState().loopMode).toBe('one');

    toggleLoop();
    expect(usePlayerStore.getState().loopMode).toBe('none');
  });

  it('should navigate through queue index sequentially (next/prev)', () => {
    const { play, addToQueue, next, prev } = usePlayerStore.getState();
    const track1 = { id: '1', title: 'Song 1', streamUrl: 'http://test/1.mp3' };
    const track2 = { id: '2', title: 'Song 2', streamUrl: 'http://test/2.mp3' };
    const track3 = { id: '3', title: 'Song 3', streamUrl: 'http://test/3.mp3' };

    play(track1);
    addToQueue([track2, track3]);

    expect(usePlayerStore.getState().queueIndex).toBe(0);

    next();
    expect(usePlayerStore.getState().queueIndex).toBe(1);
    expect(usePlayerStore.getState().currentTrack.id).toBe('2');

    next();
    expect(usePlayerStore.getState().queueIndex).toBe(2);
    expect(usePlayerStore.getState().currentTrack.id).toBe('3');

    // Without loop, next on last track pauses playback
    next();
    expect(usePlayerStore.getState().isPlaying).toBe(false);

    // Loop back to play track 2
    play(track2);
    prev();
    expect(usePlayerStore.getState().queueIndex).toBe(0);
    expect(usePlayerStore.getState().currentTrack.id).toBe('1');
  });

  it('should manage tracks removal and clear queue properly', () => {
    const { play, addToQueue, removeFromQueue, clearQueue } = usePlayerStore.getState();
    const track1 = { id: '1', title: 'Song 1', streamUrl: 'http://test/1.mp3' };
    const track2 = { id: '2', title: 'Song 2', streamUrl: 'http://test/2.mp3' };
    const track3 = { id: '3', title: 'Song 3', streamUrl: 'http://test/3.mp3' };

    play(track1);
    addToQueue([track2, track3]);
    expect(usePlayerStore.getState().queue).toHaveLength(3);

    // Remove index 2 (track3)
    removeFromQueue(2);
    expect(usePlayerStore.getState().queue).toHaveLength(2);
    expect(usePlayerStore.getState().queue.map(t => t.id)).toEqual(['1', '2']);

    // Clear queue should retain active track
    clearQueue();
    expect(usePlayerStore.getState().queue).toHaveLength(1);
    expect(usePlayerStore.getState().queue[0].id).toBe('1');
  });

  it('should shuffle upcoming queue correctly while keeping current track stable', () => {
    const { play, addToQueue, shuffleQueue } = usePlayerStore.getState();
    const track1 = { id: '1', title: 'Song 1', streamUrl: 'http://test/1.mp3' };
    const track2 = { id: '2', title: 'Song 2', streamUrl: 'http://test/2.mp3' };
    const track3 = { id: '3', title: 'Song 3', streamUrl: 'http://test/3.mp3' };
    const track4 = { id: '4', title: 'Song 4', streamUrl: 'http://test/4.mp3' };

    play(track1);
    addToQueue([track2, track3, track4]);

    shuffleQueue();
    const state = usePlayerStore.getState();
    expect(state.queue[0].id).toBe('1'); // Active track remains in place
    expect(state.isShuffled).toBe(true);
  });

  it('should set sleep timer and pause audio when timer expires', () => {
    const { play, setSleepTimer } = usePlayerStore.getState();
    const track1 = { id: '1', title: 'Song 1', streamUrl: 'http://test/1.mp3' };
    
    vi.useFakeTimers();
    
    play(track1);
    expect(usePlayerStore.getState().isPlaying).toBe(true);

    setSleepTimer(10); // 10 minutes
    const state = usePlayerStore.getState();
    expect(state.sleepTimerEnd).toBeGreaterThan(Date.now());

    // Advance time by 10 minutes
    vi.advanceTimersByTime(10 * 60 * 1000);
    
    const finalState = usePlayerStore.getState();
    expect(finalState.isPlaying).toBe(false); // Should be paused
    expect(finalState.sleepTimerEnd).toBeNull(); // Cleaned up
    
    vi.useRealTimers();
  });
});
