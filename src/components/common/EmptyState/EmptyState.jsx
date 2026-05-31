import { Button } from '../Button/Button';
import './EmptyState.css';

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'empty', // 'empty' | 'error' | 'loading'
}) {
  return (
    <div className={`empty-state empty-state--${variant}`}>
      {Icon && (
        <div className="empty-state__icon-wrapper">
          <Icon size={48} weight="light" className="empty-state__icon" />
        </div>
      )}
      {title && <h3 className="empty-state__title">{title}</h3>}
      {description && <p className="empty-state__description">{description}</p>}
      {actionLabel && onAction && (
        <div className="empty-state__action">
          <Button variant="secondary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export default EmptyState;
