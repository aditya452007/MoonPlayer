import './Button.css';

/**
 * Primary action button with variants for different emphasis levels.
 */
export function Button({ 
  children, 
  variant = 'primary', // primary, secondary, ghost, premium
  size = 'md',         // sm, md, lg
  disabled = false,
  loading = false,
  icon: Icon = null,
  className = '',
  onClick,
  ...props 
}) {
  const baseClass = 'button';
  const variantClass = `button--${variant}`;
  const sizeClass = `button--${size}`;
  const loadingClass = loading ? 'button--loading' : '';
  
  return (
    <button type="button"
      className={`${baseClass} ${variantClass} ${sizeClass} ${loadingClass} ${className}`.trim()}
      disabled={disabled || loading}
      onClick={onClick}
      data-component="button"
      {...props}
    >
      {/* Loading state shimmer overlay */}
      {loading && <span className="button__loader skeleton" aria-hidden="true" />}
      
      <span className="button__content" style={{ opacity: loading ? 0 : 1 }}>
        {Icon && <Icon className="button__icon" weight="bold" />}
        {children}
      </span>
    </button>
  );
}

