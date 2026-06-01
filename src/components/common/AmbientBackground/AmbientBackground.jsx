import { m } from 'framer-motion';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

export function AmbientBackground({ colors = ['rgb(26, 30, 37)'], duration = 0.5, children, className = '' }) {
  const prefersReducedMotion = useReducedMotion();
  const gradient = colors.length > 1
    ? `radial-gradient(ellipse at 50% 25%, ${colors[0]} 0%, ${colors[1]} 45%, var(--bg-void) 80%)`
    : `radial-gradient(ellipse at 50% 25%, ${colors[0]} 0%, var(--bg-void) 70%)`;

  return (
    <m.div
      className={`ambient-background ${className}`}
      animate={prefersReducedMotion ? {} : { background: gradient }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration, ease: [0, 0, 0.2, 1] }}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: prefersReducedMotion ? gradient : undefined,
      }}
    >
      {children}
    </m.div>
  );
}

export default AmbientBackground;
