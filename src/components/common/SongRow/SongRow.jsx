import { memo } from 'react';
import { Play, DotsThree } from '@phosphor-icons/react';
import { IconButton } from '../IconButton/IconButton';
import { ImgWithFallback } from '../ImgWithFallback/ImgWithFallback';
import { getOptimalImageUrl } from '../../../core/utils/imageUtils';
import { usePlayerStore } from '../../../store/playerStore';
import './SongRow.css';

export const SongRow = memo(function SongRow({
  track,
  index,
  showArtwork = true,
  onPlay,
  onMenu,
  className = ''
}) {
  const { play, currentTrack } = usePlayerStore();
  const isCurrent = currentTrack?.id === track.id;

  const handleRowClick = () => {
    if (onPlay) {
      onPlay(track);
    } else {
      play(track);
    }
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    if (onMenu) {
      onMenu(track, e);
    }
  };

  return (
    <div
      className={`song-row ${isCurrent ? 'song-row--active' : ''} ${className}`}
      onClick={handleRowClick}
      role="button"
      tabIndex={0}
      aria-label={`Play ${track.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleRowClick();
        }
      }}
    >
      <div className="song-row__left">
        {showArtwork ? (
          <div className="song-row__image-container">
            <ImgWithFallback
              src={getOptimalImageUrl(track.imageUrl || track.image, 80)}
              alt={track.title}
              className="song-row__image"
              loading="lazy"
            />
            <div className="song-row__play-overlay">
              <Play weight="fill" className="song-row__play-icon" />
            </div>
          </div>
        ) : (
          <div className="song-row__index">
            {index !== undefined && <span className="song-row__index-num">{index + 1}</span>}
            <Play weight="fill" className="song-row__play-icon" />
          </div>
        )}
        <div className="song-row__info">
          <h4 className="song-row__title">{track.title}</h4>
          <p className="song-row__artist">{track.artistNames?.join(', ') || 'Unknown Artist'}</p>
        </div>
      </div>
      <div className="song-row__right">
        {onMenu && (
          <IconButton
            icon={DotsThree}
            size="md"
            className="song-row__menu-btn"
            ariaLabel="Options"
            onClick={handleMenuClick}
          />
        )}
      </div>
    </div>
  );
});

export default SongRow;
