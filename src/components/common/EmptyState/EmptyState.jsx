import { m } from 'framer-motion';
import { Button } from '../Button/Button';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import './EmptyState.css';

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'empty',
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
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

  return (
    <m.div
      className={`empty-state empty-state--${variant}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
    >
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
    </m.div>
  );
}

export default EmptyState;
