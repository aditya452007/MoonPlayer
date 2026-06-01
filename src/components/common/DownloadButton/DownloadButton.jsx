import { m } from 'framer-motion';
import { DownloadSimple, Check, Spinner } from '@phosphor-icons/react';
import { useDownloadStore } from '../../../store/downloadStore';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

export function DownloadButton({ track, size = 'md', className = '' }) {
  const prefersReducedMotion = useReducedMotion();
  const enqueueDownload = useDownloadStore(s => s.enqueueDownload);
  const isDownloaded = useDownloadStore(s => s.isDownloaded);
  const activeDownloads = useDownloadStore(s => s.activeDownloads);

  const downloaded = isDownloaded(track?.id);
  const inQueue = activeDownloads.some(d => d.track?.id === track?.id && (d.status === 'queued' || d.status === 'downloading'));

  const handleDownload = (e) => {
    e.stopPropagation();
    if (!track || downloaded || inQueue) return;
    enqueueDownload(track);
  };

  const getButtonColor = () => {
    if (downloaded) return 'var(--accent-secondary)';
    if (inQueue) return 'var(--accent-moon)';
    return 'var(--text-secondary)';
  };

  return (
    <m.button
      type="button"
      className={`download-button ${className}`}
      onClick={handleDownload}
      whileTap={prefersReducedMotion ? undefined : ((!downloaded && !inQueue) ? { scale: 0.92 } : undefined)}
      aria-label={downloaded ? 'Downloaded' : inQueue ? 'Downloading' : 'Download'}
      style={{
        background: 'none',
        border: 'none',
        cursor: inQueue ? 'wait' : 'pointer',
        color: getButtonColor(),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
      }}
    >
      {!downloaded && !inQueue && (
        <DownloadSimple size={size === 'sm' ? 16 : 20} weight="regular" />
      )}
      {inQueue && (
        <m.div
          animate={prefersReducedMotion ? {} : { rotate: 360 }}
          transition={prefersReducedMotion ? { duration: 0 } : { repeat: Infinity, duration: 1, ease: 'linear' }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <Spinner size={size === 'sm' ? 16 : 20} weight="bold" />
        </m.div>
      )}
      {downloaded && (
        <m.div
          initial={prefersReducedMotion ? {} : { scale: 0, rotate: -90 }}
          animate={prefersReducedMotion ? {} : { scale: 1, rotate: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.26, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <Check size={size === 'sm' ? 16 : 20} weight="bold" />
        </m.div>
      )}
    </m.button>
  );
}
