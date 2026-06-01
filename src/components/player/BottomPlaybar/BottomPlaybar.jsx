import { useState, useEffect } from 'react';
import { Queue } from '@phosphor-icons/react';
import { usePlayerStore } from '../../../store/playerStore';
import { IconButton } from '../../common/IconButton/IconButton';
import { Controls } from '../Controls/Controls';
import { GradientProgressBar } from '../ProgressBar/GradientProgressBar';
import { VolumeControl } from '../VolumeControl/VolumeControl';
import { ImgWithFallback } from '../../common/ImgWithFallback/ImgWithFallback';
import { extractDominantColor } from '../../../core/utils/colorExtractor';
import { NowPlayingBars } from '../../common/NowPlayingBars/NowPlayingBars';
import './BottomPlaybar.css';

export function BottomPlaybar() {
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
    shuffleQueue,
    setFullscreen
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
      <button 
        type="button"
        className="bottom-playbar__info" 
        onClick={() => setFullscreen(true)}
        aria-label="Expand player"
      >
        <div style={{ position: 'relative', display: 'flex', borderRadius: 'var(--radius-sm)' }}>
          <ImgWithFallback 
            src={currentTrack.imageUrl} 
            alt={currentTrack.title} 
            className="bottom-playbar__art"
            fallbackSrc="/default-album-art.png"
          />
          {isPlaying && (
            <div className="bottom-playbar__playing-indicator" style={{ position: 'absolute', bottom: 4, right: 4, zIndex: 2 }}>
              <NowPlayingBars isPlaying={isPlaying} barCount={3} />
            </div>
          )}
        </div>
        <div className="bottom-playbar__meta">
          <h4 className="bottom-playbar__title">{currentTrack.title}</h4>
          <p className="bottom-playbar__artist">{currentTrack.artistNames?.join(', ')}</p>
        </div>
      </button>

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

export default BottomPlaybar;
