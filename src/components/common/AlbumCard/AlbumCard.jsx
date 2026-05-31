import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from '@phosphor-icons/react';
import { SolidPanel } from '../SolidPanel/SolidPanel';
import { IconButton } from '../IconButton/IconButton';
import { ImgWithFallback } from '../ImgWithFallback/ImgWithFallback';
import { getOptimalImageUrl } from '../../../core/utils/imageUtils';
import './AlbumCard.css';

export const AlbumCard = memo(function AlbumCard({ album, onPlayClick, className = '' }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/album/${album.id}`);
  };

  const handlePlay = (e) => {
    e.stopPropagation();
    if (onPlayClick) {
      onPlayClick(album);
    }
  };

  const title = album.title || album.name || 'Unknown Album';
  const artist = album.artistName || album.artist || 'Unknown Artist';
  const year = album.year ? ` · ${album.year}` : '';

  return (
    <SolidPanel
      interactive
      className={`album-card ${className}`}
      onClick={handleCardClick}
      title={title}
    >
      <div className="album-card__image-container">
        <ImgWithFallback
          src={getOptimalImageUrl(album.imageUrl || album.image, 200)}
          alt={title}
          className="album-card__image"
          loading="lazy"
        />
        <div className="album-card__overlay">
          <IconButton
            icon={Play}
            size="md"
            className="album-card__play-btn"
            ariaLabel={`Play album ${title}`}
            onClick={handlePlay}
          />
        </div>
      </div>
      <div className="album-card__info">
        <h4 className="album-card__title">{title}</h4>
        <p className="album-card__subtitle">
          {artist}{year}
        </p>
      </div>
    </SolidPanel>
  );
});

export default AlbumCard;
