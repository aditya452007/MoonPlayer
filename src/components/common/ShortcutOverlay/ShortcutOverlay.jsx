import { AnimatePresence, m } from 'framer-motion';
import { X } from '@phosphor-icons/react';
import { IconButton } from '../IconButton/IconButton';
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

export function ShortcutOverlay({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="shortcut-overlay-wrapper">
          <m.div 
            className="shortcut-overlay-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <m.div 
            className="shortcut-overlay-modal glass-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="shortcut-overlay-header">
              <h2>Keyboard Shortcuts</h2>
              <IconButton icon={X} ariaLabel="Close shortcuts" onClick={onClose} />
            </div>
            <div className="shortcut-overlay-content">
              <div className="shortcut-grid">
                {shortcuts.map((shortcut, idx) => (
                  <div key={idx} className="shortcut-item">
                    <kbd className="shortcut-key">{shortcut.key}</kbd>
                    <span className="shortcut-action">{shortcut.action}</span>
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
