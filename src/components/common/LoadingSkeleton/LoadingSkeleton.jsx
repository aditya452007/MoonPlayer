import { Skeleton } from '../Skeleton/Skeleton';
import './LoadingSkeleton.css';

export function LoadingSkeleton({ shape = 'list', count = 5 }) {
  if (shape === 'card-grid') {
    return (
      <div className="loading-skeleton-grid">
        {Array.from({ length: count }).map((_, i) => (
          <div key={`skel-card-${i}`} className="loading-skeleton-card">
            <Skeleton variant="rect" width="100%" style={{ aspectRatio: '1/1', borderRadius: 'var(--radius-md)' }} />
            <Skeleton variant="text" width="80%" style={{ marginTop: 'var(--space-2)' }} />
            <Skeleton variant="text" width="50%" style={{ marginTop: 'var(--space-1)' }} />
          </div>
        ))}
      </div>
    );
  }

  // list shape - default
  return (
    <div className="loading-skeleton-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={`skel-row-${i}`} className="loading-skeleton-row">
          <Skeleton variant="rect" width="40px" height="40px" style={{ borderRadius: 'var(--radius-sm)' }} />
          <div className="loading-skeleton-text">
            <Skeleton variant="text" width="60%" height="16px" />
            <Skeleton variant="text" width="30%" height="12px" style={{ marginTop: '4px' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default LoadingSkeleton;
