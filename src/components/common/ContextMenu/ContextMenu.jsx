import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './ContextMenu.css';

export function ContextMenu({ isOpen, onClose, x, y, children }) {
  const menuRef = useRef(null);
  const [adjustedX, setAdjustedX] = useState(x);
  const [adjustedY, setAdjustedY] = useState(y);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Adjust X if it overflows the right edge
      if (x + rect.width > viewportWidth) {
        setAdjustedX(viewportWidth - rect.width - 16);
      } else {
        setAdjustedX(x);
      }

      // Adjust Y if it overflows the bottom edge
      if (y + rect.height > viewportHeight) {
        setAdjustedY(viewportHeight - rect.height - 16);
      } else {
        setAdjustedY(y);
      }
    }
  }, [isOpen, x, y]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    // Use capture phase to ensure it runs before other handlers might stop propagation
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside, true);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const style = {
    top: `${adjustedY}px`,
    left: `${adjustedX}px`,
  };

  return createPortal(
    <div className="context-menu" style={style} ref={menuRef}>
      {children}
    </div>,
    document.body
  );
}


export function ContextMenuItem({ icon: Icon, label, onClick }) {
  return (
    <button type="button" 
      className="context-menu__item" 
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {Icon && <Icon weight="bold" />}
      <span>{label}</span>
    </button>
  );
}


export function ContextMenuDivider() {
  return <div className="context-menu__divider" />;
}
