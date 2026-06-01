import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const scrollPositions = {};

export function useScrollRestoration(scrollContainerRef) {
  const location = useLocation();

  useEffect(() => {
    const el = scrollContainerRef?.current;
    if (!el) return;

    const key = location.pathname + location.search;

    if (scrollPositions[key] !== undefined) {
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollPositions[key];
        }
      });
    }

    return () => {
      if (el) {
        scrollPositions[key] = el.scrollTop;
      }
    };
  }, [location.pathname, location.search, scrollContainerRef]);
}
