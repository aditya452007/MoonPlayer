import { useDownloadStore } from '../../../store/downloadStore';
import { DownloadProgress } from '../DownloadProgress/DownloadProgress';
import { DownloadSimple } from '@phosphor-icons/react';
import './DownloadQueuePanel.css';

export function DownloadQueuePanel() {
  const activeDownloads = useDownloadStore(s => s.activeDownloads);
  const clearCompleted = useDownloadStore(s => s.clearCompleted);

  const hasCompleted = activeDownloads.some(d => d.status === 'completed' || d.status === 'failed');

  return (
    <div className="download-queue-panel">
      <div className="download-queue-panel__header">
        <h3 className="download-queue-panel__title">
          <DownloadSimple size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Downloads
        </h3>
        {hasCompleted && (
          <div className="download-queue-panel__actions">
            <button
              type="button"
              className="download-queue-panel__clear-btn"
              onClick={clearCompleted}
            >
              Clear finished
            </button>
          </div>
        )}
      </div>

      {activeDownloads.length === 0 ? (
        <p className="download-queue-panel__empty">No active downloads</p>
      ) : (
        <div className="download-queue-panel__list">
          {activeDownloads.map(task => (
            <DownloadProgress key={task.taskId} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

export default DownloadQueuePanel;
