import { m } from 'framer-motion';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import './IconButton.css';

export function IconButton({ 
  icon: Icon, 
  size = 'md',
  active = false,
  disabled = false,
  className = '',
  ariaLabel,
  onClick,
  ...props 
}) {
  const prefersReducedMotion = useReducedMotion();

  if (import.meta.env.DEV && !ariaLabel) {
    console.warn(`IconButton [${Icon?.name || 'anonymous'}] requires an ariaLabel prop for screen reader accessibility.`);
  }

  const sizeClass = `icon-button--${size}`;
  const activeClass = active ? 'icon-button--active' : '';
  
  return (
    <m.button
      type="button"
      className={`icon-button ${sizeClass} ${activeClass} ${className}`.trim()}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      data-component="icon-button"
      whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.12, ease: [0.25, 1, 0.5, 1] }}
      {...props}
    >
      <Icon className="icon-button__icon" weight={active ? 'fill' : 'light'} />
    </m.button>
  );
}
