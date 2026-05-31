import { AnimatePresence, m } from 'framer-motion';

export function PlayerOverlayWrapper({ isOpen, onClose, children, minDragDistance = 100 }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <m.div
            className="player-overlay-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 499
            }}
          />
          {/* Slide up container */}
          <m.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.8 }}
            onDragEnd={(_, { offset, velocity }) => {
              if (offset.y > minDragDistance || velocity.y > 500) {
                onClose();
              }
            }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 500,
              touchAction: 'none'
            }}
          >
            {children}
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default PlayerOverlayWrapper;
