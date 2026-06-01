import { useState, useCallback } from 'react';
import { m } from 'framer-motion';
import { Heart } from '@phosphor-icons/react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

export function AnimatedLikeButton({ isLiked = false, onToggle, size = 'md', className = '' }) {
  const [animating, setAnimating] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const handleClick = useCallback(async (e) => {
    e.stopPropagation();
    if (prefersReducedMotion) {
      onToggle?.();
      return;
    }
    setAnimating(true);
    onToggle?.();
    await new Promise(resolve => setTimeout(resolve, 300));
    setAnimating(false);
  }, [onToggle, prefersReducedMotion]);

  const animate = prefersReducedMotion ? {} : animating ? {
    scale: [1, 1.3, 1],
    transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] },
  } : {};

  return (
    <m.button
      type="button"
      className={`animated-like-btn ${className}`}
      onClick={handleClick}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
      animate={animate}
      aria-label={isLiked ? 'Remove from liked songs' : 'Add to liked songs'}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        color: isLiked ? 'var(--accent-secondary)' : 'var(--text-secondary)',
      }}
    >
      <Heart
        size={size === 'sm' ? 16 : size === 'md' ? 20 : 24}
        weight={isLiked ? 'fill' : 'regular'}
      />
    </m.button>
  );
}

export default AnimatedLikeButton;
