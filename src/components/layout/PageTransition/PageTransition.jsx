import { m } from 'framer-motion';
import { TRANSITION } from '../../../core/utils/animation';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -10 },
};

export function PageTransition({ children }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div style={{ minHeight: '100%', width: '100%' }}>{children}</div>;
  }

  return (
    <m.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={TRANSITION.pageTransition}
      style={{ minHeight: '100%', width: '100%' }}
    >
      {children}
    </m.div>
  );
}

export default PageTransition;
