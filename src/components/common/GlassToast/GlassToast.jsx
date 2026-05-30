import { m } from 'framer-motion';
import { CheckCircle, Info, WarningCircle } from '@phosphor-icons/react';
import './GlassToast.css';

export function GlassToast({ message, type }) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} weight="fill" style={{ color: 'var(--primary)' }} />;
      case 'error':
        return <WarningCircle size={20} weight="fill" style={{ color: '#ef4444' }} />;
      default:
        return <Info size={20} weight="fill" style={{ color: 'var(--text-secondary)' }} />;
    }
  };

  return (
    <m.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="glass-toast"
    >
      <div className="glass-toast__icon">
        {getIcon()}
      </div>
      <div className="glass-toast__message">
        {message}
      </div>
    </m.div>
  );
}

