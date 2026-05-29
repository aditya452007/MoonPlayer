import { usePlayerStore } from '../../../store/playerStore';
import { GlassPanel } from '../../common/GlassPanel/GlassPanel';
import { Controls } from '../Controls/Controls';
import { ProgressBar } from '../ProgressBar/ProgressBar';
import { VolumeControl } from '../VolumeControl/VolumeControl';
import './GlobalPlayer.css';

export function GlobalPlayer() {
  const { 
    currentTrack, 
    isPlaying, 
    play, 
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
    setVolume
  } = usePlayerStore();

  if (!currentTrack) {
    return null; // Don't render until a track is selected
  }

  const handlePlayPause = () => {
    if (isPlaying) pause();
    else resume();
  };

  const handleShuffle = () => {
    // We'll implement shuffle state toggle in store later
    console.log('Shuffle toggled');
  };

  return (
    <GlassPanel className="global-player" blur="heavy">
      <div className="global-player__inner">
        
        {/* Left: Track Info */}
        <div className="global-player__info">
          <img 
            src={currentTrack.imageUrl} 
            alt={currentTrack.title} 
            className="global-player__art"
          />
          <div className="global-player__meta">
            <h4 className="global-player__title">{currentTrack.title}</h4>
            <p className="global-player__artist">{currentTrack.artistNames.join(', ')}</p>
          </div>
        </div>

        {/* Center: Controls & Progress */}
        <div className="global-player__center">
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
          <div className="global-player__progress-wrapper">
            <ProgressBar 
              current={progress}
              total={currentTrack.duration}
              onSeek={seek}
            />
          </div>
        </div>

        {/* Right: Volume & Extras */}
        <div className="global-player__right">
          <VolumeControl 
            volume={volume}
            onVolumeChange={setVolume}
          />
        </div>

      </div>
    </GlassPanel>
  );
}
