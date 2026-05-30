import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../../../store/playerStore';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import { GlassPanel } from '../../common/GlassPanel/GlassPanel';
import { BottomPlaybar } from '../BottomPlaybar/BottomPlaybar';
import { MiniPlayer } from '../MiniPlayer/MiniPlayer';
import { FullscreenPlayer } from '../FullscreenPlayer/FullscreenPlayer';
import './GlobalPlayer.css';

export function GlobalPlayer() {
  const { currentTrack } = usePlayerStore();
  const { isMobile } = useBreakpoint();
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!currentTrack) {
    return null; // Don't render until a track is selected
  }

  const handleExpand = () => setIsFullscreen(true);
  const handleClose = () => setIsFullscreen(false);

  return (
    <>
      <GlassPanel 
        className={`global-player ${isMobile ? 'global-player--mobile' : 'global-player--desktop'}`} 
        blur="heavy"
      >
        {isMobile ? (
          <MiniPlayer onExpand={handleExpand} />
        ) : (
          <BottomPlaybar onExpand={handleExpand} />
        )}
      </GlassPanel>

      <AnimatePresence>
        {isFullscreen && (
          <FullscreenPlayer onClose={handleClose} />
        )}
      </AnimatePresence>
    </>
  );
}
