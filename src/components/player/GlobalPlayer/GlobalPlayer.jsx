import { useState } from 'react';
import { m } from 'framer-motion';
import { usePlayerStore } from '../../../store/playerStore';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import { GlassPanel } from '../../common/GlassPanel/GlassPanel';
import { BottomPlaybar } from '../BottomPlaybar/BottomPlaybar';
import { MiniPlayer } from '../MiniPlayer/MiniPlayer';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import './GlobalPlayer.css';

export function GlobalPlayer() {
  const { currentTrack } = usePlayerStore();
  const { isMobile } = useBreakpoint();
  const prefersReducedMotion = useReducedMotion();
  const [hasBeenShown, setHasBeenShown] = useState(!!currentTrack);

  if (currentTrack && !hasBeenShown) {
    setHasBeenShown(true);
  }

  if (!hasBeenShown) {
    return null;
  }

  return (
    <GlassPanel 
      className={`global-player ${isMobile ? 'global-player--mobile' : 'global-player--desktop'}`} 
      variant="miniplayer"
      style={{
        pointerEvents: currentTrack ? 'auto' : 'none',
      }}
    >
      <m.div
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ 
          opacity: currentTrack ? 1 : 0, 
          y: prefersReducedMotion ? 0 : (currentTrack ? 0 : 20) 
        }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.35, ease: [0, 0, 0.2, 1] }}
      >
        {isMobile ? (
          <MiniPlayer />
        ) : (
          <BottomPlaybar />
        )}
      </m.div>
    </GlassPanel>
  );
}

export default GlobalPlayer;
