import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Shuffle, 
  Repeat, 
  RepeatOnce 
} from '@phosphor-icons/react';
import { IconButton } from '../../common/IconButton/IconButton';
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

  const getLoopIcon = () => {
    if (loopMode === 'one') return RepeatOnce;
    return Repeat;
  };

  return (
    <div className="player-controls">
      <IconButton 
        icon={Shuffle} 
        size="sm"
        active={isShuffled}
        onClick={onShuffle}
        ariaLabel="Toggle shuffle"
      />
      
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
        />
      </div>
      
      <IconButton 
        icon={SkipForward} 
        size="md"
        onClick={onNext}
        ariaLabel="Next track"
      />
      
      <IconButton 
        icon={getLoopIcon()} 
        size="sm"
        active={loopMode !== 'none'}
        onClick={onLoop}
        ariaLabel="Toggle loop"
      />
    </div>
  );
}

