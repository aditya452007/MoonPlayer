import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../../components/layout/PageTransition/PageTransition';
import { useLibraryStore } from '../../store/libraryStore';
import { SolidPanel } from '../../components/common/SolidPanel/SolidPanel';
import { Heart, Playlist, Plus, ClockCounterClockwise } from '@phosphor-icons/react';
import { Button } from '../../components/common/Button/Button';
import { AnimatePresence, m } from 'framer-motion';
import './Library.css';

/**
 * Library Page Page Component
 * Allows users to view liked tracks, recently played, custom playlists,
 * and create custom playlists using a beautiful, keyboard-accessible modal.
 */
export function Library() {
  const navigate = useNavigate();
  const { 
    playlists, 
    likedSongs, 
    recentlyPlayed, 
    hydrate, 
    isHydrated, 
    createPlaylist,
    hydrationError 
  } = useLibraryStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  useEffect(() => {
    if (!isHydrated) {
      hydrate();
    }
  }, [hydrate, isHydrated]);

  // Support closing modal on pressing Escape key
  useEffect(() => {
    if (!isCreateModalOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsCreateModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateModalOpen]);

  const handleCreatePlaylistSubmit = (e) => {
    if (e) e.preventDefault();
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setIsCreateModalOpen(false);
    }
  };

  if (hydrationError) {
    return (
      <PageTransition>
        <div className="library-page library-page--error">
          <h2>Failed to load library</h2>
          <p style={{ color: 'var(--error)', margin: 'var(--space-2) 0 var(--space-6)', fontSize: 'var(--text-sm)' }}>
            {hydrationError}
          </p>
          <Button variant="primary" onClick={hydrate}>Retry</Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="library-page">
        <header className="library-page__header">
          <h1 className="library-page__title">Your Library</h1>
          <Button variant="primary" icon={Plus} onClick={() => setIsCreateModalOpen(true)}>
            New Playlist
          </Button>
        </header>

        {!isHydrated ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading library…</div>
        ) : (
          <>
            <section className="library-page__section">
              <div className="library-page__grid">
                
                {/* Liked Songs Card */}
                <SolidPanel 
                  interactive 
                  className="playlist-card"
                  onClick={() => navigate('/playlist/liked_songs')}
                >
                  <div className="playlist-card__image-container playlist-card__image-container--liked">
                    <Heart weight="fill" className="playlist-card__icon" />
                  </div>
                  <div className="playlist-card__info">
                    <h4 className="playlist-card__title">Liked Songs</h4>
                    <p className="playlist-card__meta">{likedSongs.length} tracks</p>
                  </div>
                </SolidPanel>

                {/* Recently Played Card */}
                <SolidPanel 
                  interactive 
                  className="playlist-card"
                  onClick={() => navigate('/playlist/recently_played')}
                >
                  <div className="playlist-card__image-container" style={{ backgroundColor: 'var(--bg-highlight)' }}>
                    <ClockCounterClockwise weight="bold" className="playlist-card__icon" />
                  </div>
                  <div className="playlist-card__info">
                    <h4 className="playlist-card__title">Recently Played</h4>
                    <p className="playlist-card__meta">{recentlyPlayed.length} tracks</p>
                  </div>
                </SolidPanel>

                {/* Custom Playlists */}
                {playlists.map((playlist) => (
                  <SolidPanel 
                    interactive 
                    key={playlist.id} 
                    className="playlist-card"
                    onClick={() => navigate(`/playlist/${playlist.id}`)}
                  >
                    <div className="playlist-card__image-container">
                      <Playlist weight="light" className="playlist-card__icon" />
                    </div>
                    <div className="playlist-card__info">
                      <h4 className="playlist-card__title">{playlist.name}</h4>
                      <p className="playlist-card__meta">{playlist.tracks?.length || 0} tracks</p>
                    </div>
                  </SolidPanel>
                ))}
              </div>
            </section>

            {playlists.length === 0 && likedSongs.length === 0 && (
              <div className="library-page__empty">
                <Playlist size={48} weight="light" />
                <h3>Your library is empty</h3>
                <p>Save songs by tapping the heart icon, or create your first playlist.</p>
                <Button variant="secondary" onClick={() => setIsCreateModalOpen(true)}>
                  Create Playlist
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Playlist Creation Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="custom-modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
            <m.div 
              className="custom-modal glass-panel"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Create New Playlist Modal"
            >
              <h3>Create New Playlist</h3>
              <form onSubmit={handleCreatePlaylistSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Playlist name" 
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="custom-modal__input"
                  maxLength={50}
                />
                <div className="custom-modal__actions">
                  <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={!newPlaylistName.trim()}>
                    Create
                  </Button>
                </div>
              </form>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
