import { useRef } from 'react';
import { PageTransition } from '../../components/layout/PageTransition/PageTransition';
import { Download } from '@phosphor-icons/react';
import { useScrollRestoration } from '../../hooks/useScrollRestoration';

export function Offline() {
  const scrollRef = useRef(null);
  useScrollRestoration(scrollRef);

  return (
    <PageTransition>
      <div ref={scrollRef} className="stub-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 'var(--space-4)', color: 'var(--text-secondary)', overflowY: 'auto' }}>
        <Download size={48} style={{ opacity: 0.3 }} />
        <h2>Offline</h2>
        <p>Downloaded tracks will appear here.</p>
      </div>
    </PageTransition>
  );
}

export default Offline;

