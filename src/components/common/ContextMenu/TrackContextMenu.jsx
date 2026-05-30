import { useState } from 'react';
import { Queue, Heart, ListPlus, PlayCircle, Plus, DownloadSimple, ShareNetwork } from '@phosphor-icons/react';
import { ContextMenu, ContextMenuItem, ContextMenuDivider } from './ContextMenu';
import { downloadService } from '../../../core/api/downloadService';
import { shareService } from '../../../core/api/shareService';
import { usePlayerStore } from '../../../store/playerStore';
import { useLibraryStore } from '../../../store/libraryStore';
import { Button } from '../Button/Button';

export function TrackContextMenu({ isOpen, onClose, x, y, track }) {
  const { playNext, addToQueue } = usePlayerStore();
  const { toggleLikeTrack, likedSongs, playlists, addTrackToPlaylist } = useLibraryStore();
  
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);

  const isLiked = likedSongs.some((t) => t.id === track.id);

  const handlePlayNext = () => {
    playNext(track);
    onClose();
  };

  const handleAddToQueue = () => {
    addToQueue(track);
    onClose();
  };

  const handleToggleLike = () => {
    toggleLikeTrack(track);
    onClose();
  };

  const handleAddToPlaylistClick = () => {
    setShowPlaylistSelector(true);
  };

  const handlePlaylistSelect = (playlistId) => {
    addTrackToPlaylist(playlistId, track);
    setShowPlaylistSelector(false);
    onClose();
  };

  const handleDownload = () => {
    downloadService.downloadTrack(track);
    onClose();
  };

  const handleShare = () => {
    shareService.shareTrack(track);
    onClose();
  };

  // If playlist selector is open, we can render a simple modal on top of the menu,
  // or we can just render the modal and keep the menu hidden.
  if (showPlaylistSelector) {
    return (
      <div 
        style={{
          position: 'fixed', inset: 0, zIndex: 9999, 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'
        }}
        onClick={() => {
          setShowPlaylistSelector(false);
          onClose();
        }}
      >
        <div 
          style={{
            backgroundColor: 'var(--bg-elevated)', padding: 'var(--space-6)',
            borderRadius: 'var(--radius-lg)', width: '90%', maxWidth: '400px',
            maxHeight: '70vh', overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>Add to Playlist</h3>
          {playlists.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>You don't have any custom playlists yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {playlists.map(p => (
                <button type="button"
                  key={p.id}
                  onClick={() => handlePlaylistSelect(p.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                    padding: 'var(--space-3)', width: '100%', background: 'var(--bg-highlight)',
                    border: 'none', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  <ListPlus size={20} />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          )}
          <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => {
              setShowPlaylistSelector(false);
              onClose();
            }}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ContextMenu isOpen={isOpen} onClose={onClose} x={x} y={y}>
      <ContextMenuItem 
        icon={PlayCircle} 
        label="Play Next" 
        onClick={handlePlayNext} 
      />
      <ContextMenuItem 
        icon={Queue} 
        label="Add to Queue" 
        onClick={handleAddToQueue} 
      />
      <ContextMenuDivider />
      <ContextMenuItem 
        icon={Heart} 
        label={isLiked ? "Remove from Liked Songs" : "Save to Liked Songs"} 
        onClick={handleToggleLike} 
      />
      <ContextMenuItem 
        icon={Plus} 
        label="Add to Playlist..." 
        onClick={handleAddToPlaylistClick} 
      />
      <ContextMenuDivider />
      <ContextMenuItem 
        icon={DownloadSimple} 
        label="Download" 
        onClick={handleDownload} 
      />
      <ContextMenuItem 
        icon={ShareNetwork} 
        label="Share" 
        onClick={handleShare} 
      />
    </ContextMenu>
  );
}

