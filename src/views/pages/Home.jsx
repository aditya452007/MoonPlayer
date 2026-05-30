import { useState, useEffect } from 'react';
import { PageTransition } from '../../components/layout/PageTransition/PageTransition';
import { recommendationService } from '../../core/audio/recommendationService';
import { useLibraryStore } from '../../store/libraryStore';
import { RecommendationCarousel } from '../../components/common/RecommendationCarousel/RecommendationCarousel';
import { Skeleton } from '../../components/common/Skeleton/Skeleton';
import './Home.css';

export function Home() {
  const [carousels, setCarousels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { isHydrated, hydrate } = useLibraryStore();

  useEffect(() => {
    if (!isHydrated) {
      hydrate().catch((err) => {
        console.error('Hydration failed on Home mount:', err);
      });
    }
  }, [isHydrated, hydrate]);

  useEffect(() => {
    let isMounted = true;

    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await recommendationService.getPersonalizedRecommendations();
        if (isMounted) {
          setCarousels(data);
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        if (isMounted) {
          setError('Failed to load recommendations. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (isHydrated) {
      fetchRecommendations();
    }

    return () => {
      isMounted = false;
    };
  }, [isHydrated]);

  return (
    <PageTransition>
      <div className="home-page">
        <header className="home-page__header">
          <h1 className="home-page__title">Home</h1>
        </header>

        {error && (
          <div style={{ color: 'var(--error)' }}>
            <p>{error}</p>
          </div>
        )}

        <div className="home-page__content">
          {loading ? (
            // Render skeletons for a couple of carousels
            Array.from({ length: 2 }).map((_, cIdx) => (
              <div key={`skel-carousel-${cIdx}`} style={{ marginBottom: 'var(--space-8)' }}>
                <Skeleton variant="text" width="200px" height="32px" style={{ marginBottom: 'var(--space-4)' }} />
                <div style={{ display: 'flex', gap: 'var(--space-4)', overflow: 'hidden' }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={`skel-card-${i}`} style={{ flex: '0 0 auto', width: '160px' }}>
                      <Skeleton variant="rect" width="100%" style={{ aspectRatio: '1/1', borderRadius: 'var(--radius-sm)' }} />
                      <Skeleton variant="text" width="80%" style={{ marginTop: 'var(--space-2)' }} />
                      <Skeleton variant="text" width="60%" style={{ marginTop: 'var(--space-1)' }} />
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : carousels.length > 0 ? (
            carousels.map((carousel) => (
              <RecommendationCarousel 
                key={carousel.id || `${carousel.title}-${carousel.tracks.length}`} 
                title={carousel.title} 
                tracks={carousel.tracks} 
              />
            ))
          ) : (
            !error && <p>No recommendations found.</p>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
