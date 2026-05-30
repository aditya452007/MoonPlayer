import { AnimatePresence, m } from 'framer-motion';
import { useEffect, useRef, useCallback } from 'react';
import { usePreferenceStore } from '../../../store/preferenceStore';
import { Button } from '../Button/Button';
import { CaretUp, CaretDown, CaretLeft, CaretRight, CursorClick } from '@phosphor-icons/react';
import './GestureGuideOverlay.css';

/**
 * GestureGuideOverlay Component
 * Displays an educational overlay tutorial for mobile gestures.
 * Uses robust focus trapping, keyboard closures, and proper BEM stylesheets.
 */
export function GestureGuideOverlay() {
  const { hasSeenGestureGuide, updatePreference } = usePreferenceStore();
  const modalRef = useRef(null);

  const handleDismiss = useCallback(() => {
    updatePreference('hasSeenGestureGuide', true);
  }, [updatePreference]);

  // Keyboard accessibility and focus trapping
  useEffect(() => {
    if (hasSeenGestureGuide) return;

    // Dismiss guide on Escape key
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Trap focus inside the overlay dialog
    const handleTab = (e) => {
      if (e.key !== 'Tab') return;
      
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (!focusableElements || focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleTab);

    // Initial focus on the dismiss button
    const timer = setTimeout(() => {
      const dismissBtn = modalRef.current?.querySelector('.gesture-guide__dismiss-btn');
      dismissBtn?.focus();
    }, 100);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keydown', handleTab);
      clearTimeout(timer);
    };
  }, [hasSeenGestureGuide, handleDismiss]);

  if (hasSeenGestureGuide) return null;

  return (
    <AnimatePresence>
      <div 
        className="gesture-guide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gesture-title"
        ref={modalRef}
      >
        <m.div 
          className="gesture-guide__backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleDismiss}
        />
        <m.div 
          className="gesture-guide__modal glass-panel"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <div className="gesture-guide__content">
            <h2 id="gesture-title" className="gesture-guide__title">Welcome to MoonPlayer</h2>
            <p className="gesture-guide__desc">Master these gestures to navigate like a pro.</p>
            
            <div className="gesture-guide__list">
              <div className="gesture-guide__item">
                <div className="gesture-guide__icon"><CaretUp size={32} /></div>
                <div className="gesture-guide__text">
                  <strong className="gesture-guide__label">Swipe Up</strong>
                  <span className="gesture-guide__detail">Mini-player to expand to fullscreen</span>
                </div>
              </div>
              <div className="gesture-guide__item">
                <div className="gesture-guide__icon"><CaretDown size={32} /></div>
                <div className="gesture-guide__text">
                  <strong className="gesture-guide__label">Swipe Down</strong>
                  <span className="gesture-guide__detail">Fullscreen player to collapse</span>
                </div>
              </div>
              <div className="gesture-guide__item">
                <div className="gesture-guide__icon"><CaretLeft size={32} /> / <CaretRight size={32} /></div>
                <div className="gesture-guide__text">
                  <strong className="gesture-guide__label">Swipe Left/Right</strong>
                  <span className="gesture-guide__detail">Mini-player to skip tracks</span>
                </div>
              </div>
              <div className="gesture-guide__item">
                <div className="gesture-guide__icon"><CursorClick size={32} /></div>
                <div className="gesture-guide__text">
                  <strong className="gesture-guide__label">Double Tap</strong>
                  <span className="gesture-guide__detail">Album art to like a song</span>
                </div>
              </div>
              <div className="gesture-guide__item">
                <div className="gesture-guide__icon"><CaretRight size={32} /></div>
                <div className="gesture-guide__text">
                  <strong className="gesture-guide__label">Swipe Right</strong>
                  <span className="gesture-guide__detail">On a track in a list for quick actions</span>
                </div>
              </div>
            </div>

            <Button variant="primary" onClick={handleDismiss} className="gesture-guide__dismiss-btn">
              Got it, let's go!
            </Button>
          </div>
        </m.div>
      </div>
    </AnimatePresence>
  );
}
export default GestureGuideOverlay;
