import { useState, useRef } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { FullscreenPlayer } from '../FullscreenPlayer/FullscreenPlayer';
import { usePlayerStore } from '../../../store/playerStore';

export function PlayerOverlayWrapper({ children }) {
  const { isFullscreen, setFullscreen } = usePlayerStore();
  const [hasBeenShown, setHasBeenShown] = useState(false);
  const containerRef = useRef(null);

  if (isFullscreen && !hasBeenShown) {
    setHasBeenShown(true);
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {children}
      <AnimatePresence>
        {(isFullscreen || hasBeenShown) && (
          <m.div
            key="player-overlay"
            initial={{ y: '100%' }}
            animate={{ y: isFullscreen ? 0 : '100%' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 100,
              pointerEvents: isFullscreen ? 'auto' : 'none',
            }}
          >
            <FullscreenPlayer onClose={() => setFullscreen(false)} />
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
