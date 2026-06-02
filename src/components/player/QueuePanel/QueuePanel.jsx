import { useCallback } from 'react';
import { Reorder, AnimatePresence, m } from 'framer-motion';
import { X, Trash, Shuffle, Play } from '@phosphor-icons/react';
import { usePlayerStore } from '../../../store/playerStore';
import { useQueueStore } from '../../../store/queueStore';
import { IconButton } from '../../common/IconButton/IconButton';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import { ImgWithFallback } from '../../common/ImgWithFallback/ImgWithFallback';
import './QueuePanel.css';

export function QueuePanel() {
  const { isMobile } = useBreakpoint();

  const queue = useQueueStore(s => s.queue);
  const queueIndex = useQueueStore(s => s.queueIndex);
  const reorderQueue = useQueueStore(s => s.reorderQueue);
  const removeFromQueue = useQueueStore(s => s.removeFromQueue);
  const clearQueue = useQueueStore(s => s.clearQueue);
  const shuffleQueue = useQueueStore(s => s.shuffleQueue);

  const toggleQueueVisibility = usePlayerStore(s => s.toggleQueueVisibility);
  const play = usePlayerStore(s => s.play);

  const upcomingTracks = queue.slice(queueIndex + 1);

  const handleReorder = (newUpcoming) => {
    const history = queue.slice(0, queueIndex + 1);
    reorderQueue([...history, ...newUpcoming]);
  };

  const renderTrackItem = useCallback((track, indexInUpcoming) => {
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
          <ImgWithFallback 
            src={track.imageUrl} 
            alt={track.title} 
            style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
            fallbackSrc="/default-album-art.png"
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
  }, [queueIndex, play, removeFromQueue]);

  const innerContent = (
    <>
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
          <IconButton 
            icon={X} 
            size="md" 
            ariaLabel="Close Queue" 
            onClick={toggleQueueVisibility} 
          />
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
    </>
  );

  if (isMobile) {
    return (
      <m.div
        className="queue-panel-overlay"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
      >
        <div className="queue-panel-overlay__handle" onClick={toggleQueueVisibility} />
        <div className="queue-panel">
          {innerContent}
        </div>
      </m.div>
    );
  }

  return (
    <m.div 
      className="queue-panel-sidebar"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'tween', duration: 0.25 }}
    >
      <div className="queue-panel">
        {innerContent}
      </div>
    </m.div>
  );
}

export default QueuePanel;
