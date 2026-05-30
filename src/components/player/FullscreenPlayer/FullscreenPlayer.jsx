import { useState, useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { CaretDown, DotsThree, MicrophoneStage, Heart } from '@phosphor-icons/react';
import { usePlayerStore } from '../../../store/playerStore';
import { usePreferenceStore } from '../../../store/preferenceStore';
import { useLibraryStore } from '../../../store/libraryStore';
import { IconButton } from '../../common/IconButton/IconButton';
import { Controls } from '../Controls/Controls';
import { ProgressBar } from '../ProgressBar/ProgressBar';
import { VolumeControl } from '../VolumeControl/VolumeControl';
import { LyricsPanel } from '../LyricsPanel/LyricsPanel';
import { VisualizerContainer } from '../Visualizers/VisualizerContainer';
import { extractDominantColor } from '../../../core/utils/colorExtractor';
import { lyricsService } from '../../../core/audio/lyricsService';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import { AudioEngine } from '../../../core/audio/AudioEngine';
import './FullscreenPlayer.css';

function SleepTimerStatus({ sleepTimerEnd }) {
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
    <div style={{
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
    shuffleQueue // Destructure here to resolve Broken UI Shuffle (Issue #13)
  } = usePlayerStore();

  const [bgColor, setBgColor] = useState('rgb(26, 30, 37)');
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyricsData, setLyricsData] = useState(null);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const { toggleLikeTrack, likedSongs } = useLibraryStore();
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [activeMins, setActiveMins] = useState(0);
  
  const lastTapRef = useRef(0);

  useEffect(() => {
    if (showOptionsMenu && sleepTimerEnd) {
      const updateTime = () => {
        setActiveMins(Math.round((sleepTimerEnd - Date.now()) / 60000));
      };
      updateTime();
      const interval = setInterval(updateTime, 10000);
      return () => clearInterval(interval);
    } else {
      setActiveMins(0);
    }
  }, [showOptionsMenu, sleepTimerEnd]);

  useEffect(() => {
    if (currentTrack?.imageUrl) {
      extractDominantColor(currentTrack.imageUrl).then((color) => {
        setBgColor(color);
      });
    }

    // Fetch lyrics with robust catch boundary & abort signal support (Issue #14)
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
    // Add double-tap throttle guard (Issue #20)
    if (now - lastTapRef.current < 1000) return;
    lastTapRef.current = now;

    if (currentTrack) {
      toggleLikeTrack(currentTrack);
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 800);
    }
  };

  // Safe image loading fallback error boundary (Issue #34)
  const handleImageError = (e) => {
    e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 80 80"><rect width="80" height="80" fill="%231E293B"/><path d="M40 25a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm-12 18h24v4a2 2 0 0 1-2 2H30a2 2 0 0 1-2-2v-4z" fill="%2364748B"/></svg>';
  };

  const backgroundStyle = {
    background: 'var(--bg-void)'
  };

  const isVisualizerActive = vibeTuneEnabled && !dataSaverEnabled && !showLyrics;

  return (
    <m.div 
      className="fullscreen-player"
      style={backgroundStyle}
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
          onClick={() => setShowOptionsMenu(true)}
        />
      </header>
      


      <div className="fullscreen-player__content">
        <div className="fullscreen-player__art-container">
          {/* Render visualizer behind the art/lyrics if active */}
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
                onDoubleClick={handleDoubleTap}
              >
                <img 
                  src={currentTrack.imageUrl || '/default-album-art.png'} 
                  alt={currentTrack.title} 
                  className="fullscreen-player__art"
                  style={{ userSelect: 'none' }}
                  onError={handleImageError}
                />
                <AnimatePresence>
                  {showHeartAnimation && (
                    <m.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1.5, opacity: 1 }}
                      exit={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      style={{ position: 'absolute', zIndex: 10, color: 'var(--accent-glow)' }}
                    >
                      <Heart size={120} weight="fill" />
                    </m.div>
                  )}
                </AnimatePresence>
              </m.div>
            )}
          </AnimatePresence>
        </div>

        <div className="fullscreen-player__right-panel">
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
                onClick={() => toggleLikeTrack(currentTrack)}
                style={{ color: isFavorite ? 'var(--accent-moon)' : 'var(--text-secondary)' }}
              />
              <IconButton 
                icon={MicrophoneStage} 
                size="md"
                ariaLabel="Toggle Lyrics"
                onClick={() => setShowLyrics(!showLyrics)}
                style={{ color: showLyrics ? 'var(--accent-moon)' : 'var(--text-secondary)' }}
              />
            </div>
          </div>

          <div className="fullscreen-player__controls">
            <ProgressBar 
              current={progress}
              total={currentTrack.duration}
              onSeek={seek}
            />
            
            <div className="fullscreen-player__main-controls">
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
        </div>
      </div>

      <AnimatePresence>
        {showOptionsMenu && (
          <>
            <m.div 
              className="fullscreen-player__options-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOptionsMenu(false)}
            />
            <m.div 
              className="fullscreen-player__options-drawer"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            >
              <div className="options-drawer__header">
                <div className="options-drawer__drag-handle" />
                <h3>Playback Options</h3>
              </div>
              
              <div className="options-drawer__body">
                <div className="options-group">
                  <h4 className="options-group__title">Playback Speed</h4>
                  <div className="options-group__buttons">
                    {[0.5, 1.0, 1.25, 1.5, 2.0].map(speed => (
                      <button
                        key={speed}
                        className={`options-button ${playbackSpeed === speed ? 'options-button--active' : ''}`}
                        onClick={() => {
                          updatePreference('playbackSpeed', speed);
                          AudioEngine.setPlaybackSpeed(speed);
                        }}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="options-group">
                  <h4 className="options-group__title">Sleep Timer</h4>
                  <div className="options-group__buttons">
                    {[0, 15, 30, 45, 60].map(mins => {
                      const isActive = (mins === 0 && !sleepTimerEnd) || (mins !== 0 && sleepTimerEnd && Math.abs(activeMins - mins) <= 2);
                      return (
                        <button
                          key={mins}
                          className={`options-button ${isActive ? 'options-button--active' : ''}`}
                          onClick={() => {
                            usePlayerStore.getState().setSleepTimer(mins);
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
                className="options-drawer__close-btn"
                onClick={() => setShowOptionsMenu(false)}
              >
                Close
              </button>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </m.div>
  );
}
