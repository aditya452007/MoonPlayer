import { useToastStore } from '../../store/toastStore';

class ShareServiceImpl {
  /**
   * Internal helper to handle the actual sharing logic via Web Share API or Clipboard
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
      // Fallback for browsers that don't support navigator.share (e.g. desktop Chrome sometimes)
      this._fallbackCopyToClipboard(url);
    }
  }

  async _fallbackCopyToClipboard(text) {
    const { addToast } = useToastStore.getState();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        addToast('Link copied to clipboard!', 'success');
      } else {
        // Very old browsers fallback
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        addToast('Link copied to clipboard!', 'success');
      }
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
      addToast('Failed to copy link', 'error');
    }
  }

  /**
   * Generates a link and shares a track
   * @param {Object} track - The track to share
   */
  shareTrack(track) {
    // Generate web-playable link using HashRouter's structure
    // Example: https://moonplayer.app/#/song/123
    const url = new URL(window.location.href);
    url.hash = `/song/${track.id}`;
    
    // We can also inject the custom protocol link if needed later
    // const deepLink = `moonplayer://song/${track.id}`;

    this._handleShare(
      `Listen to ${track.title} by ${track.artistNames[0]}`,
      `Check out this song on MoonPlayer!`,
      url.toString()
    );
  }

  /**
   * Generates a link and shares a playlist
   * @param {Object} playlist - The playlist to share
   */
  sharePlaylist(playlist) {
    const url = new URL(window.location.href);
    url.hash = `/playlist/${playlist.id}`;
    
    this._handleShare(
      `Listen to playlist: ${playlist.name}`,
      `Check out this playlist on MoonPlayer!`,
      url.toString()
    );
  }
}

export const shareService = new ShareServiceImpl();
