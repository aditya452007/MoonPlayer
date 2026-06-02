import { useState, useEffect } from 'react';
import { Queue, X } from '@phosphor-icons/react';
import { usePlayerStore } from '../../../store/playerStore';
import { useQueueStore } from '../../../store/queueStore';
import { IconButton } from '../../common/IconButton/IconButton';
import { Controls } from '../Controls/Controls';
import { GradientProgressBar } from '../ProgressBar/GradientProgressBar';
import { VolumeControl } from '../VolumeControl/VolumeControl';
import { ImgWithFallback } from '../../common/ImgWithFallback/ImgWithFallback';
import { extractDominantColor } from '../../../core/utils/colorExtractor';
import { NowPlayingBars } from '../../common/NowPlayingBars/NowPlayingBars';
import './BottomPlaybar.css';

export function BottomPlaybar() {
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const pause = usePlayerStore(s => s.pause);
  const resume = usePlayerStore(s => s.resume);
  const next = usePlayerStore(s => s.next);
  const prev = usePlayerStore(s => s.prev);
  const isShuffled = usePlayerStore(s => s.isShuffled);
  const loopMode = usePlayerStore(s => s.loopMode);
  const toggleLoop = usePlayerStore(s => s.toggleLoop);
  const progress = usePlayerStore(s => s.progress);
  const seek = usePlayerStore(s => s.seek);
  const volume = usePlayerStore(s => s.volume);
  const setVolume = usePlayerStore(s => s.setVolume);
  const isQueueVisible = usePlayerStore(s => s.isQueueVisible);
  const toggleQueueVisibility = usePlayerStore(s => s.toggleQueueVisibility);
  const setFullscreen = usePlayerStore(s => s.setFullscreen);
  const stop = usePlayerStore(s => s.stop);

  const shuffleQueue = useQueueStore(s => s.shuffleQueue);

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
        <IconButton 
          icon={X}
          size="md"
          ariaLabel="Close Player"
          onClick={stop}
          className="bottom-playbar__close-btn"
        />
      </div>
    </div>
  );
}

export default BottomPlaybar;
