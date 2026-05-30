import { MusicService } from './MusicService';
import { useToastStore } from '../../store/toastStore';

class DownloadServiceImpl {
  /**
   * Downloads a track and saves it to the user's device
   * @param {Object} track - The track object to download
   */
  async downloadTrack(track) {
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

      const blob = new Blob(chunks, { type: 'audio/mp4' }); // Assuming mp4/m4a wrapper standard for saavn streams
      
      // 3. Trigger standard browser download
      this._saveToDisk(blob, `${track.title} - ${track.artistNames[0]}.m4a`);

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
   * Internal method to trigger the download prompt
   */
  _saveToDisk(blob, filename) {
    // Web implementation
    // Future Phase 19: Check for Capacitor window.Capacitor?.isNativePlatform()
    // and use Capacitor Filesystem instead if native
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
}

export const downloadService = new DownloadServiceImpl();
