import React, { useState, useRef, useEffect } from 'react';
import { Play } from '@phosphor-icons/react';
import { SolidPanel } from '../SolidPanel/SolidPanel';
import { IconButton } from '../IconButton/IconButton';
import { usePlayerStore } from '../../../store/playerStore';
import { TrackContextMenu } from '../ContextMenu/TrackContextMenu';
import './TrackCard.css';

export const TrackCard = React.memo(function TrackCard({ track, onClick, className = '' }) {
  const { play, currentTrack, isPlaying } = usePlayerStore();

  const isCurrentTrack = currentTrack?.id === track.id;
  
  const handlePlayClick = (e) => {
    e.stopPropagation();
    if (isCurrentTrack && isPlaying) {
      // Intentionally empty: track already playing
    } else {
      play(track);
    }
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef(null);

  // Unmount effect cleanup (TrackCard timer cleanup)
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const handleCardClick = () => {
    if (onClick) {
      onClick(track);
    } else {
      play(track);
    }
  };

  const handlePointerDown = (e) => {
    // Nullish coalescing timing fix: clients coords zero-guards
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

  return (
    <SolidPanel 
      interactive 
      className={`track-card ${isCurrentTrack ? 'track-card--active' : ''} ${className}`}
      onClick={handleCardClick}
      title={track.title}
    >
      <div 
        className="track-card__pointer-wrapper"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div className="track-card__image-container">
          <img 
            src={track.imageUrl || '/default-album-art.png'} 
            alt={track.title}
            className="track-card__image"
            loading="lazy"
          />
          <div className="track-card__overlay">
            <IconButton 
              icon={Play} 
              size="lg"
              className="track-card__play-btn"
              ariaLabel={`Play ${track.title}`}
              onClick={handlePlayClick}
            />
          </div>
        </div>
        <div className="track-card__info">
          <h4 className="track-card__title">{track.title}</h4>
          <p className="track-card__artist">{track.artistNames?.join(', ')}</p>
        </div>
      </div>
      <TrackContextMenu 
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        x={menuPos.x}
        y={menuPos.y}
        track={track}
      />
    </SolidPanel>
  );
});
export default TrackCard;
