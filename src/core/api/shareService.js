import { useToastStore } from '../../store/toastStore';

class ShareServiceImpl {
  /**
   * Internal helper to handle the actual sharing logic via Web Share API or Clipboard.
   * @param {string} title 
   * @param {string} text 
   * @param {string} url 
   */
  async _handleShare(title, text, url) {
    const { addToast } = useToastStore.getState();

    // Check if Web Share API is available and supported for this payload
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url
        });
        addToast('Shared successfully!', 'success');
        return;
      } catch (error) {
        // AbortError is thrown when user cancels the share sheet, which is normal
        if (error.name !== 'AbortError') {
          console.error('Error sharing via Web Share API:', error);
          this._fallbackCopyToClipboard(url);
        }
      }
    } else {
      // Fallback for browsers that don't support navigator.share
      this._fallbackCopyToClipboard(url);
    }
  }

  /**
   * Safely writes text to the system clipboard, warning about HTTPS secure contexts on HTTP origins.
   * @param {string} text - URL link to copy
   */
  async _fallbackCopyToClipboard(text) {
    const { addToast } = useToastStore.getState();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        addToast('Link copied to clipboard!', 'success');
      } else {
        const isSecure = window.isSecureContext;
        if (!isSecure) {
          console.warn('Clipboard writeText API requires an HTTPS secure context.');
        }

        // Legacy / insecure context fallback
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = 'fixed'; // Avoid scrolling
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          addToast('Link copied to clipboard!', 'success');
        } else {
          throw new Error('execCommand copy returned false');
        }
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      const isSecure = window.isSecureContext;
      const msg = isSecure ? 'Failed to copy link' : 'Failed to copy link (HTTPS required)';
      addToast(msg, 'error');
    }
  }

  /**
   * Generates a clean URL link from a hash segment (High: canonical URL fix).
   * Maps localhost dynamically during testing.
   * @param {string} hash - Route hash segment (e.g. '/song/123')
   * @returns {string}
   */
  _buildShareUrl(hash) {
    let base = 'https://moonplayer.app';
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      base = window.location.origin;
    }
    return `${base}/#${hash}`;
  }

  /**
   * Generates a link and shares a track
   * @param {import('../../store/libraryStore').Track} track - The track to share
   */
  shareTrack(track) {
    if (!track) return;
    const shareUrl = this._buildShareUrl(`/song/${track.id}`);
    const artist = track.artistNames?.[0] || 'Unknown Artist';

    this._handleShare(
      `Listen to ${track.title} by ${artist}`,
      `Check out this song on MoonPlayer!`,
      shareUrl
    );
  }

  /**
   * Generates a link and shares a playlist
   * @param {import('../../store/libraryStore').Playlist} playlist - The playlist to share
   */
  sharePlaylist(playlist) {
    if (!playlist) return;
    const shareUrl = this._buildShareUrl(`/playlist/${playlist.id}`);
    
    this._handleShare(
      `Listen to playlist: ${playlist.name}`,
      `Check out this playlist on MoonPlayer!`,
      shareUrl
    );
  }
}

export const shareService = new ShareServiceImpl();
