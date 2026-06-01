import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Shuffle, 
  Repeat, 
  RepeatOnce 
} from '@phosphor-icons/react';
import { m } from 'framer-motion';
import { IconButton } from '../../common/IconButton/IconButton';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import './Controls.css';

export function Controls({ 
  isPlaying, 
  onPlayPause, 
  onNext, 
  onPrev, 
  isShuffled, 
  onShuffle, 
  loopMode, 
  onLoop 
}) {
  const prefersReducedMotion = useReducedMotion();

  const getLoopIcon = () => {
    if (loopMode === 'one') return RepeatOnce;
    return Repeat;
  };

  return (
    <div className="player-controls">
      {prefersReducedMotion ? (
        <IconButton 
          icon={Shuffle} 
          size="sm"
          active={isShuffled}
          onClick={onShuffle}
          ariaLabel="Toggle shuffle"
        />
      ) : (
        <m.div
          key={`shuffle-${isShuffled}`}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <IconButton 
            icon={Shuffle} 
            size="sm"
            active={isShuffled}
            onClick={onShuffle}
            ariaLabel="Toggle shuffle"
          />
        </m.div>
      )}
      
      <IconButton 
        icon={SkipBack} 
        size="md"
        onClick={onPrev}
        ariaLabel="Previous track"
      />
      
      <div className="player-controls__play-btn">
        <IconButton 
          icon={isPlaying ? Pause : Play} 
          size="xl"
          onClick={onPlayPause}
          ariaLabel={isPlaying ? "Pause" : "Play"}
          style={{ background: 'var(--text-primary)', color: 'var(--bg-void)' }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.93 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.1, ease: [0.25, 1, 0.5, 1] }}
        />
      </div>
      
      <IconButton 
        icon={SkipForward} 
        size="md"
        onClick={onNext}
        ariaLabel="Next track"
      />
      
      {prefersReducedMotion ? (
        <IconButton 
          icon={getLoopIcon()} 
          size="sm"
          active={loopMode !== 'none'}
          onClick={onLoop}
          ariaLabel="Toggle loop"
        />
      ) : (
        <m.div
          key={`loop-${loopMode}`}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <IconButton 
            icon={getLoopIcon()} 
            size="sm"
            active={loopMode !== 'none'}
            onClick={onLoop}
            ariaLabel="Toggle loop"
          />
        </m.div>
      )}
    </div>
  );
}
