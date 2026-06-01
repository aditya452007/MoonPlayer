import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { m, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import './ContextMenu.css';

export { ContextMenuItem, ContextMenuDivider } from './ContextMenuItems';

export function ContextMenu({ isOpen, onClose, x, y, children }) {
  const menuRef = useRef(null);
  const [adjustedX, setAdjustedX] = useState(x);
  const [adjustedY, setAdjustedY] = useState(y);
  const prefersReducedMotion = useReducedMotion();

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const recalc = () => {
      if (menuRef.current) {
        const rect = menuRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (x + rect.width > viewportWidth) {
          setAdjustedX(viewportWidth - rect.width - 16);
        } else {
          setAdjustedX(x);
        }

        if (y + rect.height > viewportHeight) {
          setAdjustedY(viewportHeight - rect.height - 16);
        } else {
          setAdjustedY(y);
        }
      }
    };

    recalc();

    window.addEventListener('resize', recalc, { passive: true });
    return () => {
      window.removeEventListener('resize', recalc);
    };
  }, [isOpen, x, y]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onCloseRef.current();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside, true);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isOpen]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <m.div
            className="context-menu__backdrop"
            initial={prefersReducedMotion ? {} : { opacity: 0 }}
            animate={prefersReducedMotion ? {} : { opacity: 1 }}
            exit={prefersReducedMotion ? {} : { opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.15 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
          />
          <m.div
            className="context-menu"
            style={{
              position: 'fixed',
              top: adjustedY,
              left: adjustedX,
              zIndex: 1000,
            }}
            ref={menuRef}
            initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
            exit={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.15, ease: [0.25, 1, 0.5, 1] }}
          >
            {children}
          </m.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
