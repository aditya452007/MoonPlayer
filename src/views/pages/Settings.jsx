import { useEffect } from 'react';
import { PageTransition } from '../../components/layout/PageTransition/PageTransition';
import { SolidPanel } from '../../components/common/SolidPanel/SolidPanel';
import { Button } from '../../components/common/Button/Button';
import { usePreferenceStore } from '../../store/preferenceStore';

export function Settings() {
  const { dataSaverEnabled, updatePreference, isHydrated } = usePreferenceStore();

  if (!isHydrated) {
    return <div>Loading settings...</div>;
  }

  return (
    <PageTransition>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: 'var(--space-4)' }}>
        <h1 style={{ marginBottom: 'var(--space-6)' }}>Settings</h1>
        
        <SolidPanel style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 var(--space-2) 0' }}>Data Saver</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                Limits audio quality to 96kbps and disables visualizers to save bandwidth.
              </p>
            </div>
            <Button 
              variant={dataSaverEnabled ? 'primary' : 'secondary'}
              onClick={() => updatePreference('dataSaverEnabled', !dataSaverEnabled)}
            >
              {dataSaverEnabled ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        </SolidPanel>
        
        <p style={{ marginTop: 'var(--space-6)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          Test instruction: Toggle the Data Saver button, then reload the page. The state should persist via Dexie.js.
        </p>
      </div>
    </PageTransition>
  );
}
