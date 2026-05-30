import './IconButton.css';

/**
 * A circular button for icons with proper touch target sizes.
 */
export function IconButton({ 
  icon: Icon, 
  size = 'md', // sm, md, lg, xl
  active = false,
  disabled = false,
  className = '',
  ariaLabel,
  onClick,
  ...props 
}) {
  const sizeClass = `icon-button--${size}`;
  const activeClass = active ? 'icon-button--active' : '';
  
  return (
    <button type="button"
      className={`icon-button ${sizeClass} ${activeClass} ${className}`.trim()}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      data-component="icon-button"
      {...props}
    >
      <Icon className="icon-button__icon" weight={active ? 'fill' : 'light'} />
    </button>
  );
}

