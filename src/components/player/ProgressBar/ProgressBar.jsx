import { useState, useEffect, useRef, useCallback } from 'react';
import './ProgressBar.css';

// Formatting helper (e.g., 03:45)
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const calculatePercent = (value, max) => {
  if (!max) return 0;
  return (value / max) * 100;
};

/**
 * Custom slider for audio progress.
 */
export function ProgressBar({ current, total, onSeek }) {
  const [isDragging, setIsDragging] = useState(false);
  const [hoverValue, setHoverValue] = useState(0);
  const sliderRef = useRef(null);

  const updateFromPointer = useCallback((e) => {
    if (!sliderRef.current || !total) return;
    const rect = sliderRef.current.getBoundingClientRect();
    let x = e.clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));
    const percentage = x / rect.width;
    setHoverValue(percentage * total);
  }, [total]);

  const handlePointerDown = useCallback((e) => {
    setIsDragging(true);
    updateFromPointer(e);
  }, [updateFromPointer]);

  const handlePointerMove = useCallback((e) => {
    if (isDragging) {
      updateFromPointer(e);
    }
  }, [isDragging, updateFromPointer]);

  const handlePointerUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onSeek(hoverValue);
    }
  }, [isDragging, hoverValue, onSeek]);

  // Attach window event listeners for drag outside the element
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  const displayValue = isDragging ? hoverValue : current;
  const percent = calculatePercent(displayValue, total);

  return (
    <div className="progress-container">
      <span className="progress-time">{formatTime(displayValue)}</span>
      
      <div 
        className="progress-track"
        ref={sliderRef}
        onPointerDown={handlePointerDown}
        style={{ 
          '--progress-percent': percent,
          '--progress-width': `${percent}%` 
        }}
      >
        <div className="progress-fill" />
        <div className="progress-thumb" />
      </div>

      <span className="progress-time">{formatTime(total)}</span>
    </div>
  );
}

