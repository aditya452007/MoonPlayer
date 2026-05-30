import { MusicService } from './MusicService';
import { useToastStore } from '../../store/toastStore';

class DownloadServiceImpl {
  /**
   * Downloads a track and saves it to the user's device.
   * Tracks download progress and dynamically determines MIME type / file extensions (High, Medium).
   * @param {import('../../store/libraryStore').Track} track - The track object to download
   */
  async downloadTrack(track) {
    if (!track) return;
    
    const { addToast, updateToast } = useToastStore.getState();
    const toastId = addToast(`Preparing download for ${track.title}...`, 'info', 0); // 0 means don't auto-dismiss

    try {
      // 1. Fetch highest quality stream URL
      const fullTrack = await MusicService.getTrackDetails(track.id, '320kbps', false);
      const url = fullTrack?.streamUrl;

      if (!url) {
        throw new Error("Download URL not found");
      }

      // 2. Fetch the stream as a blob to enable progress tracking and proper saving
      updateToast(toastId, { message: `Downloading ${track.title}... 0%` });

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stream (HTTP ${response.status})`);
      }

      // High: ReadableStream null check
      if (!response.body) {
        throw new Error('Streaming downloads are not supported by the browser response.');
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      
      let loaded = 0;
      const chunks = [];
      const reader = response.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks.push(value);
        loaded += value.length;

        if (total) {
          const progress = Math.round((loaded / total) * 100);
          updateToast(toastId, { message: `Downloading ${track.title}... ${progress}%` });
        }
      }

      // Medium: Detect MIME type and dynamic extension from Content-Type header
      const contentType = response.headers.get('content-type') || 'audio/mp4';
      let fileExt = '.m4a';
      if (contentType.includes('audio/mpeg') || contentType.includes('audio/mp3')) {
        fileExt = '.mp3';
      } else if (contentType.includes('audio/ogg')) {
        fileExt = '.ogg';
      } else if (contentType.includes('audio/wav')) {
        fileExt = '.wav';
      } else if (contentType.includes('audio/aac')) {
        fileExt = '.aac';
      }

      const blob = new Blob(chunks, { type: contentType });
      
      // 3. Trigger standard browser download
      // Medium: Guard artist names array securely to prevent formatting failures
      const firstArtist = track.artistNames?.filter(Boolean)[0] || 'Unknown Artist';
      this._saveToDisk(blob, `${track.title} - ${firstArtist}${fileExt}`);

      // 4. Update toast to success and auto-dismiss after 3s
      updateToast(toastId, { message: `Successfully downloaded ${track.title}!`, type: 'success' });
      
      setTimeout(() => {
        useToastStore.getState().removeToast(toastId);
      }, 3000);

    } catch (error) {
      console.error("Download failed:", error);
      updateToast(toastId, { 
        message: `Failed to download ${track.title}. ${error.message}`, 
        type: 'error' 
      });
      setTimeout(() => {
        useToastStore.getState().removeToast(toastId);
      }, 5000);
    }
  }

  /**
   * Internal method to trigger the download prompt.
   * Medium: Revokes object URLs on next microtask instead of fragile timeouts.
   * @param {Blob} blob 
   * @param {string} filename 
   */
  _saveToDisk(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Revoke and cleanup on next microtask tick safely
    queueMicrotask(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }
}

export const downloadService = new DownloadServiceImpl();
