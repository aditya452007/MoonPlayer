import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { ChartCard } from './ChartCard';
import './ChartCarousel.css';

export function ChartCarousel({ charts }) {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayTimerRef = useRef(null);

  const totalCharts = charts?.length || 0;

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollLeft, clientWidth } = containerRef.current;
    const index = Math.round(scrollLeft / clientWidth);
    setActiveIndex(index);
  }, []);

  const scrollTo = useCallback((index) => {
    if (!containerRef.current) return;
    const { clientWidth } = containerRef.current;
    containerRef.current.scrollTo({
      left: index * clientWidth,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
    setActiveIndex(index);
  }, []);

  const nextSlide = useCallback(() => {
    if (totalCharts === 0) return;
    const nextIdx = (activeIndex + 1) % totalCharts;
    scrollTo(nextIdx);
  }, [activeIndex, scrollTo, totalCharts]);

  const prevSlide = useCallback(() => {
    if (totalCharts === 0) return;
    const prevIdx = (activeIndex - 1 + totalCharts) % totalCharts;
    scrollTo(prevIdx);
  }, [activeIndex, scrollTo, totalCharts]);

  useEffect(() => {
    if (totalCharts <= 1 || isPaused) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      nextSlide();
    }, 2500);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [nextSlide, totalCharts, isPaused]);

  if (!charts || charts.length === 0) return null;

  return (
    <div 
      className="chart-carousel-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="chart-carousel__header">
        <h2 className="chart-carousel__title">Trending Charts</h2>
        <div className="chart-carousel__nav-buttons">
          <button 
            type="button" 
            className="chart-carousel__nav-btn" 
            onClick={prevSlide}
            aria-label="Previous Chart"
          >
            <CaretLeft size={16} weight="bold" />
          </button>
          <button 
            type="button" 
            className="chart-carousel__nav-btn" 
            onClick={nextSlide}
            aria-label="Next Chart"
          >
            <CaretRight size={16} weight="bold" />
          </button>
        </div>
      </div>

      <div className="chart-carousel-wrapper">
        <div 
          className="chart-carousel" 
          ref={containerRef}
          onScroll={handleScroll}
        >
          {charts.map((chart) => (
            <div key={chart.id} className="chart-carousel__slide">
              <ChartCard 
                chart={chart}
                onClick={() => navigate(`/chart/${chart.id}`)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="chart-carousel__indicators">
        {charts.map((_, idx) => (
          <button
            type="button"
            key={idx}
            className={`chart-carousel__dot ${idx === activeIndex ? 'chart-carousel__dot--active' : ''}`}
            onClick={() => scrollTo(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default ChartCarousel;
