import { Children, isValidElement } from 'react';
import { AnimatedListItem } from '../AnimatedListItem/AnimatedListItem';

export function AnimatedList({ children }) {
  return (
    <>
      {Children.map(children, (child, i) => {
        if (!isValidElement(child)) return null;
        return (
          <AnimatedListItem key={child.key || i} index={i}>
            {child}
          </AnimatedListItem>
        );
      })}
    </>
  );
}

export default AnimatedList;
