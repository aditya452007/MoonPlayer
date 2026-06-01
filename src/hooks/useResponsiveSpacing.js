import { useBreakpoint } from './useBreakpoint';

const SCALES = {
  mobile: {
    sectionGap: 'var(--section-gap-compact)',
    gridGap: 'var(--grid-gap-compact)',
    listGap: 'var(--list-gap-compact)',
    cardPadding: 'var(--card-padding-compact)',
    pagePadding: 'var(--page-padding)',
  },
  desktop: {
    sectionGap: 'var(--section-gap)',
    gridGap: 'var(--grid-gap)',
    listGap: 'var(--list-gap)',
    cardPadding: 'var(--card-padding)',
    pagePadding: 'var(--page-padding-tablet)',
  },
};

export function useResponsiveSpacing() {
  const { isMobile } = useBreakpoint();
  return isMobile ? SCALES.mobile : SCALES.desktop;
}
