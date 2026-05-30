import React from 'react';
import { TrackCard } from '../TrackCard/TrackCard';
import './RecommendationCarousel.css';

export const RecommendationCarousel = React.memo(function RecommendationCarousel({ title, tracks }) {
  if (!tracks || tracks.length === 0) return null;

  return (
    <section className="recommendation-carousel">
      <div className="recommendation-carousel__header">
        <h2 className="recommendation-carousel__title">{title}</h2>
      </div>
      
      <div className="recommendation-carousel__scroll-area">
        {tracks.map((track) => (
          <div key={track.id} className="recommendation-carousel__item">
            <TrackCard track={track} />
          </div>
        ))}
      </div>
    </section>
  );
});
export default RecommendationCarousel;

