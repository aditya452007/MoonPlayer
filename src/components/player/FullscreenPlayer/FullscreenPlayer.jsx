import { useState, useEffect, useRef, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { CaretDown, DotsThree, MicrophoneStage, Heart, Timer, ArrowsOutSimple, ArrowsInSimple, MagnifyingGlass, X } from '@phosphor-icons/react';
import { usePlayerStore } from '../../../store/playerStore';
import { usePreferenceStore } from '../../../store/preferenceStore';
import { useLibraryStore } from '../../../store/libraryStore';
import { IconButton } from '../../common/IconButton/IconButton';
import { Controls } from '../Controls/Controls';
import { GradientProgressBar } from '../ProgressBar/GradientProgressBar';
import { VolumeControl } from '../VolumeControl/VolumeControl';
import { LyricsPanel } from '../LyricsPanel/LyricsPanel';
import { VisualizerContainer } from '../Visualizers/VisualizerContainer';
import { extractColorPalette } from '../../../core/utils/colorExtractor';
import { lyricsService } from '../../../core/audio/lyricsService';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import { AudioEngine } from '../../../core/audio/AudioEngine';
import { ImgWithFallback } from '../../common/ImgWithFallback/ImgWithFallback';
import { SleepTimerView } from '../../player/SleepTimer/SleepTimerView';
import { TRANSITION } from '../../../core/utils/animation';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { AmbientBackground } from '../../common/AmbientBackground/AmbientBackground';
import { AnimatedLikeButton } from '../../common/AnimatedLikeButton/AnimatedLikeButton';
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
export function FullscreenHeader({ 
  onClose, 
  onOpenOptions,
  isBrowserFullscreen,
  onToggleBrowserFullscreen,
  showLyrics,
  onToggleSearch
}) {
  return (
    <header className="fullscreen-player__header">
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <IconButton 
          icon={CaretDown} 
          size="lg" 
          ariaLabel="Close fullscreen" 
          onClick={onClose} 
        />
        <IconButton 
          icon={isBrowserFullscreen ? ArrowsInSimple : ArrowsOutSimple} 
          size="lg" 
          ariaLabel="Toggle Immersive Mode" 
          onClick={onToggleBrowserFullscreen} 
        />
      </div>
      <div className="fullscreen-player__title-bar">
        Now Playing
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        {showLyrics && (
          <IconButton 
            icon={MagnifyingGlass} 
            size="lg" 
            ariaLabel="Search lyrics" 
            onClick={onToggleSearch} 
          />
        )}
        <IconButton 
          icon={DotsThree} 
          size="lg" 
          ariaLabel="More options" 
          onClick={onOpenOptions}
        />
      </div>
    </header>
  );
}

// 2b. Lyrics Search Overlay Component
export function LyricsSearchOverlay({ track, onClose, onSelectLyrics }) {
  const [query, setQuery] = useState(`${track.title} ${track.artistNames?.[0] || ''}`);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const { MusicService } = await import('../../../core/api/MusicService');
      const songs = await MusicService.searchSongs(query, 1, 10);
      setResults(songs);
    } catch (err) {
      console.error('Failed to search lyrics candidates:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = async (selectedTrack) => {
    setSearching(true);
    try {
      const data = await lyricsService.getLyrics(selectedTrack);
      onSelectLyrics(data);
      onClose();
    } catch (err) {
      console.error('Failed to load selected lyrics:', err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="lyrics-search-overlay">
      <div className="lyrics-search-header">
        <h3>Search Lyrics</h3>
        <IconButton icon={X} size="sm" onClick={onClose} ariaLabel="Close search" style={{ padding: 4 }} />
      </div>
      <div className="lyrics-search-input-wrap">
        <input 
          type="text" 
          className="lyrics-search-input" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="Song title and artist..."
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button type="button" className="lyrics-search-btn" onClick={handleSearch} disabled={searching}>
          {searching ? '...' : 'Search'}
        </button>
      </div>
      <div className="lyrics-search-results">
        {results.map((song) => (
          <button 
            type="button" 
            key={song.id} 
            className="lyrics-search-item" 
            onClick={() => handleSelect(song)}
          >
            <img src={song.imageUrl} alt="" className="lyrics-search-item__art" />
            <div className="lyrics-search-item__info">
              <p className="lyrics-search-item__title">{song.title}</p>
              <p className="lyrics-search-item__artists">{song.artistNames?.join(', ')}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// 2c. Lyrics Sync Bar Component
export function LyricsSyncBar({ lyricOffset, onChangeOffset }) {
  return (
    <div className="lyrics-sync-bar">
      <button 
        type="button" 
        className="lyrics-sync-bar__btn" 
        onClick={() => onChangeOffset(lyricOffset - 500)}
        title="Delay lyrics by 500ms"
      >
        -500ms
      </button>
      <button 
        type="button" 
        className="lyrics-sync-bar__btn" 
        onClick={() => onChangeOffset(lyricOffset - 100)}
        title="Delay lyrics by 100ms"
      >
        -100ms
      </button>
      <span className="lyrics-sync-bar__value">
        {lyricOffset > 0 ? `+${lyricOffset}` : lyricOffset}ms
      </span>
      <button 
        type="button" 
        className="lyrics-sync-bar__btn" 
        onClick={() => onChangeOffset(lyricOffset + 100)}
        title="Speed up lyrics by 100ms"
      >
        +100ms
      </button>
      <button 
        type="button" 
        className="lyrics-sync-bar__btn" 
        onClick={() => onChangeOffset(lyricOffset + 500)}
        title="Speed up lyrics by 500ms"
      >
        +500ms
      </button>
      {lyricOffset !== 0 && (
        <button 
          type="button" 
          className="lyrics-sync-bar__btn" 
          style={{ color: 'var(--accent-secondary)' }}
          onClick={() => onChangeOffset(0)}
        >
          Reset
        </button>
      )}
    </div>
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
  onDoubleTap,
  lyricOffset,
  showSearch,
  onCloseSearch,
  onSelectLyrics
}) {
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);

  const handleDoubleTapLocal = () => {
    onDoubleTap();
    setShowHeartAnimation(true);
    setTimeout(() => setShowHeartAnimation(false), 800);
  };

  const glowColor = bgColor.replace('rgb(', '').replace(')', '');

  return (
    <div 
      className="fullscreen-player__art-container"
      style={{ boxShadow: `0 0 30px rgba(${glowColor}, 0.15), 0 8px 32px rgba(0, 0, 0, 0.5)`, position: 'relative' }}
    >
      {isVisualizerActive && (
        <VisualizerContainer 
          type={visualizerType} 
          isPlaying={isPlaying} 
          baseColor={bgColor} 
        />
      )}

      {showSearch && (
        <LyricsSearchOverlay 
          track={currentTrack}
          onClose={onCloseSearch}
          onSelectLyrics={onSelectLyrics}
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
              lyricOffset={lyricOffset}
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
        <AnimatedLikeButton
          isLiked={isFavorite}
          onToggle={onToggleFavorite}
          size="md"
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
}) {
  const [showTimer, setShowTimer] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 400,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <m.div
            className="fullscreen-player__options-backdrop"
            initial={prefersReducedMotion ? {} : { opacity: 0 }}
            animate={prefersReducedMotion ? {} : { opacity: 1 }}
            exit={prefersReducedMotion ? {} : { opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
            }}
          />
          <m.div
            className="fullscreen-player__options-drawer glass-panel"
            initial={prefersReducedMotion ? {} : { y: '100%', opacity: 0 }}
            animate={prefersReducedMotion ? {} : { y: 0, opacity: 1 }}
            exit={prefersReducedMotion ? {} : { y: '100%', opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : {
              y: { type: 'spring', damping: 25, stiffness: 220 },
              opacity: { duration: 0.2, ease: [0, 0, 0.2, 1] },
            }}
            style={{
              width: '100%',
              maxWidth: '500px',
              padding: 'var(--space-5)',
              borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--shadow-xl)',
              position: 'relative',
              zIndex: 2,
            }}
          >
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
                {showTimer ? (
                  <SleepTimerView onClose={() => { setShowTimer(false); onClose(); }} />
                ) : (
                  <button
                    type="button"
                    className="options-button"
                    onClick={() => setShowTimer(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                      padding: '10px 18px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-default)',
                      background: 'rgba(255,255,255,0.04)',
                      color: 'var(--text-primary)',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    <Timer size={18} />
                    Set Sleep Timer
                  </button>
                )}
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
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Main FullscreenPlayer Container Component
export function FullscreenPlayer({ onClose }) {
  const { isDesktop } = useBreakpoint();
  const prefersReducedMotion = useReducedMotion();
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

  const [palette, setPalette] = useState(['rgb(26, 30, 37)']);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyricsData, setLyricsData] = useState(null);
  const { toggleLikeTrack, likedSongs } = useLibraryStore();
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  
  const [lyricOffset, setLyricOffset] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const lastTapRef = useRef(0);
  const hideTimerRef = useRef(null);

  const [prevTrackId, setPrevTrackId] = useState(currentTrack?.id);
  if (currentTrack?.id !== prevTrackId) {
    setPrevTrackId(currentTrack?.id);
    setLyricOffset(0);
    setShowSearch(false);
  }

  const [bgColor, setBgColor] = useState('rgb(26, 30, 37)');

  const resetHideTimer = useCallback(() => {
    Promise.resolve().then(() => {
      setControlsVisible(true);
    });
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (showLyrics) {
      hideTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 4000);
    }
  }, [showLyrics]);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [showLyrics, resetHideTimer]);

  const handleInteraction = () => {
    resetHideTimer();
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsBrowserFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, []);

  const handleToggleBrowserFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  };

  /* Removed activeMins update and reset effect */

  useEffect(() => {
    const controller = new AbortController();
    
    if (currentTrack?.imageUrl) {
      extractColorPalette(currentTrack.imageUrl, controller.signal, 2).then((colors) => {
        setPalette(colors);
        setBgColor(colors[0]);
      });
    } else {
      Promise.resolve().then(() => {
        setPalette(['rgb(26, 30, 37)']);
        setBgColor('rgb(26, 30, 37)');
      });
    }

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
      className={`fullscreen-player${!controlsVisible ? ' fullscreen-player--hide-controls' : ''}`}
      initial={prefersReducedMotion ? {} : { y: '100%', opacity: 0 }}
      animate={prefersReducedMotion ? {} : { y: 0, opacity: 1 }}
      exit={prefersReducedMotion ? {} : { y: '100%', opacity: 0 }}
      transition={prefersReducedMotion ? { duration: 0 } : {
        y: TRANSITION.overlaySlide,
        opacity: TRANSITION.overlayFade,
      }}
      drag={prefersReducedMotion ? false : "y"}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.8 }}
      onDragEnd={(e, { offset, velocity }) => {
        if (offset.y > 150 || velocity.y > 500) {
          onClose();
        }
      }}
      onMouseMove={handleInteraction}
      onTouchStart={handleInteraction}
      onClick={handleInteraction}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <AmbientBackground colors={palette} duration={0.5} />
      <FullscreenHeader 
        onClose={onClose} 
        onOpenOptions={() => setShowOptionsMenu(true)} 
        isBrowserFullscreen={isBrowserFullscreen}
        onToggleBrowserFullscreen={handleToggleBrowserFullscreen}
        showLyrics={showLyrics}
        onToggleSearch={() => setShowSearch(prev => !prev)}
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
          lyricOffset={lyricOffset}
          showSearch={showSearch}
          onCloseSearch={() => setShowSearch(false)}
          onSelectLyrics={(data) => setLyricsData(data)}
        />

        <div className="fullscreen-player__right-panel">
          {showLyrics && controlsVisible && (
            <LyricsSyncBar 
              lyricOffset={lyricOffset}
              onChangeOffset={(val) => setLyricOffset(val)}
            />
          )}

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
      />

    </m.div>
  );
}

export default FullscreenPlayer;
