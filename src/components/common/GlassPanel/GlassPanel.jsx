import PropTypes from 'prop-types';
import './GlassPanel.css';

/**
 * A translucent panel with backdrop blur used for elevated UI elements
 * like the sidebar, mini-player, and overlays.
 */
export function GlassPanel({ 
  children, 
  className = '', 
  as: Component = 'div', 
  blur = 'default',
  ...props 
}) {
  const blurClass = blur === 'heavy' ? 'glass-panel--heavy' : 
                    blur === 'light' ? 'glass-panel--light' : '';
                    
  return (
    <Component 
      className={`glass-panel ${blurClass} ${className}`.trim()} 
      data-component="glass-panel"
      {...props}
    >
      {children}
    </Component>
  );
}

GlassPanel.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  as: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
  blur: PropTypes.oneOf(['default', 'light', 'heavy']),
};
