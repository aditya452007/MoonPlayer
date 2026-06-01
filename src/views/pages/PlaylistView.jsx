import { useEffect, useMemo, useState, useRef } from 'react';
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
import { LayoutSwitch } from '../../components/common/LayoutSwitch/LayoutSwitch';
import { AnimatedList } from '../../components/common/AnimatedList/AnimatedList';
import { extractDominantColor } from '../../core/utils/colorExtractor';
import { BlurredBackground } from '../../components/common/BlurredBackground/BlurredBackground';
import { EmptyState } from '../../components/common/EmptyState/EmptyState';
import { AnimatePresence, m } from 'framer-motion';
import { DetailHeader } from '../../components/common/DetailHeader/DetailHeader';
import './PlaylistView.css';

export function PlaylistView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playlists, likedSongs, recentlyPlayed, deletePlaylist } = useLibraryStore();
  const { play, addToQueue, clearQueue } = usePlayerStore();
  const { addToast } = useToastStore();
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bgColor, setBgColor] = useState('rgb(26, 30, 37)');

  const abortControllerRef = useRef(null);

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

  // Extract cover art color dynamically
  useEffect(() => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const coverImage = playlist?.tracks?.length > 0 && playlist.tracks[0].imageUrl 
      ? playlist.tracks[0].imageUrl 
      : null;

    const updateColor = async () => {
      await Promise.resolve();
      if (signal.aborted) return;

      if (coverImage) {
        const color = await extractDominantColor(coverImage, signal);
        if (!signal.aborted) {
          setBgColor(color);
        }
      } else {
        setBgColor('rgb(26, 30, 37)');
      }
    };

    updateColor();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [playlist]);

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

  const headerContent = (
    <DetailHeader
      imageUrl={coverImage}
      title={playlist.name}
      subtitle="Playlist"
      metadata={`${playlist.tracks.length} ${playlist.tracks.length === 1 ? 'song' : 'songs'}`}
      fallbackImage="/default-album-art.png"
    />
  );

  const tracksContent = (
    <div className="playlist-view__tracks-inner">
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
          <EmptyState
            icon={MusicNotes}
            title="This playlist is empty"
            description="Add songs from Search or Recommendations page."
          />
        ) : (
          <AnimatedList>
            {playlist.tracks.map((track, idx) => (
              <TrackRow 
                key={`${track.id}-${idx}`} 
                track={track} 
                index={idx} 
                showImage={true} 
              />
            ))}
          </AnimatedList>
        )}
      </div>
    </div>
  );

  return (
    <PageTransition>
      <div className="playlist-view" style={{ '--extracted-color': bgColor }}>
        <BlurredBackground 
          imageUrl={coverImage}
          dominantColor={bgColor}
          blurPx={80}
          opacity={0.25}
          className="playlist-view__backdrop"
        />
        <LayoutSwitch
          mobile={
            <div className="playlist-view__container playlist-view__container--mobile">
              {headerContent}
              {tracksContent}
            </div>
          }
          desktop={
            <div className="playlist-view__container playlist-view__container--desktop">
              <div className="playlist-view__left">{headerContent}</div>
              <div className="playlist-view__right">{tracksContent}</div>
            </div>
          }
          threshold={750}
        />
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

export default PlaylistView;
