import { AnimatePresence } from 'framer-motion';
import { useToastStore } from '../../../store/toastStore';
import { GlassToast } from './GlassToast';
import { usePlayerStore } from '../../../store/playerStore';
import { useBreakpoint } from '../../../hooks/useBreakpoint';

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const { isMobile } = useBreakpoint();

  const isTrackActive = !!currentTrack;

  const containerStyle = isMobile
    ? {
        position: 'fixed',
        bottom: isTrackActive
          ? 'calc(80px + env(safe-area-inset-bottom, 0px) + var(--mini-player-height) + 12px)'
          : 'calc(80px + env(safe-area-inset-bottom, 0px) + 12px)',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column-reverse',
        alignItems: 'center',
        gap: '10px',
        zIndex: 999999,
        pointerEvents: 'none',
        width: 'max-content',
        maxWidth: '90vw',
        transition: 'bottom var(--duration-normal) var(--ease-default)'
      }
    : {
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 24px)', // Elite Dynamic HUD position
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        zIndex: 999999,
        pointerEvents: 'none',
        width: 'max-content',
        maxWidth: '90vw'
      };

  return (
    <div style={containerStyle}>
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <GlassToast 
            key={toast.id} 
            message={toast.message} 
            type={toast.type} 
            isMobile={isMobile}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

