import { Children, isValidElement } from 'react';
import { AnimatedListItem } from '../AnimatedListItem/AnimatedListItem';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

export function AnimatedList({ children, staggerDelay = 0.03, maxStagger = 0.2 }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <>
      {Children.map(children, (child, i) => {
        if (!isValidElement(child)) return null;
        return (
          <AnimatedListItem
            key={child.key || i}
            index={i}
            transition={{
              duration: 0.25,
              delay: Math.min(i * staggerDelay, maxStagger),
              ease: [0.25, 1, 0.5, 1],
            }}
          >
            {child}
          </AnimatedListItem>
        );
      })}
    </>
  );
}

export default AnimatedList;
