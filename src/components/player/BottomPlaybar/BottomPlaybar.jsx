import { Queue } from '@phosphor-icons/react';
import { usePlayerStore } from '../../../store/playerStore';
import { IconButton } from '../../common/IconButton/IconButton';
import { Controls } from '../Controls/Controls';
import { ProgressBar } from '../ProgressBar/ProgressBar';
import { VolumeControl } from '../VolumeControl/VolumeControl';
import './BottomPlaybar.css';

/**
 * BottomPlaybar Component
 * The persistent playback control bar displayed at the bottom of the viewport.
 * Wires the shuffle state controller and sets album art onerror boundaries.
 */
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
    toggleQueueVisibility,
    shuffleQueue // Destructure here to restore Shuffle UI (Issue #13)
  } = usePlayerStore();

  if (!currentTrack) return null;

  const handlePlayPause = () => {
    if (isPlaying) pause();
    else resume();
  };

  const handleShuffle = () => {
    shuffleQueue();
  };

  // Safe image loading fallback error boundary (Issue #34)
  const handleImageError = (e) => {
    e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="%231E293B"/><path d="M40 25a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm-12 18h24v4a2 2 0 0 1-2 2H30a2 2 0 0 1-2-2v-4z" fill="%2364748B"/></svg>';
  };

  return (
    <div className="bottom-playbar">
      {/* Left: Track Info */}
      <button 
        type="button"
        className="bottom-playbar__info" 
        onClick={onExpand}
        aria-label="Expand player"
      >
        <img 
          src={currentTrack.imageUrl || '/default-album-art.png'} 
          alt={currentTrack.title} 
          className="bottom-playbar__art"
          onError={handleImageError}
        />
        <div className="bottom-playbar__meta">
          <h4 className="bottom-playbar__title">{currentTrack.title}</h4>
          <p className="bottom-playbar__artist">{currentTrack.artistNames?.join(', ')}</p>
        </div>
      </button>

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
