import { useState, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Play, Spinner, Check } from '@phosphor-icons/react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import './ResolveButton.css';

const STATE = { IDLE: 'idle', RESOLVING: 'resolving', SUCCESS: 'success' };

export function ResolveButton({ onResolve, holdDuration = 1400, className = '' }) {
  const [state, setState] = useState(STATE.IDLE);
  const prefersReducedMotion = useReducedMotion();

  const handleClick = useCallback(async () => {
    if (state !== STATE.IDLE) return;
    setState(STATE.RESOLVING);
    try {
      await onResolve();
      setState(STATE.SUCCESS);
      setTimeout(() => setState(STATE.IDLE), holdDuration);
    } catch {
      setState(STATE.IDLE);
    }
  }, [state, onResolve, holdDuration]);

  return (
    <m.button
      className={`resolve-button ${className}`}
      onClick={handleClick}
      whileTap={prefersReducedMotion ? undefined : (state === STATE.IDLE ? { scale: 0.95 } : undefined)}
      aria-label={state === STATE.IDLE ? 'Play' : state === STATE.RESOLVING ? 'Resolving...' : 'Ready!'}
    >
      <AnimatePresence mode="wait">
        {state === STATE.IDLE && (
          <m.div
            key="idle"
            initial={prefersReducedMotion ? {} : { scale: 0, rotate: -90 }}
            animate={prefersReducedMotion ? {} : { scale: 1, rotate: 0 }}
            exit={prefersReducedMotion ? {} : { scale: 0, rotate: 90 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
          >
            <Play weight="fill" size={24} />
          </m.div>
        )}
        {state === STATE.RESOLVING && (
          <m.div
            key="resolving"
            initial={prefersReducedMotion ? {} : { scale: 0 }}
            animate={prefersReducedMotion ? {} : { scale: 1, rotate: 360 }}
            exit={prefersReducedMotion ? {} : { scale: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : {
              scale: { duration: 0.2 },
              rotate: { repeat: Infinity, duration: 1, ease: 'linear' },
            }}
          >
            <Spinner weight="bold" size={24} />
          </m.div>
        )}
        {state === STATE.SUCCESS && (
          <m.div
            key="success"
            initial={prefersReducedMotion ? {} : { scale: 0, rotate: -180 }}
            animate={prefersReducedMotion ? {} : { scale: 1, rotate: 0 }}
            exit={prefersReducedMotion ? {} : { scale: 0, rotate: 180 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.26, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <Check weight="bold" size={24} />
          </m.div>
        )}
      </AnimatePresence>
      <m.span
        key={`label-${state}`}
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 5 }}
        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? {} : { opacity: 0, y: -5 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.15 }}
        className="resolve-button__label"
      >
        {state === STATE.IDLE && 'Play'}
        {state === STATE.RESOLVING && 'Resolving...'}
        {state === STATE.SUCCESS && 'Ready!'}
      </m.span>
    </m.button>
  );
}

export default ResolveButton;
