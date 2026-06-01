import { m } from 'framer-motion';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

const defaultVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export function AnimatedListItem({ index = 0, children, className = '', variants, transition }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      variants={variants || defaultVariants}
      initial="initial"
      animate="animate"
      transition={transition || {
        duration: 0.25,
        delay: Math.min(index * 0.03, 0.2),
        ease: [0.25, 1, 0.5, 1],
      }}
      className={className}
    >
      {children}
    </m.div>
  );
}

export default AnimatedListItem;
