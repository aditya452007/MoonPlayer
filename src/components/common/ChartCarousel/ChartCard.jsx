import React from 'react';
import { ImgWithFallback } from '../ImgWithFallback/ImgWithFallback';

export const ChartCard = React.memo(function ChartCard({ chart, onClick }) {
  return (
    <div 
      className="chart-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="chart-card__image-container">
        <ImgWithFallback 
          src={chart.imageUrl}
          alt={chart.title}
          className="chart-card__image"
          fallbackSrc="/default-album-art.png"
          loading="lazy"
        />
        <div className="chart-card__overlay" />
        <div className="chart-card__content">
          <h3 className="chart-card__title">{chart.title}</h3>
          {chart.subtitle && <p className="chart-card__subtitle">{chart.subtitle}</p>}
        </div>
      </div>
    </div>
  );
});

export default ChartCard;
