import { useState, useEffect } from 'react';

/**
 * Custom hook to detect the current screen size based on breakpoints.
 * Returns boolean flags for rendering conditional layouts.
 * 
 * Breakpoints:
 * - Mobile: < 768px
 * - Tablet: >= 768px and < 1024px
 * - Desktop: >= 1024px
 */
export function useBreakpoint() {
  const [breakpoints, setBreakpoints] = useState(() => {
    if (typeof window === 'undefined') {
      return { isMobile: false, isTablet: false, isDesktop: false };
    }
    return {
      isMobile: window.matchMedia('(max-width: 767px)').matches,
      isTablet: window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches,
      isDesktop: window.matchMedia('(min-width: 1024px)').matches,
    };
  });

  useEffect(() => {
    // Initializing queries
    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const tabletQuery = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
    const desktopQuery = window.matchMedia('(min-width: 1024px)');

    // Handler to update state
    const updateBreakpoints = () => {
      setBreakpoints({
        isMobile: mobileQuery.matches,
        isTablet: tabletQuery.matches,
        isDesktop: desktopQuery.matches,
      });
    };

    // Set initial values
    updateBreakpoints();

    // Listen for changes
    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener('change', updateBreakpoints);
      tabletQuery.addEventListener('change', updateBreakpoints);
      desktopQuery.addEventListener('change', updateBreakpoints);
    } else {
      // Fallback for older Safari
      mobileQuery.addListener(updateBreakpoints);
      tabletQuery.addListener(updateBreakpoints);
      desktopQuery.addListener(updateBreakpoints);
    }

    return () => {
      if (mobileQuery.removeEventListener) {
        mobileQuery.removeEventListener('change', updateBreakpoints);
        tabletQuery.removeEventListener('change', updateBreakpoints);
        desktopQuery.removeEventListener('change', updateBreakpoints);
      } else {
        // Fallback for older Safari
        mobileQuery.removeListener(updateBreakpoints);
        tabletQuery.removeListener(updateBreakpoints);
        desktopQuery.removeListener(updateBreakpoints);
      }
    };
  }, []);

  return breakpoints;
}
