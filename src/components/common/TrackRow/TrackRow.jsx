import React, { useState, useRef, useEffect } from 'react';
import { m } from 'framer-motion';
import { Play, DotsThree } from '@phosphor-icons/react';
import { IconButton } from '../IconButton/IconButton';
import { usePlayerStore } from '../../../store/playerStore';
import { formatTime } from '../../../core/utils/formatTime';
import { TrackContextMenu } from '../ContextMenu/TrackContextMenu';
import './TrackRow.css';

export const TrackRow = React.memo(function TrackRow({ track, index, showImage = true, onClick, className = '' }) {
  const { play, currentTrack } = usePlayerStore();
  const isCurrentTrack = currentTrack?.id === track.id;

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  const longPressTimer = useRef(null);

  // Unmount effect cleanup (TrackRow timer cleanup)
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const handleRowClick = () => {
    if (onClick) {
      onClick(track);
    } else {
      play(track);
    }
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setMenuPos({ x: e.clientX ?? window.innerWidth / 2, y: e.clientY ?? window.innerHeight / 2 });
    setMenuOpen(true);
  };

  const handlePointerDown = (e) => {
    // Nullish coalescing timing fix: client coords zero-guards
    const clientX = e.clientX ?? (e.touches && e.touches[0] && e.touches[0].clientX) ?? window.innerWidth / 2;
    const clientY = e.clientY ?? (e.touches && e.touches[0] && e.touches[0].clientY) ?? window.innerHeight / 2;
    
    longPressTimer.current = setTimeout(() => {
      setMenuPos({ x: clientX, y: clientY });
      setMenuOpen(true);
    }, 500);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleDragEnd = (e, info) => {
    if (info.offset.x > 50) {
      setMenuPos({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      setMenuOpen(true);
    }
  };

  return (
    <m.div 
      className={`track-row ${isCurrentTrack ? 'track-row--active' : ''} ${className}`}
      onClick={handleRowClick}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ right: 0.2, left: 0 }}
      onDragEnd={handleDragEnd}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
      role="button"
      tabIndex={0}
      aria-label={`Play ${track.title} by ${track.artistNames?.join(', ') || 'Unknown Artist'}`}
      aria-current={isCurrentTrack ? 'true' : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleRowClick();
        }
      }}
    >
      <div className="track-row__left">
        {showImage ? (
          <div className="track-row__image-container">
            <img 
              src={track.imageUrl || '/default-album-art.png'} 
              alt={track.title} 
              className="track-row__image"
              loading="lazy"
            />
            <div className="track-row__play-overlay">
              <Play weight="fill" className="track-row__play-icon" />
            </div>
          </div>
        ) : (
          <div className="track-row__index">
            <span className="track-row__index-number">{index !== undefined ? index + 1 : ''}</span>
            <Play weight="fill" className="track-row__play-icon" />
          </div>
        )}
        <div className="track-row__info">
          <h4 className="track-row__title">{track.title}</h4>
          <p className="track-row__artist">{track.artistNames?.join(', ')}</p>
        </div>
      </div>

      <div className="track-row__right">
        {track.duration > 0 && (
          <span className="track-row__duration">{formatTime(track.duration)}</span>
        )}
        <IconButton 
          icon={DotsThree} 
          size="md" 
          className="track-row__menu-btn"
          ariaLabel="More options"
          onClick={handleMenuClick}
        />
      </div>

      <TrackContextMenu 
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        x={menuPos.x}
        y={menuPos.y}
        track={track}
      />
    </m.div>
  );
});
export default TrackRow;
