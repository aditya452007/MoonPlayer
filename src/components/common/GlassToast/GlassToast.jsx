import { m } from 'framer-motion';
import { CheckCircle, Info, WarningCircle } from '@phosphor-icons/react';
import './GlassToast.css';

const ICONS = {
  success: <CheckCircle size={20} weight="fill" style={{ color: 'var(--primary)' }} />,
  error: <WarningCircle size={20} weight="fill" style={{ color: '#ef4444' }} />,
  default: <Info size={20} weight="fill" style={{ color: 'var(--text-secondary)' }} />,
};

export function GlassToast({ message, type, isMobile }) {
  const icon = ICONS[type] || ICONS.default;

  return (
    <m.div
      layout
      initial={{ opacity: 0, y: isMobile ? 30 : -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: isMobile ? 15 : -20, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      className="glass-toast"
    >
      <div className="glass-toast__icon">
        {icon}
      </div>
      <div className="glass-toast__message">
        {message}
      </div>
    </m.div>
  );
}

