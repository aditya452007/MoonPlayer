import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../../components/layout/PageTransition/PageTransition';
import { useLibraryStore } from '../../store/libraryStore';
import { useDownloadStore } from '../../store/downloadStore';
import { PlaylistCard } from '../../components/common/PlaylistCard/PlaylistCard';
import { EmptyState } from '../../components/common/EmptyState/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton/LoadingSkeleton';
import { AnimatedListItem } from '../../components/common/AnimatedListItem/AnimatedListItem';
import { Playlist, Plus, MagnifyingGlass, Warning, X, DownloadSimple, Export } from '@phosphor-icons/react';
import { Button } from '../../components/common/Button/Button';
import { AnimatePresence, m, Reorder } from 'framer-motion';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { DownloadQueuePanel } from '../../components/common/DownloadQueuePanel/DownloadQueuePanel';
import { useScrollRestoration } from '../../hooks/useScrollRestoration';
import './Library.css';

export function Library() {
  const navigate = useNavigate();
  const { isDesktop } = useBreakpoint();
  const { 
    playlists, 
    likedSongs, 
    recentlyPlayed, 
    hydrate, 
    isHydrated, 
    createPlaylist,
    reorderPlaylists,
    hydrationError 
  } = useLibraryStore();
  const scrollRef = useRef(null);

  useScrollRestoration(scrollRef);
  const activeDownloads = useDownloadStore(s => s.activeDownloads);
  const [showDownloadPanel, setShowDownloadPanel] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    if (!isHydrated) {
      hydrate();
    }
  }, [hydrate, isHydrated]);

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

  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  if (hydrationError) {
    return (
      <PageTransition>
        <div className="library-page library-page--error">
          <EmptyState
            icon={Warning}
            title="Failed to load library"
            description={hydrationError}
            actionLabel="Retry"
            onAction={hydrate}
            variant="error"
          />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div ref={scrollRef} className="library-page" style={{ overflowY: 'auto', height: '100%' }}>
        <header className="library-page__header">
          <h1 className="library-page__title">Your Library</h1>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            {activeDownloads.length > 0 && (
              <button
                type="button"
                onClick={() => setShowDownloadPanel(!showDownloadPanel)}
                style={{
                  background: 'none', border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)', padding: '6px 12px',
                  color: 'var(--accent-moon)', cursor: 'pointer',
                  fontSize: 'var(--text-xs)', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                <DownloadSimple size={16} />
                {activeDownloads.filter(d => d.status === 'downloading').length > 0
                  ? `${activeDownloads.filter(d => d.status === 'downloading').length} downloading`
                  : `${activeDownloads.length} queued`}
              </button>
            )}
            <Button variant="secondary" icon={Export} onClick={() => navigate('/import-export')}>
              Import/Export
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => setIsCreateModalOpen(true)}>
              New Playlist
            </Button>
          </div>
        </header>

        {showDownloadPanel && activeDownloads.length > 0 && (
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-4)' }}>
            <DownloadQueuePanel />
          </div>
        )}

        {/* Search within library filter */}
        {isHydrated && playlists.length > 0 && (
          <div className="library-page__filter-bar glass-panel" style={{ display: 'flex', alignItems: 'center', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-full)', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', marginBottom: 'var(--space-6)' }}>
            <MagnifyingGlass size={18} style={{ color: 'var(--text-secondary)', marginRight: 'var(--space-2)' }} />
            <input
              type="text"
              className="library-page__filter-input"
              placeholder="Search playlists..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{ flex: 1, outline: 'none', fontSize: 'var(--text-sm)' }}
            />
            {searchFilter && (
              <button type="button" onClick={() => setSearchFilter('')} style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {!isHydrated ? (
          <div className="library-page__loading">
            <LoadingSkeleton shape="card-grid" count={3} />
          </div>
        ) : (
          <div className="library-page__content">
            {/* 1. Liked Songs & Recently Played Group */}
            {!searchFilter && (
              <section className="library-page__section" style={{ marginBottom: 'var(--space-8)' }}>
                <h2 className="library-page__section-title" style={{ fontSize: 'var(--text-lg)', fontWeight: 600, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                  Favorites & History
                </h2>
                <div className="library-page__grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-4)' }}>
                  <AnimatedListItem index={0}>
                    <PlaylistCard 
                      playlist={{ name: 'Liked Songs', tracks: likedSongs }}
                      variant="liked"
                    />
                  </AnimatedListItem>
                  <AnimatedListItem index={1}>
                    <PlaylistCard 
                      playlist={{ name: 'Recently Played', tracks: recentlyPlayed }}
                      variant="recent"
                    />
                  </AnimatedListItem>
                </div>
              </section>
            )}

            {/* 2. Custom Playlists Group */}
            <section className="library-page__section">
              <h2 className="library-page__section-title" style={{ fontSize: 'var(--text-lg)', fontWeight: 600, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                Your Playlists {isDesktop && playlists.length > 1 && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 500 }}>· Drag to reorder</span>}
              </h2>

              {filteredPlaylists.length === 0 ? (
                <EmptyState
                  icon={Playlist}
                  title={searchFilter ? "No matching playlists" : "Your library is empty"}
                  description={searchFilter ? "Try a different search query." : "Create your first playlist and add some tracks."}
                  actionLabel={searchFilter ? null : "Create Playlist"}
                  onAction={searchFilter ? null : () => setIsCreateModalOpen(true)}
                />
              ) : isDesktop ? (
                /* Reorderable playlists on desktop */
                <Reorder.Group axis="y" values={filteredPlaylists} onReorder={reorderPlaylists} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {filteredPlaylists.map((playlist) => (
                    <Reorder.Item key={playlist.id} value={playlist} style={{ cursor: 'grab' }}>
                      <PlaylistCard playlist={playlist} variant="custom" />
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              ) : (
                /* Standard grid on mobile */
                <div className="library-page__grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-4)' }}>
                  {filteredPlaylists.map((playlist, idx) => (
                    <AnimatedListItem key={playlist.id} index={idx}>
                      <PlaylistCard playlist={playlist} variant="custom" />
                    </AnimatedListItem>
                  ))}
                </div>
              )}
            </section>
          </div>
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
              <form onSubmit={handleCreatePlaylistSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Playlist name" 
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="custom-modal__input"
                  maxLength={50}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
                <div className="custom-modal__actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
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

export default Library;
