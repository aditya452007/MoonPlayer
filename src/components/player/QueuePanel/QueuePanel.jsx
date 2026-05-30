import { useCallback } from 'react';
import { Reorder, AnimatePresence } from 'framer-motion';
import { X, Trash, Shuffle, Play } from '@phosphor-icons/react';
import { usePlayerStore } from '../../../store/playerStore';
import { IconButton } from '../../common/IconButton/IconButton';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import './QueuePanel.css';

/**
 * QueuePanel Component
 * Displays the current upcoming tracks play queue.
 * Memoizes list items rendering to prevent redundant component updates
 * and manages broken image recovery.
 */
export function QueuePanel() {
  const { isMobile } = useBreakpoint();
  const { 
    queue, 
    queueIndex, 
    reorderQueue, 
    removeFromQueue, 
    clearQueue, 
    shuffleQueue,
    toggleQueueVisibility,
    play
  } = usePlayerStore();

  const upcomingTracks = queue.slice(queueIndex + 1);

  const handleReorder = (newUpcoming) => {
    const history = queue.slice(0, queueIndex + 1);
    reorderQueue([...history, ...newUpcoming]);
  };

  // Safe image loading fallback error boundary (Issue #34)
  const handleImageError = useCallback((e) => {
    e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 80 80"><rect width="80" height="80" fill="%231E293B"/><path d="M40 25a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm-12 18h24v4a2 2 0 0 1-2 2H30a2 2 0 0 1-2-2v-4z" fill="%2364748B"/></svg>';
  }, []);

  // Wrap renderTrackItem in useCallback to prevent re-instantiating on every cycle (Issue #30)
  const renderTrackItem = useCallback((track, indexInUpcoming) => {
    // The actual index in the main queue
    const actualIndex = queueIndex + 1 + indexInUpcoming;

    return (
      <Reorder.Item 
        key={track.id + '-' + actualIndex} 
        value={track} 
        className="queue-panel__item"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scaleY: 0 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: 'var(--space-2)', gap: 'var(--space-3)' }}>
          <img 
            src={track.imageUrl || '/default-album-art.png'} 
            alt={track.title} 
            style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
            onError={handleImageError}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {track.title}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              {track.artistNames?.join(', ')}
            </div>
          </div>
          
          <IconButton 
            icon={Play}
            size="sm"
            ariaLabel="Play now"
            onClick={() => play(track)}
          />
          
          <IconButton 
            icon={Trash}
            size="sm"
            ariaLabel="Remove"
            onClick={() => removeFromQueue(actualIndex)}
          />
        </div>
      </Reorder.Item>
    );
  }, [queueIndex, play, removeFromQueue, handleImageError]);

  return (
    <div className="queue-panel">
      <div className="queue-panel__header">
        <h3 className="queue-panel__title">Up Next</h3>
        <div className="queue-panel__actions">
          <IconButton 
            icon={Shuffle} 
            size="md" 
            ariaLabel="Shuffle upcoming" 
            onClick={shuffleQueue} 
          />
          <IconButton 
            icon={Trash} 
            size="md" 
            ariaLabel="Clear queue" 
            onClick={clearQueue} 
          />
          {isMobile && (
            <IconButton 
              icon={X} 
              size="md" 
              ariaLabel="Close Queue" 
              onClick={toggleQueueVisibility} 
            />
          )}
        </div>
      </div>

      <div className="queue-panel__content">
        {upcomingTracks.length === 0 ? (
          <div className="queue-panel__empty">
            <p>Your queue is empty.</p>
          </div>
        ) : (
          <Reorder.Group axis="y" values={upcomingTracks} onReorder={handleReorder} style={{ padding: 0, margin: 0 }}>
            <AnimatePresence initial={false}>
              {upcomingTracks.map((track, idx) => renderTrackItem(track, idx))}
            </AnimatePresence>
          </Reorder.Group>
        )}
      </div>
    </div>
  );
}
