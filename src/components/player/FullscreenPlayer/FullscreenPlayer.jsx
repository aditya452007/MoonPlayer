import { useState, useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { CaretDown, DotsThree, MicrophoneStage, Heart } from '@phosphor-icons/react';
import { usePlayerStore } from '../../../store/playerStore';
import { usePreferenceStore } from '../../../store/preferenceStore';
import { useLibraryStore } from '../../../store/libraryStore';
import { IconButton } from '../../common/IconButton/IconButton';
import { Controls } from '../Controls/Controls';
import { GradientProgressBar } from '../ProgressBar/GradientProgressBar';
import { VolumeControl } from '../VolumeControl/VolumeControl';
import { LyricsPanel } from '../LyricsPanel/LyricsPanel';
import { VisualizerContainer } from '../Visualizers/VisualizerContainer';
import { extractDominantColor } from '../../../core/utils/colorExtractor';
import { lyricsService } from '../../../core/audio/lyricsService';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import { AudioEngine } from '../../../core/audio/AudioEngine';
import { ImgWithFallback } from '../../common/ImgWithFallback/ImgWithFallback';
import { PlayerOverlayWrapper } from '../PlayerOverlayWrapper/PlayerOverlayWrapper';
import './FullscreenPlayer.css';

// 1. Sleep Timer Status Component
export function SleepTimerStatus({ sleepTimerEnd }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!sleepTimerEnd) return;
    
    const update = () => {
      const remaining = Math.max(0, sleepTimerEnd - Date.now());
      if (remaining === 0) {
        setTimeLeft('');
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`Zzz in ${mins}:${secs.toString().padStart(2, '0')}`);
      }
    };
    
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [sleepTimerEnd]);

  if (!sleepTimerEnd || !timeLeft) return null;

  return (
    <div className="fullscreen-player__sleep-status" style={{
      display: 'inline-flex',
      alignItems: 'center',
      marginTop: 'var(--space-2)',
      background: 'rgba(107, 163, 214, 0.12)',
      border: '1px solid rgba(107, 163, 214, 0.25)',
      padding: '3px 10px',
      borderRadius: 'var(--radius-full)',
      fontSize: 'var(--text-xs)',
      color: 'var(--accent-moon)',
      fontWeight: '600',
      width: 'fit-content'
    }}>
      <span style={{
        display: 'inline-block',
        width: '6px',
        height: '6px',
        background: 'var(--accent-moon)',
        borderRadius: '50%',
        marginRight: '6px',
        boxShadow: '0 0 8px var(--accent-moon)'
      }} />
      {timeLeft}
    </div>
  );
}

// 2. Fullscreen Header
export function FullscreenHeader({ onClose, onOpenOptions }) {
  return (
    <header className="fullscreen-player__header">
      <IconButton 
        icon={CaretDown} 
        size="lg" 
        ariaLabel="Close fullscreen" 
        onClick={onClose} 
      />
      <div className="fullscreen-player__title-bar">
        Now Playing
      </div>
      <IconButton 
        icon={DotsThree} 
        size="lg" 
        ariaLabel="More options" 
        onClick={onOpenOptions}
      />
    </header>
  );
}

// 3. Fullscreen Artwork with double-tap heart & visualizer
export function FullscreenArtwork({
  currentTrack,
  isPlaying,
  showLyrics,
  lyricsData,
  progress,
  seek,
  bgColor,
  visualizerType,
  isVisualizerActive,
  onDoubleTap
}) {
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);

  const handleDoubleTapLocal = () => {
    onDoubleTap();
    setShowHeartAnimation(true);
    setTimeout(() => setShowHeartAnimation(false), 800);
  };

  return (
    <div className="fullscreen-player__art-container">
      {isVisualizerActive && (
        <VisualizerContainer 
          type={visualizerType} 
          isPlaying={isPlaying} 
          baseColor={bgColor} 
        />
      )}

      <AnimatePresence mode="wait">
        {showLyrics ? (
          <m.div 
            key="lyrics"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }}
          >
            <LyricsPanel 
              lyricsData={lyricsData} 
              currentTime={progress} 
              onSeek={seek} 
            />
          </m.div>
        ) : (
          <m.div
            key="art"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', position: 'relative', zIndex: 1 }}
            onDoubleClick={handleDoubleTapLocal}
          >
            <ImgWithFallback 
              src={currentTrack.imageUrl} 
              alt={currentTrack.title} 
              className="fullscreen-player__art"
              style={{ userSelect: 'none' }}
              fallbackSrc="/default-album-art.png"
            />
            <AnimatePresence>
              {showHeartAnimation && (
                <m.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 1 }}
                  exit={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{ position: 'absolute', zIndex: 10, color: 'var(--accent-secondary)' }}
                >
                  <Heart size={120} weight="fill" />
                </m.div>
              )}
            </AnimatePresence>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 4. Fullscreen Now Playing Info
