import { useState, useEffect } from 'react';
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
import './FullscreenPlayer.css';

const handleShuffle = () => {
  console.log('Shuffle toggled');
};

export function FullscreenPlayer({ onClose }) {
  const { isDesktop } = useBreakpoint();
  const { vibeTuneEnabled, dataSaverEnabled, visualizerType } = usePreferenceStore();
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
    setVolume
  } = usePlayerStore();

  const [bgColor, setBgColor] = useState('rgb(26, 30, 37)');
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyricsData, setLyricsData] = useState(null);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const { toggleLikeTrack } = useLibraryStore();

  useEffect(() => {
    if (currentTrack?.imageUrl) {
      extractDominantColor(currentTrack.imageUrl).then((color) => {
        setBgColor(color);
      });
    }

    // Fetch lyrics
    let isMounted = true;
    if (currentTrack) {
      lyricsService.getLyrics(currentTrack).then((data) => {
        if (isMounted) {
          setLyricsData(data);
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, [currentTrack]);

  if (!currentTrack) return null;

  const handlePlayPause = () => {
    if (isPlaying) pause();
    else resume();
  };

  const handleDoubleTap = () => {
    if (currentTrack) {
      toggleLikeTrack(currentTrack);
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 800);
    }
  };

  const backgroundStyle = {
    background: `linear-gradient(180deg, ${bgColor} 0%, var(--bg-void) 100%)`
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
          <div className="fullscreen-player__info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ minWidth: 0 }}>
              <h2 className="fullscreen-player__title">{currentTrack.title}</h2>
              <p className="fullscreen-player__artist">{currentTrack.artistNames?.join(', ')}</p>
            </div>
            <IconButton 
              icon={MicrophoneStage} 
              size="md"
              ariaLabel="Toggle Lyrics"
              onClick={() => setShowLyrics(!showLyrics)}
              style={{ color: showLyrics ? 'var(--primary)' : 'var(--text-secondary)' }}
            />
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
    </m.div>
  );
}
