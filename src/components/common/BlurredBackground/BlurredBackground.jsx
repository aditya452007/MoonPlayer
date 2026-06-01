import './BlurredBackground.css';

/**
 * BloomeeTunes-equivalent ImageFiltered component.
 * Renders an image blurred via CSS filter as a background.
 * Used for album/playlist/artist detail view backdrops.
 */
export function BlurredBackground({ 
  imageUrl, 
  dominantColor = 'var(--bg-void)',
  blurPx = 80,
  opacity = 0.3,
  className = '',
  children 
}) {
  return (
    <div 
      className={`blurred-background ${className}`.trim()}
      style={{ '--blur-px': `${blurPx}px`, '--bg-fallback': dominantColor }}
    >
      {imageUrl && (
        <img 
          src={imageUrl} 
          alt="" 
          className="blurred-background__image"
          style={{ opacity }}
          aria-hidden="true"
          loading="lazy"
        />
      )}
      <div className="blurred-background__overlay" />
      {children && (
        <div className="blurred-background__content">
          {children}
        </div>
      )}
    </div>
  );
}
