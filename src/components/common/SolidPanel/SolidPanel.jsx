import './SolidPanel.css';

/**
 * A standard solid dark panel used for cards, lists, and standard surfaces.
 * This is the workhorse container component for non-glass UI.
 */
export function SolidPanel({ 
  children, 
  className = '', 
  as: Component = 'div',
  elevated = false,
  interactive = false,
  ...props 
}) {
  const elevatedClass = elevated ? 'solid-panel--elevated' : '';
  const interactiveClass = interactive ? 'solid-panel--interactive' : '';
  
  return (
    <Component 
      className={`solid-panel ${elevatedClass} ${interactiveClass} ${className}`.trim()} 
      data-component="solid-panel"
      {...props}
    >
      {children}
    </Component>
  );
}

