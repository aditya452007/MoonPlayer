import { m } from 'framer-motion';

const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.96,
  },
  in: {
    opacity: 1,
    scale: 1,
  },
  out: {
    opacity: 0,
    scale: 0.96,
  }
};

const pageTransition = {
  type: 'tween',
  ease: [0.25, 0.46, 0.45, 0.94], // easeOutCubic equivalent
  duration: 0.25
};

/**
 * Wraps route components to provide smooth entry and exit animations.
 */
export function PageTransition({ children }) {
  return (
    <m.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      style={{ height: '100%', width: '100%' }}
    >
      {children}
    </m.div>
  );
}

export default PageTransition;
