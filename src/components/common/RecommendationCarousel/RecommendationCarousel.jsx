import React, { useRef } from 'react';
import { TrackCard } from '../TrackCard/TrackCard';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { useContainerWidth } from '../../../hooks/useContainerWidth';
import { getViewportFraction } from '../../../core/utils/gridUtils';
import { AnimatedListItem } from '../AnimatedListItem/AnimatedListItem';
import './RecommendationCarousel.css';

export const RecommendationCarousel = React.memo(function RecommendationCarousel({ title, tracks }) {
  const { containerRef, width } = useContainerWidth();
  const scrollRef = useRef(null);

  if (!tracks || tracks.length === 0) return null;

  const fraction = getViewportFraction(width || 800);
  const gap = 16;
  const itemWidth = width ? (width * fraction) - gap : 180;

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const amount = direction === 'left' ? -scrollRef.current.clientWidth : scrollRef.current.clientWidth;
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

        <div 
          className="recommendation-carousel__scroll-area" 
          ref={(node) => {
            scrollRef.current = node;
            containerRef.current = node;
          }}
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {tracks.map((track, i) => (
            <div 
              key={track.id} 
              className="recommendation-carousel__item"
              style={{ flex: `0 0 ${itemWidth}px`, scrollSnapAlign: 'start' }}
            >
              <AnimatedListItem
                index={i}
                variants={{
                  initial: { opacity: 0, x: 50 },
                  animate: { opacity: 1, x: 0 },
                }}
                transition={{
                  duration: 0.3,
                  delay: Math.min(i * 0.05, 0.25),
                  ease: [0.25, 1, 0.5, 1],
                }}
              >
                <TrackCard track={track} />
              </AnimatedListItem>
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

