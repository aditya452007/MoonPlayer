import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Play, ShareNetwork, Warning } from '@phosphor-icons/react';
import { PageTransition } from '../../components/layout/PageTransition/PageTransition';
import { SongRow } from '../../components/common/SongRow/SongRow';
import { AlbumCard } from '../../components/common/AlbumCard/AlbumCard';
import { EmptyState } from '../../components/common/EmptyState/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton/LoadingSkeleton';
import { ResponsiveGrid } from '../../components/common/ResponsiveGrid/ResponsiveGrid';
import { ImgWithFallback } from '../../components/common/ImgWithFallback/ImgWithFallback';
import { AnimatedList } from '../../components/common/AnimatedList/AnimatedList';
import { MusicService } from '../../core/api/MusicService';
import { usePlayerStore } from '../../store/playerStore';
import { extractDominantColor } from '../../core/utils/colorExtractor';
import { shareService } from '../../core/api/shareService';
import { useToastStore } from '../../store/toastStore';
import { usePreferenceStore } from '../../store/preferenceStore';
import './ArtistView.css';

export function ArtistView() {
  const { id } = useParams();
  const { play, addToQueue, clearQueue } = usePlayerStore();
  const { addToast } = useToastStore();
  const { streamQuality, dataSaverEnabled } = usePreferenceStore();

  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bgColor, setBgColor] = useState('rgb(26, 30, 37)');

  const abortControllerRef = useRef(null);

  const fetchArtistDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      const data = await MusicService.getArtistDetails(id, streamQuality, dataSaverEnabled);
      if (signal.aborted) return;

      setArtist(data);
      
      // Extract color
      if (data.imageUrl) {
        const color = await extractDominantColor(data.imageUrl, signal);
        if (!signal.aborted) {
          setBgColor(color);
        }
      }
    } catch (err) {
      console.error('Failed to load artist details:', err);
      setError('Failed to load artist details. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [id, streamQuality, dataSaverEnabled]);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      await Promise.resolve();
      if (isMounted) {
        fetchArtistDetails();
      }
    };
    run();
    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchArtistDetails]);

  if (loading) {
    return (
      <PageTransition>
        <div className="artist-view artist-view--loading">
          <LoadingSkeleton shape="list" count={5} />
        </div>
      </PageTransition>
    );
  }

  if (error || !artist) {
    return (
      <PageTransition>
        <div className="artist-view artist-view--error">
          <EmptyState
            icon={Warning}
            title="Failed to load artist"
            description={error || 'Artist not found'}
            actionLabel="Retry"
            onAction={fetchArtistDetails}
            variant="error"
          />
        </div>
      </PageTransition>
    );
  }

  const handlePlayPopular = () => {
    if (!artist.tracks?.length) return;
    clearQueue();
    addToQueue(artist.tracks);
    play(artist.tracks[0]);
  };

  const handleShare = async () => {
    try {
      await shareService.sharePlaylist({
        name: artist.name,
        tracks: artist.tracks
      });
    } catch (err) {
      console.error(err);
      addToast('Sharing failed', 'error');
    }
  };

  return (
    <PageTransition>
      <div className="artist-view" style={{ '--extracted-color': bgColor }}>
        <div className="artist-view__backdrop" />
        
        <div className="artist-view__header">
          <div className="artist-view__avatar-wrapper">
            <ImgWithFallback
              src={artist.imageUrl}
              alt={artist.name}
              className="artist-view__avatar"
              fallbackSrc="/default-album-art.png"
            />
          </div>
          <div className="artist-view__header-info">
            <span className="artist-view__badge">ARTIST</span>
            <h1 className="artist-view__name">{artist.name}</h1>
            <p className="artist-view__sub">
              {artist.genre} · {artist.monthlyListeners}
            </p>
          </div>
        </div>

        <div className="artist-view__actions">
          <button
            type="button"
            className="artist-view__play-btn"
            onClick={handlePlayPopular}
            disabled={!artist.tracks?.length}
          >
            <Play weight="fill" size={24} /> Play Top Tracks
          </button>
          <button
            type="button"
            className="artist-view__share-btn"
            onClick={handleShare}
            disabled={!artist.tracks?.length}
          >
            <ShareNetwork size={20} /> Share
          </button>
        </div>

        <div className="artist-view__content">
          {/* Top Tracks Section */}
          <section className="artist-view__section">
            <h2 className="artist-view__section-title">Popular Tracks</h2>
            <div className="artist-view__track-list">
              {artist.tracks?.length === 0 ? (
                <p className="artist-view__empty-text">No popular tracks found.</p>
              ) : (
                <AnimatedList>
                  {artist.tracks?.slice(0, 5).map((track, i) => (
                    <SongRow
                      key={track.id || i}
                      track={track}
                      index={i}
                      showArtwork={true}
                    />
                  ))}
                </AnimatedList>
              )}
            </div>
          </section>

          {/* Albums Section */}
          <section className="artist-view__section">
            <h2 className="artist-view__section-title">Albums</h2>
            {artist.albums?.length === 0 ? (
              <p className="artist-view__empty-text">No albums found.</p>
            ) : (
              <ResponsiveGrid minItemWidth={160} gap={16}>
                {artist.albums?.map((album, i) => (
                  <AlbumCard key={album.id || i} album={album} />
                ))}
              </ResponsiveGrid>
            )}
          </section>
        </div>
      </div>
    </PageTransition>
  );
}

export default ArtistView;
