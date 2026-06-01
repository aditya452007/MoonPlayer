import { useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { X, Warning } from '@phosphor-icons/react';
import { usePlayerStore } from '../../../store/playerStore';
import { useToastStore } from '../../../store/toastStore';
import { trackReplacementService } from '../../../core/api/trackReplacementService';
import { IconButton } from '../IconButton/IconButton';
import './SmartReplaceDialog.css';

export function SmartReplaceDialog({ failedTrack, onClose }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchCandidates = async () => {
      setLoading(true);
      try {
        const results = await trackReplacementService.searchCandidates(failedTrack);
        if (active) {
          const scored = results.map(c => {
            const confidence = trackReplacementService.calculateConfidence(failedTrack, c);
            return { track: c, confidence };
          }).sort((a, b) => b.confidence - a.confidence);
          setCandidates(scored);
        }
      } catch (err) {
        console.error('Failed to load replacement candidates:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    if (failedTrack) fetchCandidates();

    return () => {
      active = false;
    };
  }, [failedTrack]);

  if (!failedTrack) return null;

  const handleSelect = (candidate) => {
    const state = usePlayerStore.getState();
    const newQueue = state.queue.map(t => t.id === failedTrack.id ? candidate : t);
    usePlayerStore.setState({ queue: newQueue });
    state.play(candidate);
    useToastStore.getState().addToast(`Replaced "${failedTrack.title}" with "${candidate.title}"`, 'success');
    onClose();
  };

  const getBadgeClass = (score) => {
    if (score >= 0.8) return 'smart-replace__badge--high';
    if (score >= 0.5) return 'smart-replace__badge--medium';
    return 'smart-replace__badge--low';
  };

  const getBadgeLabel = (score) => {
    if (score >= 0.8) return 'HIGH MATCH';
    if (score >= 0.5) return 'MEDIUM MATCH';
    return 'LOW MATCH';
  };

  return (
    <div className="smart-replace">
      <div className="smart-replace__backdrop" onClick={onClose} />
      <m.div 
        className="smart-replace__dialog"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="smart-replace__header">
          <h2 className="smart-replace__title">Smart Track Replacement</h2>
          <IconButton 
            icon={X} 
            size="sm" 
            onClick={onClose} 
            ariaLabel="Close replacement dialog"
            className="smart-replace__close-btn"
          />
        </div>

        <div className="smart-replace__body">
          <div className="smart-replace__info">
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', marginBottom: 'var(--space-2)', color: 'var(--accent-secondary)' }}>
              <Warning size={18} weight="fill" />
              <strong>Playback Failed</strong>
            </div>
            Couldn't load stream for <strong>"{failedTrack.title}"</strong>. Choose a replacement track below to resume listening:
          </div>

          {loading ? (
            <div className="smart-replace__searching">
              <div className="smart-replace__spinner" />
              <span>Searching for matches...</span>
            </div>
          ) : candidates.length === 0 ? (
            <div className="smart-replace__searching" style={{ padding: 'var(--space-6)' }}>
              <span>No matching alternative tracks found.</span>
            </div>
          ) : (
            <div className="smart-replace__list">
              {candidates.map(({ track, confidence }) => (
                <button
                  type="button"
                  key={track.id}
                  className="smart-replace__item"
                  onClick={() => handleSelect(track)}
                >
                  <img 
                    src={track.imageUrl || '/default-album-art.png'} 
                    alt="" 
                    className="smart-replace__item-art" 
                  />
                  <div className="smart-replace__item-info">
                    <p className="smart-replace__item-title">{track.title}</p>
                    <p className="smart-replace__item-artist">{track.artistNames?.join(', ')}</p>
                  </div>
                  <span className={`smart-replace__badge ${getBadgeClass(confidence)}`}>
                    {getBadgeLabel(confidence)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </m.div>
    </div>
  );
}

export default SmartReplaceDialog;
