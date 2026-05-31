import { useState, useEffect } from 'react';
import { Queue } from '@phosphor-icons/react';
import { usePlayerStore } from '../../../store/playerStore';
import { IconButton } from '../../common/IconButton/IconButton';
import { Controls } from '../Controls/Controls';
import { GradientProgressBar } from '../ProgressBar/GradientProgressBar';
import { VolumeControl } from '../VolumeControl/VolumeControl';
import { ImgWithFallback } from '../../common/ImgWithFallback/ImgWithFallback';
import { extractDominantColor } from '../../../core/utils/colorExtractor';
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

  const [dominantColor, setDominantColor] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      await Promise.resolve();
      if (!isMounted) return;
      if (currentTrack?.imageUrl) {
        extractDominantColor(currentTrack.imageUrl).then(color => {
          if (isMounted) setDominantColor(color);
        });
      } else {
        setDominantColor(null);
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, [currentTrack]);

  if (!currentTrack) return null;

  const handlePlayPause = () => {
    if (isPlaying) pause();
    else resume();
  };

  const handleShuffle = () => {
    shuffleQueue();
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
        <ImgWithFallback 
          src={currentTrack.imageUrl} 
          alt={currentTrack.title} 
          className="bottom-playbar__art"
          fallbackSrc="/default-album-art.png"
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
          <GradientProgressBar 
            current={progress}
            total={currentTrack.duration}
            onSeek={seek}
            dominantColor={dominantColor}
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
