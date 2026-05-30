import { useState, useRef, useEffect, useCallback } from 'react';
import { SpeakerHigh, SpeakerLow, SpeakerNone, SpeakerX } from '@phosphor-icons/react';
import { IconButton } from '../../common/IconButton/IconButton';
import './VolumeControl.css';

const calculatePercent = (val) => val * 100;

/**
 * VolumeControl Component
 * Interactive sliding track for adjusting playback volume.
 * Uses a ref to store and preserve previous volume levels safely,
 * preventing cascading renders inside react hooks effects.
 */
export function VolumeControl({ volume, onVolumeChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const [hoverValue, setHoverValue] = useState(volume);
  const sliderRef = useRef(null);
  
  // Safe ref storage for previous volume context (Issue #15, resolves react-hooks/set-state-in-effect)
  const previousVolumeRef = useRef(volume);

  useEffect(() => {
    if (volume > 0) {
      previousVolumeRef.current = volume;
    }
  }, [volume]);

  const updateFromPointer = useCallback((e) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    let x = e.clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));
    const percentage = x / rect.width;
    setHoverValue(percentage);
    // Live update while dragging
    onVolumeChange(percentage);
  }, [onVolumeChange]);

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
      onVolumeChange(hoverValue);
    }
  }, [isDragging, hoverValue, onVolumeChange]);

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

  const toggleMute = () => {
    if (volume > 0) {
      previousVolumeRef.current = volume;
      onVolumeChange(0);
    } else {
      onVolumeChange(previousVolumeRef.current > 0 ? previousVolumeRef.current : 1);
    }
  };

  const getVolumeIcon = () => {
    if (volume === 0) return SpeakerX;
    if (volume < 0.3) return SpeakerNone;
    if (volume < 0.7) return SpeakerLow;
    return SpeakerHigh;
  };

  const percent = calculatePercent(isDragging ? hoverValue : volume);

  return (
    <div className="volume-control">
      <IconButton 
        icon={getVolumeIcon()} 
        size="sm" 
        onClick={toggleMute}
        ariaLabel="Toggle mute"
      />
      <div 
        className="volume-track"
        ref={sliderRef}
        onPointerDown={handlePointerDown}
        style={{ 
          '--volume-percent': percent,
          '--volume-width': `${percent}%` 
        }}
      >
        <div className="volume-fill" />
        <div className="volume-thumb" />
      </div>
    </div>
  );
}
