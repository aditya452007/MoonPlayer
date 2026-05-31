import { useContainerWidth } from '../../../hooks/useContainerWidth';

export function LayoutSwitch({ mobile, desktop, threshold = 750, className = '' }) {
  const { containerRef, width } = useContainerWidth();
  
  const activeWidth = width || (typeof window !== 'undefined' ? window.innerWidth : 800);
  const isMobile = activeWidth < threshold;

  return (
    <div ref={containerRef} className={`layout-switch ${className}`} style={{ width: '100%' }}>
      {isMobile ? mobile : desktop}
    </div>
  );
}

export default LayoutSwitch;
