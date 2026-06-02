import { useState, useEffect } from 'react';
import { bootstrapper } from '../../../core/bootstrap';
import './BootstrapGate.css';

const PHASE_LABELS = {
  db: 'Opening database...',
  preferences: 'Loading preferences...',
  library: 'Loading library...',
  likes: 'Loading likes...',
  history: 'Loading history...',
  usage: 'Loading usage data...',
  player: 'Restoring playback state...',
  audio: 'Initializing audio...',
  queue: 'Preparing queue...',
  recommendations: 'Warming recommendations...',
  sw: 'Registering service worker...',
  done: 'Ready!',
};

export function BootstrapGate({ children }) {
  const [phase, setPhase] = useState('db');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    bootstrapper.setProgressCallback((currentPhase) => {
      setPhase(currentPhase);
    });

    bootstrapper.boot()
      .then(() => setReady(true))
      .catch((err) => {
        console.error('Bootstrapping failed:', err);
        setReady(true);
      });
  }, []);

  if (ready) return children;

  return (
    <div className="bootstrap-gate">
      <div className="bootstrap-gate__content">
        <div className="bootstrap-gate__spinner" />
        <p className="bootstrap-gate__label">{PHASE_LABELS[phase] || 'Loading...'}</p>
      </div>
    </div>
  );
}
