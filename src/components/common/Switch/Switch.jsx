import { useId } from 'react';
import './Switch.css';

export function Switch({
  checked = false,
  onChange,
  disabled = false,
  label,
  id,
  className = '',
}) {
  const defaultId = useId();
  const switchId = id || defaultId;

  return (
    <label 
      className={`switch ${disabled ? 'switch--disabled' : ''} ${className}`.trim()}
      htmlFor={switchId}
    >
      <input
        id={switchId}
        type="checkbox"
        role="switch"
        aria-checked={checked}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="switch__input"
      />
      <span className="switch__track">
        <span className="switch__thumb" />
      </span>
      {label && <span className="switch__label">{label}</span>}
    </label>
  );
}
