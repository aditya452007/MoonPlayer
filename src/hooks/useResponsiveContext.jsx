/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useMemo } from 'react';

export const BREAKPOINTS = {
  MOBILE: { start: 0, end: 480, name: 'mobile' },
  TABLET: { start: 481, end: 800, name: 'tablet' },
  DESKTOP: { start: 801, end: 1440, name: 'desktop' },
  WIDE: { start: 1441, end: Infinity, name: 'wide' },
};

const ResponsiveContext = createContext(null);

export function ResponsiveProvider({ children }) {
  const [width, setWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1440);

  useEffect(() => {
    let rafId;
    const handleResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => setWidth(window.innerWidth));
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const value = useMemo(() => {
    const bp = width <= BREAKPOINTS.MOBILE.end ? BREAKPOINTS.MOBILE
      : width <= BREAKPOINTS.TABLET.end ? BREAKPOINTS.TABLET
      : width <= BREAKPOINTS.DESKTOP.end ? BREAKPOINTS.DESKTOP
      : BREAKPOINTS.WIDE;

    return {
      width,
      breakpoint: bp.name,
      isMobile: bp.name === 'mobile',
      isTablet: bp.name === 'tablet',
      isDesktop: bp.name === 'desktop' || bp.name === 'wide',
      isWide: bp.name === 'wide',
      smallerOrEqualTo(size) {
        const order = ['mobile', 'tablet', 'desktop', 'wide'];
        return order.indexOf(bp.name) <= order.indexOf(size);
      },
      largerOrEqualTo(size) {
        const order = ['mobile', 'tablet', 'desktop', 'wide'];
        return order.indexOf(bp.name) >= order.indexOf(size);
      },
    };
  }, [width]);

  return (
    <ResponsiveContext.Provider value={value}>
      {children}
    </ResponsiveContext.Provider>
  );
}

export function useResponsive() {
  const ctx = useContext(ResponsiveContext);
  if (!ctx) throw new Error('useResponsive must be used within ResponsiveProvider');
  return ctx;
}
