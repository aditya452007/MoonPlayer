import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, MusicNotes, Trash, ShareNetwork } from '@phosphor-icons/react';
import { PageTransition } from '../../components/layout/PageTransition/PageTransition';
import { TrackRow } from '../../components/common/TrackRow/TrackRow';
import { useLibraryStore } from '../../store/libraryStore';
import { usePlayerStore } from '../../store/playerStore';
import { useToastStore } from '../../store/toastStore';
import { shareService } from '../../core/api/shareService';
import { Button } from '../../components/common/Button/Button';
import { IconButton } from '../../components/common/IconButton/IconButton';
import { AnimatePresence, m } from 'framer-motion';
import './PlaylistView.css';

/**
 * PlaylistView Page Component
 * Renders tracks within a specific playlist (Liked Songs, Recently Played, or custom).
 * Memoizes playlist derivation to prevent redundant allocations and handles safe sharing.
 */
export function PlaylistView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playlists, likedSongs, recentlyPlayed, deletePlaylist } = useLibraryStore();
  const { play, addToQueue, clearQueue } = usePlayerStore();
  const addToast = useToastStore((state) => state.addToast);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Memoize playlist selection from library parameters
  const playlist = useMemo(() => {
    if (id === 'liked_songs') {
      return { id, name: 'Liked Songs', tracks: likedSongs };
    } else if (id === 'recently_played') {
      return { id, name: 'Recently Played', tracks: recentlyPlayed };
    } else {
      return playlists.find(p => p.id === id) || null;
    }
  }, [id, playlists, likedSongs, recentlyPlayed]);

  useEffect(() => {
    if (!playlist) {
      navigate('/library');
    }
  }, [playlist, navigate]);

  // Support escape key closure for delete modal
  useEffect(() => {
    if (!isDeleteModalOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsDeleteModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDeleteModalOpen]);

  if (!playlist) return null;

  const handlePlayAll = () => {
    if (playlist.tracks.length === 0) return;
    clearQueue();
    addToQueue(playlist.tracks);
    play(playlist.tracks[0]);
  };
  
  const confirmDelete = () => {
    deletePlaylist(playlist.id);
    navigate('/library');
  };

  const handleShare = async () => {
    try {
      await shareService.sharePlaylist(playlist);
    } catch (error) {
      console.error('Failed to share playlist:', error);
      addToast('Playlist sharing is not supported or failed', 'error');
    }
  };

  const coverImage = playlist.tracks.length > 0 && playlist.tracks[0].imageUrl 
    ? playlist.tracks[0].imageUrl 
    : null;

  return (
    <PageTransition>
      <div className="playlist-view">
        <div className="playlist-view__header">
          {coverImage ? (
            <img src={coverImage} alt={playlist.name} className="playlist-view__cover" />
          ) : (
            <div className="playlist-view__cover">
              <MusicNotes size={64} className="playlist-view__cover-placeholder" />
            </div>
          )}
          
          <div className="playlist-view__info">
            <div className="playlist-view__type">Playlist</div>
            <h1 className="playlist-view__title">{playlist.name}</h1>
            <div className="playlist-view__meta">
              {playlist.tracks.length} {playlist.tracks.length === 1 ? 'song' : 'songs'}
            </div>
          </div>
        </div>

        <div className="playlist-view__controls">
          <button type="button" 
            className="playlist-view__play-btn" 
            onClick={handlePlayAll}
            disabled={playlist.tracks.length === 0}
            aria-label="Play playlist"
          >
            <Play weight="fill" size={28} />
          </button>
          
          <IconButton 
            icon={ShareNetwork} 
            size="lg" 
            onClick={handleShare}
            ariaLabel="Share playlist"
          />
          
          {id !== 'liked_songs' && id !== 'recently_played' && (
            <IconButton 
              icon={Trash} 
              size="lg" 
              onClick={() => setIsDeleteModalOpen(true)}
              ariaLabel="Delete playlist"
            />
          )}
        </div>

        <div className="playlist-view__tracks">
          {playlist.tracks.length === 0 ? (
            <div className="playlist-view__empty">
              <p>This playlist is empty.</p>
            </div>
          ) : (
            playlist.tracks.map((track, idx) => (
              <TrackRow 
                key={`${track.id}-${idx}`} 
                track={track} 
                index={idx} 
                showImage={true} 
              />
            ))
          )}
        </div>
      </div>

      {/* Custom delete confirmation modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="playlist-view__modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
            <m.div 
              className="playlist-view__modal glass-panel"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-modal-title"
            >
              <h3 id="delete-modal-title" className="playlist-view__modal-title">Delete Playlist</h3>
              <p className="playlist-view__modal-text">
                Are you sure you want to delete "{playlist.name}"? This action cannot be undone.
              </p>
              <div className="playlist-view__modal-actions">
                <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  className="playlist-view__btn--danger" 
                  onClick={confirmDelete}
                >
                  Delete
                </Button>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
