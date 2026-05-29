import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { SpeakerHigh, SpeakerLow, SpeakerNone, SpeakerX } from '@phosphor-icons/react';
import { IconButton } from '../../common/IconButton/IconButton';
import './VolumeControl.css';

export function VolumeControl({ volume, onVolumeChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const [hoverValue, setHoverValue] = useState(volume);
  const [previousVolume, setPreviousVolume] = useState(volume);
  const sliderRef = useRef(null);

  const calculatePercent = (val) => val * 100;

  const handlePointerDown = (e) => {
    setIsDragging(true);
    updateFromPointer(e);
  };

  const handlePointerMove = (e) => {
    if (isDragging) {
      updateFromPointer(e);
    }
  };

  const handlePointerUp = () => {
    if (isDragging) {
      setIsDragging(false);
      onVolumeChange(hoverValue);
    }
  };

  const updateFromPointer = (e) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    let x = e.clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));
    const percentage = x / rect.width;
    setHoverValue(percentage);
    // Live update while dragging
    onVolumeChange(percentage);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, hoverValue, onVolumeChange]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMute = () => {
    if (volume > 0) {
      setPreviousVolume(volume);
      onVolumeChange(0);
    } else {
      onVolumeChange(previousVolume > 0 ? previousVolume : 1);
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
        style={{ '--volume-width': `${percent}%` }}
      >
        <div className="volume-fill" />
        <div className="volume-thumb" />
      </div>
    </div>
  );
}

VolumeControl.propTypes = {
  volume: PropTypes.number.isRequired,
  onVolumeChange: PropTypes.func.isRequired,
};