export function FullscreenNowPlaying({
  currentTrack,
  isFavorite,
  showLyrics,
  onToggleLyrics,
  onToggleFavorite,
  sleepTimerEnd
}) {
  return (
    <div className="fullscreen-player__info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 'var(--space-4)' }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <h2 className="fullscreen-player__title">{currentTrack.title}</h2>
        <p className="fullscreen-player__artist">{currentTrack.artistNames?.join(', ')}</p>
        <SleepTimerStatus sleepTimerEnd={sleepTimerEnd} />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
        <IconButton 
          icon={Heart} 
          active={isFavorite}
          size="md"
          ariaLabel={isFavorite ? "Remove from liked songs" : "Add to liked songs"}
          onClick={onToggleFavorite}
          style={{ color: isFavorite ? 'var(--accent-secondary)' : 'var(--text-secondary)' }}
        />
        <IconButton 
          icon={MicrophoneStage} 
          size="md"
          ariaLabel="Toggle Lyrics"
          onClick={onToggleLyrics}
          style={{ color: showLyrics ? 'var(--accent-moon)' : 'var(--text-secondary)' }}
        />
      </div>
    </div>
  );
}

// 5. Fullscreen Controls Section
export function FullscreenControlsSection({
  isPlaying,
  onPlayPause,
  next,
  prev,
  isShuffled,
  onShuffle,
  loopMode,
  toggleLoop,
  progress,
  duration,
  seek,
  volume,
  setVolume,
  isDesktop,
  dominantColor
}) {
  return (
    <div className="fullscreen-player__controls">
      <GradientProgressBar 
        current={progress}
        total={duration}
        onSeek={seek}
        dominantColor={dominantColor}
      />
      
      <div className="fullscreen-player__main-controls">
        <Controls 
          isPlaying={isPlaying}
          onPlayPause={onPlayPause}
          onNext={next}
          onPrev={prev}
          isShuffled={isShuffled}
          onShuffle={onShuffle}
          loopMode={loopMode}
          onLoop={toggleLoop}
        />
      </div>
      
      {isDesktop && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <VolumeControl 
            volume={volume}
            onVolumeChange={setVolume}
          />
        </div>
      )}
    </div>
  );
}

