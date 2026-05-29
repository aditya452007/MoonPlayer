import PropTypes from 'prop-types';
import './Skeleton.css';

/**
 * Shimmering placeholder component for loading states.
 */
export function Skeleton({ 
  variant = 'text', // text, circle, rect, card
  width,
  height,
  count = 1,
  className = '',
  ...props 
}) {
  const elements = [];
  
  for (let i = 0; i < count; i++) {
    elements.push(
      <div 
        key={i}
        className={`skeleton-base skeleton-base--${variant} skeleton ${className}`.trim()}
        style={{ 
          width: width !== undefined ? width : undefined,
          height: height !== undefined ? height : undefined,
          ...props.style 
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

Skeleton.propTypes = {
  variant: PropTypes.oneOf(['text', 'circle', 'rect', 'card']),
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  count: PropTypes.number,
  className: PropTypes.string,
  style: PropTypes.object,
};
