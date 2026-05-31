import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ClockCounterClockwise, Playlist as PlaylistIcon } from '@phosphor-icons/react';
import { SolidPanel } from '../SolidPanel/SolidPanel';
import { ImgWithFallback } from '../ImgWithFallback/ImgWithFallback';
import { getOptimalImageUrl } from '../../../core/utils/imageUtils';
import './PlaylistCard.css';

export const PlaylistCard = memo(function PlaylistCard({
  playlist,
  variant = 'custom',
  onClick,
  className = ''
}) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (onClick) {
      onClick(playlist);
      return;
    }

    if (variant === 'liked') {
      navigate('/playlist/liked_songs');
    } else if (variant === 'recent') {
      navigate('/playlist/recently_played');
    } else {
      navigate(`/playlist/${playlist.id}`);
    }
  };

  const name = playlist?.name || (variant === 'liked' ? 'Liked Songs' : variant === 'recent' ? 'Recently Played' : 'Custom Playlist');
  const tracksCount = playlist?.tracks?.length || 0;
  const coverImage = playlist?.coverImage;

  return (
    <SolidPanel
      interactive
      className={`playlist-card playlist-card--${variant} ${className}`}
      onClick={handleCardClick}
      title={name}
    >
      <div className="playlist-card__image-container">
        {coverImage ? (
          <ImgWithFallback
            src={getOptimalImageUrl(coverImage, 200)}
            alt={name}
            className="playlist-card__image"
            loading="lazy"
          />
        ) : (
          <div className="playlist-card__icon-fallback">
            {variant === 'liked' && <Heart weight="fill" className="playlist-card__icon" />}
            {variant === 'recent' && <ClockCounterClockwise weight="bold" className="playlist-card__icon" />}
            {variant === 'custom' && <PlaylistIcon weight="light" className="playlist-card__icon" />}
          </div>
        )}
      </div>
      <div className="playlist-card__info">
        <h4 className="playlist-card__title">{name}</h4>
        <p className="playlist-card__meta">{tracksCount} tracks</p>
      </div>
    </SolidPanel>
  );
});

export default PlaylistCard;
