import { m } from 'framer-motion';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import './SolidPanel.css';

export function SolidPanel({ 
  children, 
  className = '', 
  as: Component = 'div',
  elevated = false,
  interactive = false,
  ...props 
}) {
  const prefersReducedMotion = useReducedMotion();
  const elevatedClass = elevated ? 'solid-panel--elevated' : '';
  const interactiveClass = interactive ? 'solid-panel--interactive' : '';
  
  const MotionComponent = m[Component] || m.div;

  if (interactive && !prefersReducedMotion) {
    return (
      <MotionComponent 
        className={`solid-panel ${elevatedClass} ${interactiveClass} ${className}`.trim()} 
        data-component="solid-panel"
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.12, ease: [0.25, 1, 0.5, 1] }}
        {...props}
      >
        {children}
      </MotionComponent>
    );
  }

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
