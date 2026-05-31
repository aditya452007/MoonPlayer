import { useMemo } from 'react';
import { useContainerWidth } from '../../../hooks/useContainerWidth';
import { calculateGridColumns } from '../../../core/utils/gridUtils';
import './ResponsiveGrid.css';

export function ResponsiveGrid({ children, minItemWidth = 180, gap = 16, className = '' }) {
  const { containerRef, width } = useContainerWidth();
  
  const { columns } = useMemo(() => {
    return calculateGridColumns(width || 800, minItemWidth, gap);
  }, [width, minItemWidth, gap]);

  const style = {
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: `${gap}px`
  };

  return (
    <div ref={containerRef} className={`responsive-grid ${className}`} style={style}>
      {children}
    </div>
  );
}

export default ResponsiveGrid;
