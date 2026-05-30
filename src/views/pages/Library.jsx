import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../../components/layout/PageTransition/PageTransition';
import { useLibraryStore } from '../../store/libraryStore';
import { SolidPanel } from '../../components/common/SolidPanel/SolidPanel';
import { Heart, Playlist, Plus, ClockCounterClockwise } from '@phosphor-icons/react';
import { Button } from '../../components/common/Button/Button';
import './Library.css';

export function Library() {
  const navigate = useNavigate();
  const { playlists, likedSongs, recentlyPlayed, hydrate, isHydrated, createPlaylist } = useLibraryStore();

  useEffect(() => {
    if (!isHydrated) {
      hydrate();
    }
  }, [hydrate, isHydrated]);

  const handleCreatePlaylist = () => {
    const name = prompt('Enter playlist name:');
    if (name && name.trim()) {
      createPlaylist(name.trim());
    }
  };

  return (
    <PageTransition>
      <div className="library-page">
        <header className="library-page__header">
          <h1 className="library-page__title">Your Library</h1>
          <Button variant="primary" icon={Plus} onClick={handleCreatePlaylist}>
            New Playlist
          </Button>
        </header>

        {(!isHydrated) ? (
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
                <Button variant="secondary" onClick={handleCreatePlaylist}>
                  Create Playlist
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}