// 6. Fullscreen Playback Options Drawer
export function FullscreenOptionsDrawer({
  isOpen,
  onClose,
  playbackSpeed,
  onUpdateSpeed,
  activeMins,
  onUpdateSleepTimer
}) {
  return (
    <PlayerOverlayWrapper isOpen={isOpen} onClose={onClose}>
      <div className="fullscreen-player__options-drawer glass-panel" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-xl)' }}>
        <div className="options-drawer__header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <div className="options-drawer__drag-handle" style={{ width: '40px', height: '4px', background: 'var(--text-tertiary)', borderRadius: 'var(--radius-full)', marginBottom: 'var(--space-3)' }} />
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>Playback Options</h3>
        </div>
        
        <div className="options-drawer__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="options-group">
            <h4 className="options-group__title" style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: 'var(--space-2)' }}>Playback Speed</h4>
            <div className="options-group__buttons" style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {[0.5, 1.0, 1.25, 1.5, 2.0].map(speed => (
                <button
                  type="button"
                  key={speed}
                  className={`options-button ${playbackSpeed === speed ? 'options-button--active' : ''}`}
                  onClick={() => onUpdateSpeed(speed)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    background: playbackSpeed === speed ? 'var(--accent-moon)' : 'rgba(255,255,255,0.04)',
                    color: playbackSpeed === speed ? 'var(--bg-void)' : 'var(--text-primary)',
                    fontWeight: playbackSpeed === speed ? 600 : 500,
                    cursor: 'pointer'
                  }}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          <div className="options-group">
            <h4 className="options-group__title" style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: 'var(--space-2)' }}>Sleep Timer</h4>
            <div className="options-group__buttons" style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {[0, 15, 30, 45, 60].map(mins => {
                const isActive = (mins === 0 && activeMins === 0) || (mins !== 0 && Math.abs(activeMins - mins) <= 2);
                return (
                  <button
                    type="button"
                    key={mins}
                    className={`options-button ${isActive ? 'options-button--active' : ''}`}
                    onClick={() => onUpdateSleepTimer(mins)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-default)',
                      background: isActive ? 'var(--accent-moon)' : 'rgba(255,255,255,0.04)',
                      color: isActive ? 'var(--bg-void)' : 'var(--text-primary)',
                      fontWeight: isActive ? 600 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {mins === 0 ? 'Off' : `${mins}m`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button 
          type="button"
          className="options-drawer__close-btn"
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            background: 'var(--border-default)',
            color: 'var(--text-primary)',
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: 'var(--space-5)'
          }}
        >
          Close
        </button>
      </div>
    </PlayerOverlayWrapper>
  );
}

// Main FullscreenPlayer Container Component
export function FullscreenPlayer({ onClose }) {
  const { isDesktop } = useBreakpoint();
  const { vibeTuneEnabled, dataSaverEnabled, visualizerType, playbackSpeed, updatePreference } = usePreferenceStore();
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
    sleepTimerEnd,
    shuffleQueue
  } = usePlayerStore();

  const [bgColor, setBgColor] = useState('rgb(26, 30, 37)');
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyricsData, setLyricsData] = useState(null);
  const { toggleLikeTrack, likedSongs } = useLibraryStore();
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [activeMins, setActiveMins] = useState(0);
  
  const lastTapRef = useRef(0);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      await Promise.resolve();
      if (!isMounted) return;
      if (showOptionsMenu && sleepTimerEnd) {
        setActiveMins(Math.round((sleepTimerEnd - Date.now()) / 60000));
      } else {
        setActiveMins(0);
      }
    };
    run();

    let interval;
    if (showOptionsMenu && sleepTimerEnd) {
      interval = setInterval(() => {
        if (isMounted) {
          setActiveMins(Math.round((sleepTimerEnd - Date.now()) / 60000));
        }
      }, 10000);
    }

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
  }, [showOptionsMenu, sleepTimerEnd]);

  useEffect(() => {
    if (currentTrack?.imageUrl) {
      extractDominantColor(currentTrack.imageUrl).then((color) => {
        setBgColor(color);
      });
    }

    const controller = new AbortController();
    
    if (currentTrack) {
      lyricsService.getLyrics(currentTrack, controller.signal)
        .then((data) => {
          setLyricsData(data);
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            console.error('Failed to fetch lyrics in FullscreenPlayer:', err);
            setLyricsData(null);
          }
        });
    }
    
    return () => {
      controller.abort();
    };
  }, [currentTrack]);

  if (!currentTrack) return null;

  const isFavorite = likedSongs ? likedSongs.some((t) => t.id === currentTrack.id) : false;

  const handlePlayPause = () => {
    if (isPlaying) pause();
    else resume();
  };

  const handleShuffle = () => {
    shuffleQueue();
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 1000) return;
    lastTapRef.current = now;

    if (currentTrack) {
      toggleLikeTrack(currentTrack);
    }
  };

  const isVisualizerActive = vibeTuneEnabled && !dataSaverEnabled && !showLyrics;

  return (
    <m.div 
      className="fullscreen-player"
      style={{ background: 'var(--bg-void)' }}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.8 }}
      onDragEnd={(e, { offset, velocity }) => {
        if (offset.y > 150 || velocity.y > 500) {
          onClose();
        }
      }}
    >
      <FullscreenHeader 
        onClose={onClose} 
        onOpenOptions={() => setShowOptionsMenu(true)} 
      />

      <div className="fullscreen-player__content">
        <FullscreenArtwork 
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          showLyrics={showLyrics}
          lyricsData={lyricsData}
          progress={progress}
          seek={seek}
          bgColor={bgColor}
          visualizerType={visualizerType}
          isVisualizerActive={isVisualizerActive}
          onDoubleTap={handleDoubleTap}
        />

        <div className="fullscreen-player__right-panel">
          <FullscreenNowPlaying 
            currentTrack={currentTrack}
            isFavorite={isFavorite}
            showLyrics={showLyrics}
            onToggleLyrics={() => setShowLyrics(!showLyrics)}
            onToggleFavorite={() => toggleLikeTrack(currentTrack)}
            sleepTimerEnd={sleepTimerEnd}
          />

          <FullscreenControlsSection 
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            next={next}
            prev={prev}
            isShuffled={isShuffled}
            onShuffle={handleShuffle}
            loopMode={loopMode}
            toggleLoop={toggleLoop}
            progress={progress}
            duration={currentTrack.duration}
            seek={seek}
            volume={volume}
            setVolume={setVolume}
            isDesktop={isDesktop}
            dominantColor={bgColor}
          />
        </div>
      </div>

      <FullscreenOptionsDrawer 
        isOpen={showOptionsMenu}
        onClose={() => setShowOptionsMenu(false)}
        playbackSpeed={playbackSpeed}
        onUpdateSpeed={(speed) => {
          updatePreference('playbackSpeed', speed);
          AudioEngine.setPlaybackSpeed(speed);
        }}
        activeMins={activeMins}
        onUpdateSleepTimer={(mins) => {
          usePlayerStore.getState().setSleepTimer(mins);
        }}
      />
    </m.div>
  );
}

export default FullscreenPlayer;
