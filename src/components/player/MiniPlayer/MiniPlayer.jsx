import { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, Sparkle } from '@phosphor-icons/react';
import { usePlayerStore } from '../../../store/playerStore';
import { IconButton } from '../../common/IconButton/IconButton';
import { AnimatePresence, m } from 'framer-motion';
import { ImgWithFallback } from '../../common/ImgWithFallback/ImgWithFallback';
import { extractDominantColor } from '../../../core/utils/colorExtractor';
import { NowPlayingBars } from '../../common/NowPlayingBars/NowPlayingBars';
import { useHaptics } from '../../../hooks/useHaptics';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import './MiniPlayer.css';

export function MiniPlayer() {
  const { currentTrack, isPlaying, pause, resume, next, prev, queue, queueIndex, setFullscreen } = usePlayerStore();
  const [miniGlow, setMiniGlow] = useState(null);
  const { light } = useHaptics();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (currentTrack?.imageUrl) {
      const controller = new AbortController();
      extractDominantColor(currentTrack.imageUrl, controller.signal).then((color) => {
        setMiniGlow(color);
      });
      return () => controller.abort();
    }
  }, [currentTrack]);

  if (!currentTrack) return null;

  const handlePlayPause = (e) => {
    e.stopPropagation();
    if (isPlaying) pause();
    else resume();
  };

  const handleNext = (e) => {
    e.stopPropagation();
    next();
  };

  const nextTrack = queue[queueIndex + 1];

  const handleDragEnd = (event, info) => {
    const { offset, velocity } = info;
    if (offset.y < -50) {
      setFullscreen(true);
    } else if (offset.x < -50 || velocity.x < -600) {
      light();
      next();
    } else if (offset.x > 50 || velocity.x > 600) {
      light();
      prev();
    }
  };

  return (
    <div className="mini-player-wrapper">
      <AnimatePresence>
        {!isPlaying && nextTrack && (
          <m.div 
            className="mini-player__suggestion-chip"
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? {} : { opacity: 0, y: 5 }}
            onClick={handleNext}
          >
            <Sparkle className="mini-player__sparkle" weight="fill" />
            <span>Next up: {nextTrack.title}</span>
          </m.div>
        )}
      </AnimatePresence>

      <m.div 
        className="mini-player"
        onClick={() => setFullscreen(true)}
        role="button"
        tabIndex={0}
        aria-label="Expand player"
        drag={prefersReducedMotion ? false : true}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        whileDrag={prefersReducedMotion ? {} : {
          scale: 0.95,
          opacity: 0.8,
          transition: { duration: 0.15 },
        }}
        animate={{
          boxShadow: (miniGlow && !prefersReducedMotion)
            ? `0 0 16px ${miniGlow.replace('rgb', 'rgba').replace(')', ', 0.25)')}`
            : 'none',
        }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, ease: [0, 0, 0.2, 1] }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setFullscreen(true);
          }
        }}
      >
        <div className="mini-player__info">
          <div style={{ position: 'relative', borderRadius: 'var(--radius-sm)' }}>
            <ImgWithFallback 
              src={currentTrack.imageUrl} 
              alt={currentTrack.title} 
              className="mini-player__art"
              fallbackSrc="/default-album-art.png"
            />
            {isPlaying && (
              <div style={{ position: 'absolute', bottom: 4, right: 4, zIndex: 2 }}>
                <NowPlayingBars isPlaying={isPlaying} barCount={4} />
              </div>
            )}
          </div>
          <div className="mini-player__meta">
            <h4 className="mini-player__title">{currentTrack.title}</h4>
            <p className="mini-player__artist">{currentTrack.artistNames?.join(', ')}</p>
          </div>
        </div>

        <div className="mini-player__controls">
          <IconButton 
            icon={isPlaying ? Pause : Play} 
            size="md"
            className="mini-player__btn"
            ariaLabel={isPlaying ? "Pause" : "Play"}
            onClick={handlePlayPause}
          />
          <IconButton 
            icon={SkipForward} 
            size="md"
            className="mini-player__btn"
            ariaLabel="Next"
            onClick={handleNext}
          />
        </div>
      </m.div>
    </div>
  );
}

export default MiniPlayer;
