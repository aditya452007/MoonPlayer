import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Shuffle, ShareNetwork, MusicNotes, Warning } from '@phosphor-icons/react';
import { PageTransition } from '../../components/layout/PageTransition/PageTransition';
import { SongRow } from '../../components/common/SongRow/SongRow';
import { EmptyState } from '../../components/common/EmptyState/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton/LoadingSkeleton';
import { LayoutSwitch } from '../../components/common/LayoutSwitch/LayoutSwitch';
import { ImgWithFallback } from '../../components/common/ImgWithFallback/ImgWithFallback';
import { AnimatedList } from '../../components/common/AnimatedList/AnimatedList';
import { MusicService } from '../../core/api/MusicService';
import { usePlayerStore } from '../../store/playerStore';
import { extractDominantColor } from '../../core/utils/colorExtractor';
import { shareService } from '../../core/api/shareService';
import { useToastStore } from '../../store/toastStore';
import { usePreferenceStore } from '../../store/preferenceStore';
import './AlbumView.css';

export function AlbumView() {
  const { id } = useParams();
  const { play, addToQueue, clearQueue } = usePlayerStore();
  const { addToast } = useToastStore();
  const { streamQuality, dataSaverEnabled } = usePreferenceStore();

  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bgColor, setBgColor] = useState('rgb(26, 30, 37)');

  const abortControllerRef = useRef(null);

  const fetchAlbumDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      const data = await MusicService.getAlbumDetails(id, streamQuality, dataSaverEnabled);
      if (signal.aborted) return;

      setAlbum(data);
      
      // Extract color
      if (data.imageUrl) {
        const color = await extractDominantColor(data.imageUrl, signal);
        if (!signal.aborted) {
          setBgColor(color);
        }
      }
    } catch (err) {
      console.error('Failed to load album:', err);
      setError('Failed to load album. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [id, streamQuality, dataSaverEnabled]);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      await Promise.resolve();
      if (isMounted) {
        fetchAlbumDetails();
      }
    };
    run();
    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchAlbumDetails]);

  if (loading) {
    return (
      <PageTransition>
        <div className="album-view album-view--loading">
          <LoadingSkeleton shape="list" count={6} />
        </div>
      </PageTransition>
    );
  }

  if (error || !album) {
    return (
      <PageTransition>
        <div className="album-view album-view--error">
          <EmptyState
            icon={Warning}
            title="Failed to load album"
            description={error || 'Album not found'}
            actionLabel="Retry"
            onAction={fetchAlbumDetails}
            variant="error"
          />
        </div>
      </PageTransition>
    );
  }

  const handlePlayAll = () => {
    if (!album.tracks?.length) return;
    clearQueue();
    addToQueue(album.tracks);
    play(album.tracks[0]);
  };

  const handleShuffle = () => {
    if (!album.tracks?.length) return;
    const shuffled = [...album.tracks].sort(() => Math.random() - 0.5);
    clearQueue();
    addToQueue(shuffled);
    play(shuffled[0]);
  };

  const handleShare = async () => {
    try {
      await shareService.sharePlaylist({
        name: album.title,
        tracks: album.tracks
      });
    } catch (err) {
      console.error(err);
      addToast('Sharing failed', 'error');
    }
  };

  const formattedTracks = album.tracks || [];

  const headerContent = (
    <div className="album-view__header-inner">
      <div className="album-view__cover-wrapper">
        <ImgWithFallback
          src={album.imageUrl}
          alt={album.title}
          className="album-view__cover"
          fallbackSrc="/default-album-art.png"
        />
      </div>
      <div className="album-view__info">
        <span className="album-view__tag">ALBUM</span>
        <h1 className="album-view__title">{album.title}</h1>
        <p className="album-view__artist">{album.artistName}</p>
        <p className="album-view__meta">
          {album.year} · {formattedTracks.length} tracks
        </p>
      </div>
    </div>
  );

  const tracksContent = (
    <div className="album-view__tracks-inner">
      <div className="album-view__actions">
        <button
          type="button"
          className="album-view__action-play-btn"
          onClick={handlePlayAll}
          disabled={!formattedTracks.length}
        >
          <Play weight="fill" size={24} /> Play
        </button>
        <button
          type="button"
          className="album-view__action-btn"
          onClick={handleShuffle}
          disabled={!formattedTracks.length}
        >
          <Shuffle size={20} /> Shuffle
        </button>
        <button
          type="button"
          className="album-view__action-btn"
          onClick={handleShare}
          disabled={!formattedTracks.length}
        >
          <ShareNetwork size={20} /> Share
        </button>
      </div>

      <div className="album-view__list">
        {formattedTracks.length === 0 ? (
          <EmptyState
            icon={MusicNotes}
            title="No songs found"
            description="There are no songs available in this album."
          />
        ) : (
          <AnimatedList>
            {formattedTracks.map((track, i) => (
              <SongRow
                key={track.id || i}
                track={track}
                index={i}
                showArtwork={false}
              />
            ))}
          </AnimatedList>
        )}
      </div>
    </div>
  );

  return (
    <PageTransition>
      <div className="album-view" style={{ '--extracted-color': bgColor }}>
        <div className="album-view__backdrop" />
        <LayoutSwitch
          mobile={
            <div className="album-view__container album-view__container--mobile">
              {headerContent}
              {tracksContent}
            </div>
          }
          desktop={
            <div className="album-view__container album-view__container--desktop">
              <div className="album-view__left">{headerContent}</div>
              <div className="album-view__right">{tracksContent}</div>
            </div>
          }
          threshold={750}
        />
      </div>
    </PageTransition>
  );
}

export default AlbumView;
