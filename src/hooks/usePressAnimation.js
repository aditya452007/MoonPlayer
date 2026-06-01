import { useAnimation } from 'framer-motion';
import { useReducedMotion } from './useReducedMotion';

export function usePressAnimation(scaleTo = 0.95, opacityTo = 0.85, duration = 0.12) {
  const controls = useAnimation();
  const prefersReducedMotion = useReducedMotion();

  const handlePressStart = () => {
    if (prefersReducedMotion) return;
    controls.start({ scale: scaleTo, opacity: opacityTo, transition: { duration, ease: [0.25, 1, 0.5, 1] } });
  };

  const handlePressEnd = () => {
    if (prefersReducedMotion) return;
    controls.start({ scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 15 } });
  };

  return { controls, handlePressStart, handlePressEnd };
}
