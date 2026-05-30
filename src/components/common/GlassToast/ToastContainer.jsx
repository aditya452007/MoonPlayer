import { AnimatePresence } from 'framer-motion';
import { useToastStore } from '../../../store/toastStore';
import { GlassToast } from './GlassToast';

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '100px', // Above playbar
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        zIndex: 99999,
        pointerEvents: 'none'
      }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <GlassToast 
            key={toast.id} 
            message={toast.message} 
            type={toast.type} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
