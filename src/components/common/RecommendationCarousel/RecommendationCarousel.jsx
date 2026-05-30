import React, { useRef } from 'react';
import { TrackCard } from '../TrackCard/TrackCard';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import './RecommendationCarousel.css';

export const RecommendationCarousel = React.memo(function RecommendationCarousel({ title, tracks }) {
  const scrollRef = useRef(null);

  if (!tracks || tracks.length === 0) return null;

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const amount = direction === 'left' ? -400 : 400;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <section className="recommendation-carousel">
      <div className="recommendation-carousel__header">
        <h2 className="recommendation-carousel__title">{title}</h2>
      </div>
      
      <div className="recommendation-carousel__wrapper">
        <button 
          className="recommendation-carousel__arrow recommendation-carousel__arrow--left"
          onClick={() => handleScroll('left')}
          aria-label="Scroll left"
        >
          <CaretLeft size={20} weight="bold" />
        </button>

        <div className="recommendation-carousel__scroll-area" ref={scrollRef}>
          {tracks.map((track) => (
            <div key={track.id} className="recommendation-carousel__item">
              <TrackCard track={track} />
            </div>
          ))}
        </div>

        <button 
          className="recommendation-carousel__arrow recommendation-carousel__arrow--right"
          onClick={() => handleScroll('right')}
          aria-label="Scroll right"
        >
          <CaretRight size={20} weight="bold" />
        </button>
      </div>
    </section>
  );
});
export default RecommendationCarousel;

