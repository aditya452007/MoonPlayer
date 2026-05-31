import { m } from 'framer-motion';
import { EASE_OUT_QUART } from '../../../core/utils/animation';

export function AnimatedListItem({ index = 0, children, className = '' }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.25,
        delay: index * 0.03, // 30ms stagger
        ease: EASE_OUT_QUART,
      }}
      className={className}
    >
      {children}
    </m.div>
  );
}

export default AnimatedListItem;
