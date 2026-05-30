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

