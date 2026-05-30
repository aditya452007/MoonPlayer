import { DownloadSimple } from '@phosphor-icons/react';
import { IconButton } from '../IconButton/IconButton';
import { downloadService } from '../../../core/api/downloadService';

/**
 * A reusable button for downloading a track.
 */
export function DownloadButton({ track, size = 'md', className = '' }) {
  const handleDownload = (e) => {
    e.stopPropagation();
    downloadService.downloadTrack(track);
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

