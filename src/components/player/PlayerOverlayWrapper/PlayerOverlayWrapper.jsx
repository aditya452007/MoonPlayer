import { useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { FullscreenPlayer } from '../FullscreenPlayer/FullscreenPlayer';
import { usePlayerStore } from '../../../store/playerStore';

export function PlayerOverlayWrapper() {
  const { isFullscreen, setFullscreen } = usePlayerStore();
  const [hasBeenShown, setHasBeenShown] = useState(false);

  if (isFullscreen && !hasBeenShown) {
    setHasBeenShown(true);
  }

  return (
    <AnimatePresence>
      {(isFullscreen || hasBeenShown) && (
        <m.div
          key="player-overlay"
          initial={{ y: '100%' }}
          animate={{ y: isFullscreen ? 0 : '100%' }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            pointerEvents: isFullscreen ? 'auto' : 'none',
          }}
        >
          <FullscreenPlayer onClose={() => setFullscreen(false)} />
        </m.div>
      )}
    </AnimatePresence>
  );
}
