import { MusicService } from './MusicService';
import { usePreferenceStore } from '../../store/preferenceStore';
import { useToastStore } from '../../store/toastStore';

function wordOverlap(a, b) {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const wordsB = b.toLowerCase().split(/\s+/).filter(Boolean);
  let matches = 0;
  for (const w of wordsB) {
    if (wordsA.has(w)) matches++;
  }
  return wordsB.length > 0 ? matches / wordsB.length : 0;
}

class TrackReplacementServiceImpl {
  get confidenceThreshold() {
    return (usePreferenceStore.getState().trackReplacementConfidence || 65) / 100;
  }

  calculateConfidence(failedTrack, candidate) {
    const titleScore = wordOverlap(failedTrack.title || '', candidate.title || '');
    const artistScore = failedTrack.artistNames?.some(a =>
      candidate.artistNames?.some(ca => ca.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(ca.toLowerCase()))
    ) ? 1 : 0;

    return titleScore * 0.6 + artistScore * 0.4;
  }

  async searchCandidates(failedTrack) {
    if (!failedTrack) return [];
    try {
      const query = `${failedTrack.title} ${failedTrack.artistNames?.[0] || ''}`.trim();
      const results = await MusicService.searchSongs(query, 1, 10);
      return results.filter(r => r.id !== failedTrack.id);
    } catch {
      return [];
    }
  }

  async findBestReplacement(failedTrack) {
    const candidates = await this.searchCandidates(failedTrack);
    if (candidates.length === 0) return null;

    const scored = candidates.map(c => ({
      track: c,
      confidence: this.calculateConfidence(failedTrack, c),
    })).sort((a, b) => b.confidence - a.confidence);

    const best = scored[0];
    if (best.confidence >= this.confidenceThreshold) return best.track;
    return null;
  }

  async attemptReplacement(failedTrack, playerStore) {
    try {
      const replacement = await this.findBestReplacement(failedTrack);
      if (!replacement) {
        useToastStore.getState().addToast(`Couldn't find replacement for "${failedTrack.title}"`, 'error');
        return false;
      }

      useToastStore.getState().addToast(
        `Can't play "${failedTrack.title}" — playing "${replacement.title}" instead`,
        'info'
      );

      const state = playerStore.getState();
      const newQueue = state.queue.map(t => t.id === failedTrack.id ? replacement : t);
      playerStore.setState({ queue: newQueue });
      state.play(replacement);
      return true;
    } catch {
      return false;
    }
  }
}

export const trackReplacementService = new TrackReplacementServiceImpl();
