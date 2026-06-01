import { AnimatePresence, m } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { X } from '@phosphor-icons/react';
import { IconButton } from '../IconButton/IconButton';
import { TRANSITION } from '../../../core/utils/animation';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import './ShortcutOverlay.css';

const shortcuts = [
  { key: 'Space', action: 'Play/Pause' },
  { key: '→', action: 'Skip forward 10s' },
  { key: '←', action: 'Skip backward 10s' },
  { key: '↑', action: 'Volume up' },
  { key: '↓', action: 'Volume down' },
  { key: 'M', action: 'Mute toggle' },
  { key: 'F', action: 'Toggle fullscreen player' },
  { key: 'L', action: 'Toggle lyrics panel' },
  { key: 'R', action: 'Cycle repeat mode' },
  { key: 'Ctrl+L', action: 'Focus search / Go to Library' },
  { key: 'Ctrl+N', action: 'Create new playlist' },
  { key: 'Ctrl+S', action: 'Save/like current song' },
  { key: '1-9', action: 'Jump to percentage' },
  { key: '+/-', action: 'Volume up/down (alternative)' },
  { key: 'Q', action: 'Toggle queue panel' },
  { key: 'P', action: 'Toggle pet visibility' },
  { key: 'S', action: 'Toggle shuffle' },
  { key: 'N', action: 'Next track' },
  { key: 'Shift+N', action: 'Previous track' },
];

/**
 * ShortcutOverlay Component
 * Accessible dialog display displaying all available keyboard controls.
 * Uses robust BEM styling conventions and keyboard focus trapping.
 */
export function ShortcutOverlay({ isOpen, onClose }) {
  const modalRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  // Focus trapping and keyboard accessibility (ShortcutOverlay focus-trap)
  useEffect(() => {
    if (!isOpen) return;

    // Dismiss on Escape
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Trap focus inside modal
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
    
    // Focus the first element (close button) on open
    const timer = setTimeout(() => {
      const closeBtn = modalRef.current?.querySelector('.icon-button');
      closeBtn?.focus();
    }, 100);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keydown', handleTab);
      clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="shortcut-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcut-title"
          ref={modalRef}
        >
          <m.div 
            className="shortcut-overlay__backdrop"
            initial={prefersReducedMotion ? {} : { opacity: 0 }}
            animate={prefersReducedMotion ? {} : { opacity: 1 }}
            exit={prefersReducedMotion ? {} : { opacity: 0 }}
            onClick={onClose}
          />
          <m.div 
            className="shortcut-overlay__modal glass-panel"
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20, scale: 0.95 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? {} : { opacity: 0, y: 20, scale: 0.95 }}
            transition={prefersReducedMotion ? { duration: 0 } : TRANSITION.overlaySlide}
          >
            <div className="shortcut-overlay__header">
              <h2 id="shortcut-title" className="shortcut-overlay__title">Keyboard Shortcuts</h2>
              <IconButton icon={X} ariaLabel="Close shortcuts" onClick={onClose} />
            </div>
            <div className="shortcut-overlay__content">
              <div className="shortcut-overlay__grid">
                {shortcuts.map((shortcut) => (
                  <div key={shortcut.key} className="shortcut-overlay__item">
                    <kbd className="shortcut-overlay__key">{shortcut.key}</kbd>
                    <span className="shortcut-overlay__action">{shortcut.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
export default ShortcutOverlay;
