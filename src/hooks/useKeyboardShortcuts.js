import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { usePreferenceStore } from '../store/preferenceStore';
import { useToastStore } from '../store/toastStore';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const [showShortcutOverlay, setShowShortcutOverlay] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input or textarea
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) {
        return;
      }

      const playerAPI = usePlayerStore.getState();
      const libraryAPI = useLibraryStore.getState();
      const prefAPI = usePreferenceStore.getState();
      const toastAPI = useToastStore.getState();

      const { currentTrack } = playerAPI;

      // Handle modifiers (Ctrl or Meta for Mac)
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          if (currentTrack) {
            if (playerAPI.isPlaying) playerAPI.pause();
            else playerAPI.resume();
          }
          break;
        case 'arrowright':
          e.preventDefault();
          if (currentTrack) playerAPI.seek(playerAPI.progress + 10);
          break;
        case 'arrowleft':
          e.preventDefault();
          if (currentTrack) playerAPI.seek(Math.max(0, playerAPI.progress - 10));
          break;
        case 'arrowup':
          e.preventDefault();
          playerAPI.setVolume(Math.min(1, playerAPI.volume + 0.1));
          break;
        case 'arrowdown':
          e.preventDefault();
          playerAPI.setVolume(Math.max(0, playerAPI.volume - 0.1));
          break;
        case 'm':
          e.preventDefault();
          playerAPI.toggleMute();
          break;
        case 'f':
          e.preventDefault();
          playerAPI.toggleFullscreen();
          break;
        case 'l':
          if (isCtrlOrCmd) {
            // Ctrl+L: Go to search
            e.preventDefault();
            navigate('/search');
            // Try to focus search bar if it exists
            setTimeout(() => {
              const searchInput = document.querySelector('input[type="text"]');
              if (searchInput) searchInput.focus();
            }, 100);
          } else {
            e.preventDefault();
            playerAPI.toggleLyrics();
          }
          break;
        case 'r':
          if (!isCtrlOrCmd) {
            e.preventDefault();
            playerAPI.toggleLoop();
          }
          break;
        case 'n':
          if (isCtrlOrCmd) {
            // Ctrl+N: New playlist
            e.preventDefault();
            const name = window.prompt('Enter new playlist name:');
            if (name && name.trim()) {
              libraryAPI.createPlaylist(name.trim());
              toastAPI.addToast(`Playlist "${name}" created`, 'success');
            }
          } else {
            if (e.shiftKey) {
              e.preventDefault();
              playerAPI.prev();
            } else {
              e.preventDefault();
              playerAPI.next();
            }
          }
          break;
        case 's':
          if (isCtrlOrCmd) {
            // Ctrl+S: Save/like song
            e.preventDefault();
            if (currentTrack) {
              libraryAPI.toggleLikeTrack(currentTrack);
              const isLiked = !libraryAPI.likedSongs.some((t) => t.id === currentTrack.id);
              toastAPI.addToast(isLiked ? 'Added to Liked Songs' : 'Removed from Liked Songs', 'info');
            }
          } else {
            e.preventDefault();
            playerAPI.shuffleQueue();
          }
          break;
        case 'q':
          e.preventDefault();
          playerAPI.toggleQueueVisibility();
          break;
        case 'p':
          e.preventDefault();
          prefAPI.updatePreference('petEnabled', !prefAPI.petEnabled);
          toastAPI.addToast(`Pet ${!prefAPI.petEnabled ? 'enabled' : 'disabled'}`, 'info');
          break;
        case '?':
          e.preventDefault();
          setShowShortcutOverlay((prev) => !prev);
          break;
        case '+':
        case '=':
          e.preventDefault();
          playerAPI.setVolume(Math.min(1, playerAPI.volume + 0.1));
          break;
        case '-':
        case '_':
          e.preventDefault();
          playerAPI.setVolume(Math.max(0, playerAPI.volume - 0.1));
          break;
        default:
          // 1-9 for percentage jump
          if (!isNaN(e.key) && e.key !== '0' && e.key !== ' ') {
            if (currentTrack && currentTrack.duration) {
              const percent = parseInt(e.key, 10) * 10;
              const targetSeconds = (currentTrack.duration * percent) / 100;
              playerAPI.seek(targetSeconds);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return { showShortcutOverlay, setShowShortcutOverlay };
}
