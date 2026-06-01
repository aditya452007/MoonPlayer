import './GlassPanel.css';

/**
 * A translucent panel with backdrop blur used for elevated UI elements
 * like the sidebar, mini-player, and overlays.
 */
export function GlassPanel({ 
  children, 
  className = '', 
  as: Component = 'div', 
  variant = 'default',    // default, light, heavy, searchbar, miniplayer, toast
  blur,                   // backwards compatibility
  ...props 
}) {
  const activeVariant = variant !== 'default' ? variant : (blur || 'default');
  
  let blurMod = '';
  if (activeVariant === 'light') blurMod = 'glass-panel--light';
  else if (activeVariant === 'heavy' || activeVariant === 'toast') blurMod = 'glass-panel--heavy';
  else if (activeVariant === 'searchbar') blurMod = 'glass-panel--searchbar';
  else if (activeVariant === 'miniplayer') blurMod = 'glass-panel--miniplayer';
                    
  return (
    <Component 
      className={`glass-panel ${blurMod} ${className}`.trim()} 
      data-component="glass-panel"
      {...props}
    >
      {children}
    </Component>
  );
}

