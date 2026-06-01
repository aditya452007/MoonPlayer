import { create } from 'zustand';
import { db } from '../core/db/schema';
import { useToastStore } from './toastStore';

const MAX_CONCURRENT = 3;

async function performDownload(task, onProgress, onComplete, onFail) {
  try {
    const response = await fetch(task.track.streamUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      const pct = contentLength > 0 ? Math.round((received / contentLength) * 100) : 0;
      onProgress(pct);
    }

    const blob = new Blob(chunks, { type: 'audio/mpeg' });
    await db.downloads.put({
      id: task.track.id,
      trackId: task.track.id,
      track: task.track,
      blob,
      downloadedAt: Date.now(),
    });
    onComplete();
  } catch (err) {
    onFail(err.message || 'Download failed');
  }
}

export const useDownloadStore = create((set, get) => ({
  activeDownloads: [],
  downloadedTrackIds: new Set(),

  hydrate: async () => {
    try {
      const rows = await db.downloads.toArray();
      const ids = new Set(rows.map(r => r.trackId));
      set({ downloadedTrackIds: ids });
    } catch (err) {
      console.error('downloadStore.hydrate failed:', err);
    }
  },

  isDownloaded: (trackId) => get().downloadedTrackIds.has(trackId),

  enqueueDownload: (track) => {
    if (!track) return;
    const state = get();
    if (state.isDownloaded(track.id)) {
      useToastStore.getState().addToast('Already downloaded', 'info');
      return;
    }
    const already = state.activeDownloads.find(d => d.track.id === track.id);
    if (already) {
      useToastStore.getState().addToast('Already in download queue', 'info');
      return;
    }
    const taskId = crypto.randomUUID();
    const task = { taskId, track, status: 'queued', progress: 0, message: '' };
    set(s => ({ activeDownloads: [...s.activeDownloads, task] }));
    useToastStore.getState().addToast(`Queued: ${track.title}`, 'info');
    setTimeout(() => get()._processQueue(), 0);
  },

  cancelDownload: (taskId) => {
    set(s => ({
      activeDownloads: s.activeDownloads.filter(d => d.taskId !== taskId),
    }));
  },

  removeDownloaded: async (trackId) => {
    try {
      await db.downloads.delete(trackId);
      set(s => {
        const ids = new Set(s.downloadedTrackIds);
        ids.delete(trackId);
        return { downloadedTrackIds: ids };
      });
    } catch (err) {
      console.error('removeDownloaded failed:', err);
    }
  },

  clearCompleted: () => {
    set(s => ({
      activeDownloads: s.activeDownloads.filter(d => d.status !== 'completed' && d.status !== 'failed' && d.status !== 'cancelled'),
    }));
  },

  _updateTask: (taskId, patch) => {
    set(s => ({
      activeDownloads: s.activeDownloads.map(d =>
        d.taskId === taskId ? { ...d, ...patch } : d
      ),
    }));
  },

  _processQueue: () => {
    const { activeDownloads, _startDownload } = get();
    const downloading = activeDownloads.filter(d => d.status === 'downloading').length;
    const queued = activeDownloads.filter(d => d.status === 'queued');
    if (downloading >= MAX_CONCURRENT || queued.length === 0) return;
    const batch = queued.slice(0, MAX_CONCURRENT - downloading);
    batch.forEach(task => _startDownload(task));
  },

  _startDownload: (task) => {
    const { _updateTask, _processQueue } = get();
    _updateTask(task.taskId, { status: 'downloading' });

    performDownload(
      task,
      (pct) => _updateTask(task.taskId, { progress: pct, status: 'downloading' }),
      () => {
        _updateTask(task.taskId, { status: 'completed', progress: 100 });
        set(s => {
          const ids = new Set(s.downloadedTrackIds);
          ids.add(task.track.id);
          return { downloadedTrackIds: ids };
        });
        useToastStore.getState().addToast(`Downloaded: ${task.track.title}`, 'success');
        setTimeout(_processQueue, 200);
      },
      (errMsg) => {
        _updateTask(task.taskId, { status: 'failed', message: errMsg });
        useToastStore.getState().addToast(`Download failed: ${task.track.title}`, 'error');
        setTimeout(_processQueue, 200);
      },
    );
  },
}));
