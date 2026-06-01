import { X, CheckCircle, Warning } from '@phosphor-icons/react';
import { useDownloadStore } from '../../../store/downloadStore';
import { ImgWithFallback } from '../ImgWithFallback/ImgWithFallback';
import './DownloadProgress.css';

export function DownloadProgress({ task }) {
  const cancelDownload = useDownloadStore(s => s.cancelDownload);

  const { track, status, progress, message, taskId } = task;

  return (
    <div className="download-progress">
      <ImgWithFallback
        src={track.imageUrl}
        alt={track.title}
        className="download-progress__cover"
        fallbackSrc="/default-album-art.png"
      />

      <div className="download-progress__info">
        <p className="download-progress__title">{track.title}</p>
        <p className="download-progress__artist">{track.artistNames?.join(', ')}</p>

        {status === 'downloading' && (
          <div className="download-progress__bar-row">
            <div className="download-progress__bar-track">
              <div
                className="download-progress__bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="download-progress__pct">{progress}%</span>
          </div>
        )}

        {status === 'queued' && (
          <p className="download-progress__status download-progress__status--queued">Queued</p>
        )}
        {status === 'completed' && (
          <p className="download-progress__status download-progress__status--completed">Downloaded</p>
        )}
        {status === 'failed' && (
          <p className="download-progress__status download-progress__status--failed">
            {message || 'Failed'}
          </p>
        )}
      </div>

      <div className="download-progress__actions">
        {status === 'completed' && (
          <CheckCircle size={20} color="var(--accent-secondary)" weight="fill" />
        )}
        {status === 'failed' && (
          <Warning size={20} color="#f87171" weight="fill" />
        )}
        {(status === 'queued' || status === 'downloading') && (
          <button
            type="button"
            className="download-progress__action-btn"
            aria-label="Cancel download"
            onClick={() => cancelDownload(taskId)}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

export default DownloadProgress;
