import { AnimatePresence, m } from 'framer-motion';
import { usePreferenceStore } from '../../../store/preferenceStore';
import { Button } from '../Button/Button';
import { CaretUp, CaretDown, CaretLeft, CaretRight, CursorClick } from '@phosphor-icons/react';
import './GestureGuideOverlay.css';

export function GestureGuideOverlay() {
  const { hasSeenGestureGuide, updatePreference } = usePreferenceStore();

  if (hasSeenGestureGuide) return null;

  const handleDismiss = () => {
    updatePreference('hasSeenGestureGuide', true);
  };

  return (
    <AnimatePresence>
      <div className="gesture-guide-wrapper">
        <m.div 
          className="gesture-guide-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
        <m.div 
          className="gesture-guide-modal glass-panel"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <div className="gesture-guide-content">
            <h2>Welcome to MoonPlayer</h2>
            <p>Master these gestures to navigate like a pro.</p>
            
            <div className="gesture-list">
              <div className="gesture-item">
                <div className="gesture-icon"><CaretUp size={32} /></div>
                <div className="gesture-text">
                  <strong>Swipe Up</strong>
                  <span>Mini-player to expand to fullscreen</span>
                </div>
              </div>
              <div className="gesture-item">
                <div className="gesture-icon"><CaretDown size={32} /></div>
                <div className="gesture-text">
                  <strong>Swipe Down</strong>
                  <span>Fullscreen player to collapse</span>
                </div>
              </div>
              <div className="gesture-item">
                <div className="gesture-icon"><CaretLeft size={32} /> / <CaretRight size={32} /></div>
                <div className="gesture-text">
                  <strong>Swipe Left/Right</strong>
                  <span>Mini-player to skip tracks</span>
                </div>
              </div>
              <div className="gesture-item">
                <div className="gesture-icon"><CursorClick size={32} /></div>
                <div className="gesture-text">
                  <strong>Double Tap</strong>
                  <span>Album art to like a song</span>
                </div>
              </div>
              <div className="gesture-item">
                <div className="gesture-icon"><CaretRight size={32} /></div>
                <div className="gesture-text">
                  <strong>Swipe Right</strong>
                  <span>On a track in a list for quick actions</span>
                </div>
              </div>
            </div>

            <Button variant="primary" onClick={handleDismiss} className="gesture-dismiss-btn">
              Got it, let's go!
            </Button>
          </div>
        </m.div>
      </div>
    </AnimatePresence>
  );
}
