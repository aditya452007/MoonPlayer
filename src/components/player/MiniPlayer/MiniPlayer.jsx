import { Play, Pause, SkipForward, Sparkle } from '@phosphor-icons/react';
import { usePlayerStore } from '../../../store/playerStore';
import { IconButton } from '../../common/IconButton/IconButton';
import { AnimatePresence, m } from 'framer-motion';
import './MiniPlayer.css';

export function MiniPlayer({ onExpand }) {
  const { currentTrack, isPlaying, pause, resume, next, prev, queue, queueIndex } = usePlayerStore();

  if (!currentTrack) return null;

  const handlePlayPause = (e) => {
    e.stopPropagation();
    if (isPlaying) pause();
    else resume();
  };

  const handleNext = (e) => {
    e.stopPropagation();
    next();
  };

  const nextTrack = queue[queueIndex + 1];

  const handleDragEnd = (event, info) => {
    const { offset } = info;
    if (offset.y < -50) {
      onExpand();
    } else if (offset.x < -50) {
      next();
    } else if (offset.x > 50) {
      prev();
    }
  };

  return (
    <div className="mini-player-wrapper">
      <AnimatePresence>
        {!isPlaying && nextTrack && (
          <m.div 
            className="mini-player__suggestion-chip"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            onClick={handleNext}
          >
            <Sparkle size={14} weight="fill" />
            <span>Next up: {nextTrack.title}</span>
          </m.div>
        )}
      </AnimatePresence>

      <m.div 
        className="mini-player"
        onClick={onExpand}
        role="button"
        tabIndex={0}
        aria-label="Expand player"
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onExpand();
          }
        }}
      >
        <div className="mini-player__info">
          <div style={{ position: 'relative' }}>
            <img 
              src={currentTrack.imageUrl || '/default-album-art.png'} 
              alt={currentTrack.title} 
              className="mini-player__art"
            />
            {isPlaying && (
              <div style={{ position: 'absolute', bottom: 4, right: 4, display: 'flex', gap: 2, height: 12, alignItems: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)', padding: 2, borderRadius: 2 }}>
                <m.div animate={{ height: [4, 10, 4] }} transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }} style={{ width: 3, backgroundColor: 'var(--primary)', borderRadius: 1 }} />
                <m.div animate={{ height: [8, 3, 8] }} transition={{ repeat: Infinity, duration: 0.6, ease: "linear" }} style={{ width: 3, backgroundColor: 'var(--primary)', borderRadius: 1 }} />
                <m.div animate={{ height: [5, 12, 5] }} transition={{ repeat: Infinity, duration: 0.4, ease: "linear" }} style={{ width: 3, backgroundColor: 'var(--primary)', borderRadius: 1 }} />
              </div>
            )}
          </div>
          <div className="mini-player__meta">
            <h4 className="mini-player__title">{currentTrack.title}</h4>
            <p className="mini-player__artist">{currentTrack.artistNames?.join(', ')}</p>
          </div>
        </div>

        <div className="mini-player__controls">
          <IconButton 
            icon={isPlaying ? Pause : Play} 
            size="md"
            className="mini-player__btn"
            ariaLabel={isPlaying ? "Pause" : "Play"}
            onClick={handlePlayPause}
          />
          <IconButton 
            icon={SkipForward} 
            size="md"
            className="mini-player__btn"
            ariaLabel="Next"
            onClick={handleNext}
          />
        </div>
      </m.div>
    </div>
  );
}

