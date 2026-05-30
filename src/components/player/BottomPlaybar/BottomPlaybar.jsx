import { Queue } from '@phosphor-icons/react';
import { usePlayerStore } from '../../../store/playerStore';
import { IconButton } from '../../common/IconButton/IconButton';
import { Controls } from '../Controls/Controls';
import { ProgressBar } from '../ProgressBar/ProgressBar';
import { VolumeControl } from '../VolumeControl/VolumeControl';
import './BottomPlaybar.css';

const handleShuffle = () => {
  console.log('Shuffle toggled');
};

export function BottomPlaybar({ onExpand }) {
  const { 
    currentTrack, 
    isPlaying, 
    pause, 
    resume,
    next, 
    prev, 
    isShuffled, 
    loopMode, 
    toggleLoop,
    progress,
    seek,
    volume,
    setVolume,
    isQueueVisible,
    toggleQueueVisibility
  } = usePlayerStore();

  if (!currentTrack) return null;

  const handlePlayPause = () => {
    if (isPlaying) pause();
    else resume();
  };

  return (
    <div className="bottom-playbar">
      {/* Left: Track Info */}
      <div 
        className="bottom-playbar__info" 
        onClick={onExpand}
        role="button"
        tabIndex={0}
        aria-label="Expand player"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onExpand();
          }
        }}
      >
        <img 
          src={currentTrack.imageUrl || '/default-album-art.png'} 
          alt={currentTrack.title} 
          className="bottom-playbar__art"
        />
        <div className="bottom-playbar__meta">
          <h4 className="bottom-playbar__title">{currentTrack.title}</h4>
          <p className="bottom-playbar__artist">{currentTrack.artistNames?.join(', ')}</p>
        </div>
      </div>

      {/* Center: Controls & Progress */}
      <div className="bottom-playbar__center">
        <Controls 
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onNext={next}
          onPrev={prev}
          isShuffled={isShuffled}
          onShuffle={handleShuffle}
          loopMode={loopMode}
          onLoop={toggleLoop}
        />
        <div className="bottom-playbar__progress-wrapper">
          <ProgressBar 
            current={progress}
            total={currentTrack.duration}
            onSeek={seek}
          />
        </div>
      </div>

      {/* Right: Volume & Extras */}
      <div className="bottom-playbar__right">
        <IconButton 
          icon={Queue}
          size="md"
          ariaLabel="Toggle Queue"
          onClick={toggleQueueVisibility}
          className={isQueueVisible ? 'active-icon' : ''}
        />
        <VolumeControl 
          volume={volume}
          onVolumeChange={setVolume}
        />
      </div>
    </div>
  );
}
