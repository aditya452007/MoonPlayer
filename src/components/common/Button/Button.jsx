import { m } from 'framer-motion';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import './Button.css';

export function Button({ 
  children, 
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon = null,
  className = '',
  onClick,
  ...props 
}) {
  const prefersReducedMotion = useReducedMotion();
  const baseClass = 'button';
  const variantClass = `button--${variant}`;
  const sizeClass = `button--${size}`;
  const loadingClass = loading ? 'button--loading' : '';
  
  return (
    <m.button
      type="button"
      className={`${baseClass} ${variantClass} ${sizeClass} ${loadingClass} ${className}`.trim()}
      disabled={disabled || loading}
      onClick={onClick}
      data-component="button"
      whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.12, ease: [0.25, 1, 0.5, 1] }}
      {...props}
    >
      {loading && <span className="button__loader skeleton" aria-hidden="true" />}
      
      <span className="button__content" style={{ opacity: loading ? 0 : 1 }}>
        {Icon && <Icon className="button__icon" weight="bold" />}
        {children}
      </span>
    </m.button>
  );
}
