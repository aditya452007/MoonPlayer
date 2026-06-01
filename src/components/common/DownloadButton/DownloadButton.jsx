import { DownloadSimple, CheckCircle } from '@phosphor-icons/react';
import { IconButton } from '../IconButton/IconButton';
import { useDownloadStore } from '../../../store/downloadStore';

export function DownloadButton({ track, size = 'md', className = '' }) {
  const enqueueDownload = useDownloadStore(s => s.enqueueDownload);
  const isDownloaded = useDownloadStore(s => s.isDownloaded);
  const activeDownloads = useDownloadStore(s => s.activeDownloads);

  const downloaded = isDownloaded(track?.id);
  const inQueue = activeDownloads.some(d => d.track?.id === track?.id && (d.status === 'queued' || d.status === 'downloading'));

  const handleDownload = (e) => {
    e.stopPropagation();
    if (!track) return;
    enqueueDownload(track);
  };

  return (
    <IconButton
      icon={downloaded ? CheckCircle : DownloadSimple}
      size={size}
      onClick={handleDownload}
      ariaLabel={downloaded ? `${track?.title} downloaded` : `Download ${track?.title}`}
      className={className}
      style={{
        color: downloaded ? 'var(--accent-secondary)' : inQueue ? 'var(--accent-moon)' : undefined,
        opacity: inQueue ? 0.7 : 1,
      }}
    />
  );
}
