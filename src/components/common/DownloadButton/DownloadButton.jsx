import { DownloadSimple } from '@phosphor-icons/react';
import { IconButton } from '../IconButton/IconButton';
import { downloadService } from '../../../core/api/downloadService';

/**
 * A reusable button for downloading a track.
 */
export function DownloadButton({ track, size = 'md', className = '' }) {
  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      await downloadService.downloadTrack(track);
    } catch (err) {
      console.error('Failed to download track from button click:', err);
    }
  };

  return (
    <IconButton
      icon={DownloadSimple}
      size={size}
      onClick={handleDownload}
      ariaLabel={`Download ${track.title}`}
      className={className}
    />
  );
}

