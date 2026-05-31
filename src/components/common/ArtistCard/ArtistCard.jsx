import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SolidPanel } from '../SolidPanel/SolidPanel';
import { ImgWithFallback } from '../ImgWithFallback/ImgWithFallback';
import { getOptimalImageUrl } from '../../../core/utils/imageUtils';
import './ArtistCard.css';

export const ArtistCard = memo(function ArtistCard({ artist, className = '' }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/artist/${artist.id}`);
  };

  const name = artist.name || 'Unknown Artist';
  const genre = artist.genre || artist.role || 'Artist';

  return (
    <SolidPanel
      interactive
      className={`artist-card ${className}`}
      onClick={handleCardClick}
      title={name}
    >
      <div className="artist-card__image-container">
        <ImgWithFallback
          src={getOptimalImageUrl(artist.imageUrl || artist.image, 200)}
          alt={name}
          className="artist-card__image"
          fallbackSrc="/default-album-art.png"
          loading="lazy"
        />
      </div>
      <div className="artist-card__info">
        <h4 className="artist-card__name">{name}</h4>
        <p className="artist-card__genre">{genre}</p>
      </div>
    </SolidPanel>
  );
});

export default ArtistCard;
