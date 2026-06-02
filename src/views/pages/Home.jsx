import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkle, Warning } from '@phosphor-icons/react';
import { PageTransition } from '../../components/layout/PageTransition/PageTransition';
import { recommendationService } from '../../core/audio/recommendationService';
import { useHistoryStore } from '../../store/historyStore';
import { usePlayerStore } from '../../store/playerStore';
import { RecommendationCarousel } from '../../components/common/RecommendationCarousel/RecommendationCarousel';
import { HeroSlideshow } from '../../components/common/HeroSlideshow/HeroSlideshow';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState/EmptyState';
import { ImgWithFallback } from '../../components/common/ImgWithFallback/ImgWithFallback';
import { useChartStore } from '../../store/chartStore';
import { ChartCarousel } from '../../components/common/ChartCarousel/ChartCarousel';
import { useScrollRestoration } from '../../hooks/useScrollRestoration';
import './Home.css';

function RecentlyPlayedSection({ tracks }) {
  const [activeTab, setActiveTab] = useState('All');
  const navigate = useNavigate();
  const play = usePlayerStore(s => s.play);

  if (!tracks || tracks.length === 0) return null;

  const albumsMap = new Map();
  tracks.forEach(track => {
    if (track.albumId && track.albumName && !albumsMap.has(track.albumId)) {
      albumsMap.set(track.albumId, {
        id: track.albumId,
        title: track.albumName,
        imageUrl: track.imageUrl,
        artistName: track.artistNames?.[0] || 'Unknown Artist'
      });
    }
  });
  const albums = Array.from(albumsMap.values());

  const artistsMap = new Map();
  tracks.forEach(track => {
    const artistId = track.artistIds?.[0];
    const artistName = track.artistNames?.[0];
    if (artistId && artistName && !artistsMap.has(artistId)) {
      artistsMap.set(artistId, {
        id: artistId,
        name: artistName,
        imageUrl: track.imageUrl
      });
    }
  });
  const artists = Array.from(artistsMap.values());

  const handleItemClick = (item) => {
    if (activeTab === 'All' || activeTab === 'Songs') {
      play(item);
    } else if (activeTab === 'Albums') {
      navigate(`/album/${item.id}`);
    } else if (activeTab === 'Artists') {
      navigate(`/artist/${item.id}`);
    }
  };

  const getFilteredItems = () => {
    if (activeTab === 'All' || activeTab === 'Songs') return tracks;
    if (activeTab === 'Albums') return albums;
    if (activeTab === 'Artists') return artists;
    return [];
  };

  const items = getFilteredItems();

  return (
    <div className="recently-played-section" style={{ marginBottom: 'var(--space-8)' }}>
      <div className="recently-played-section__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600 }}>Recently Played</h2>
        <div className="recently-played-section__tabs" style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {['All', 'Songs', 'Albums', 'Artists'].map(tab => (
            <button
              type="button"
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                background: activeTab === tab ? 'var(--accent-moon)' : 'var(--border-subtle)',
                color: activeTab === tab ? 'var(--bg-void)' : 'var(--text-primary)',
                transition: 'background 0.2s, color 0.2s'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-4)', overflowX: 'auto', paddingBottom: 'var(--space-3)' }}>
        {items.map((item, idx) => (
          <div key={item.id || idx} onClick={() => handleItemClick(item)} style={{ flex: '0 0 140px', cursor: 'pointer' }}>
            <ImgWithFallback
              src={item.imageUrl}
              alt={item.title || item.name}
              style={{
                width: '100%',
                aspectRatio: '1/1',
                borderRadius: activeTab === 'Artists' ? 'var(--radius-full)' : 'var(--radius-lg)',
                objectFit: 'cover',
                boxShadow: 'var(--shadow-md)'
              }}
              fallbackSrc="/default-album-art.png"
            />
            <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.title || item.name}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.artistName || (activeTab === 'Artists' ? 'Artist' : '')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Home() {
  const [carousels, setCarousels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const recentlyPlayed = useHistoryStore(s => s.recentlyPlayed);
  const charts = useChartStore(s => s.charts);
  const loadCharts = useChartStore(s => s.loadCharts);
  const scrollRef = useRef(null);

  useScrollRestoration(scrollRef);

  const fetchRecommendations = async (signal = null) => {
    try {
      setTimeout(() => {
        setLoading(true);
        setError(null);
      }, 0);
      const data = await recommendationService.getPersonalizedRecommendations(signal);
      setTimeout(() => {
        setCarousels(data);
      }, 0);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching recommendations:', err);
        setTimeout(() => {
          setError('Failed to load recommendations. Please try again later.');
        }, 0);
      }
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 0);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchRecommendations(controller.signal);
    loadCharts();
    return () => {
      controller.abort();
    };
  }, [loadCharts]);

  return (
    <PageTransition>
      <div ref={scrollRef} className="home-page" style={{ overflowY: 'auto', height: '100%' }}>
        <header className="home-page__header">
          <h1 className="home-page__title">Home</h1>
        </header>

        {error && (
          <EmptyState
            icon={Warning}
            title="Unable to load Home"
            description={error}
            actionLabel="Retry"
            onAction={() => fetchRecommendations()}
            variant="error"
          />
        )}

        <div className="home-page__content">
          {loading ? (
            <div className="home-page__loading">
              <LoadingSkeleton shape="card-grid" count={4} />
            </div>
          ) : carousels.length > 0 ? (
            <>
              <HeroSlideshow tracks={carousels[0].tracks} />
              
              <RecentlyPlayedSection tracks={recentlyPlayed} />

              {charts.length > 0 && <ChartCarousel charts={charts} />}

              {carousels.map((carousel) => (
                <RecommendationCarousel 
                  key={carousel.id || `${carousel.title}-${carousel.tracks.length}`} 
                  title={carousel.title} 
                  tracks={carousel.tracks} 
                />
              ))}
            </>
          ) : (
            !error && (
              <EmptyState
                icon={Sparkle}
                title="Welcome to MoonPlayer"
                description="Start playing some music from Search to generate personalized recommendations!"
              />
            )
          )}
        </div>
      </div>
    </PageTransition>
  );
}

export default Home;
