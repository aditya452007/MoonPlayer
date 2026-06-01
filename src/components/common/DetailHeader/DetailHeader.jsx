import React from 'react';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import './DetailHeader.css';

export const DetailHeader = React.memo(function DetailHeader({
  imageUrl,
  title,
  subtitle,
  metadata,
  actions,
  fallbackImage = '/default-album-art.png',
  isCompact: forceCompact,
  children,
}) {
  const { isMobile } = useBreakpoint();
  const isCompact = forceCompact !== undefined ? forceCompact : isMobile;

  return (
    <div className={`detail-header ${isCompact ? 'detail-header--compact' : 'detail-header--expanded'}`}>
      <div className="detail-header__art">
        <img
          src={imageUrl || fallbackImage}
          alt={title}
          className="detail-header__image"
        />
      </div>
      <div className="detail-header__info">
        {subtitle && <span className="detail-header__subtitle">{subtitle}</span>}
        <h1 className="detail-header__title">{title}</h1>
        {metadata && <p className="detail-header__metadata">{metadata}</p>}
        {actions && <div className="detail-header__actions">{actions}</div>}
        {children}
      </div>
    </div>
  );
});
