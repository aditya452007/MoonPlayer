import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { usePlayerStore } from '../playerStore';

describe('playerStore', () => {
  beforeEach(() => {
    const { clearQueue } = usePlayerStore.getState();
    clearQueue();
  });

  afterEach(() => {
    if (window._sleepTimerInterval) {
      clearInterval(window._sleepTimerInterval);
      window._sleepTimerInterval = null;
    }
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

  it('should set sleep timer correctly', () => {
    const { setSleepTimer } = usePlayerStore.getState();
    
    vi.useFakeTimers();
    
    setSleepTimer(10); // 10 minutes
    const state = usePlayerStore.getState();
    
    expect(state.sleepTimerEnd).toBeGreaterThan(Date.now());
    expect(window._sleepTimerInterval).toBeDefined();

    setSleepTimer(0); // Cancel
    const cancelledState = usePlayerStore.getState();
    expect(cancelledState.sleepTimerEnd).toBeNull();
    expect(window._sleepTimerInterval).toBeNull();
    
    vi.useRealTimers();
  });
});
