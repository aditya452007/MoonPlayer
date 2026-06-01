import './Skeleton.css';

export function Skeleton({ 
  variant = 'text',
  width,
  height,
  aspectRatio,
  count = 1,
  className = '',
  style,
  ...props 
}) {
  const elements = [];
  
  for (let i = 0; i < count; i++) {
    elements.push(
      <div 
        key={`skeleton-${i}`}
        className={`skeleton-base skeleton-base--${variant} skeleton ${className}`.trim()}
        style={{ 
          width: width !== undefined ? width : undefined,
          height: height !== undefined ? height : undefined,
          aspectRatio: aspectRatio || undefined,
          ...style
        }}
        data-component="skeleton"
        aria-hidden="true"
        {...props}
      />
    );
  }
  
  if (count === 1) {
    return elements[0];
  }
  
  return (
    <div className="skeleton-group" aria-hidden="true">
      {elements}
    </div>
  );
}

export default Skeleton;
