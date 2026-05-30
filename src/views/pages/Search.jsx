import { useState, useEffect, useRef, useMemo } from 'react';
import { PageTransition } from '../../components/layout/PageTransition/PageTransition';
import { MusicService } from '../../core/api/MusicService';
import { usePreferenceStore } from '../../store/preferenceStore';
import { TrackRow } from '../../components/common/TrackRow/TrackRow';
import { Skeleton } from '../../components/common/Skeleton/Skeleton';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { debounce } from '../../core/utils/debounce';
import './Search.css';

/**
 * Search Page Component
 * Allows users to search tracks with real-time keystroke debouncing.
 * Dynamically resolves quality/data-saving stream preferences inside the debounce loop
 * and prevents skeleton card flashes during active typing.
 */
export function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Create a ref to hold the search state to avoid race conditions
  const activeSearchRef = useRef('');

  // Setup debounced search function
  // eslint-disable-next-line
  const searchFn = useMemo(() => debounce(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Always retrieve the latest preference values dynamically from store (Issue #17)
      const { streamQuality: quality, dataSaverEnabled: dataSaver } = usePreferenceStore.getState();
      const tracks = await MusicService.searchSongs(searchQuery, 1, 20, quality, dataSaver);
      
      // Only update if this is still the active search
      if (activeSearchRef.current === searchQuery) {
        setResults(tracks);
        setError(null);
      }
    } catch (err) {
      console.error('Search error:', err);
      if (activeSearchRef.current === searchQuery) {
        setError('Failed to fetch search results.');
      }
    } finally {
      if (activeSearchRef.current === searchQuery) {
        setLoading(false);
      }
    }
  }, 300), []);

  // Cleanup pending debounce on unmount
  useEffect(() => {
    return () => {
      searchFn.cancel();
    };
  }, [searchFn]);

  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    activeSearchRef.current = newQuery;
    
    if (newQuery.trim()) {
      setError(null);
      // Initiate debounced fetch; does not toggle loading until debounce fires (Issue #28)
      searchFn.debounced(newQuery);
    } else {
      searchFn.cancel();
      setResults([]);
      setLoading(false);
      setError(null);
    }
  };

  return (
    <PageTransition>
      <div className="search-page">
        <header className="search-page__header">
          <h1 className="search-page__title">Search</h1>
          <div className="search-page__input-wrapper">
            <MagnifyingGlass className="search-page__icon" weight="bold" />
            <input 
              type="text" 
              className="search-page__input" 
              placeholder="Songs, artists, or podcasts" 
              value={query}
              onChange={handleInputChange}
            />
          </div>
        </header>

        <div className="search-page__results">
          {loading ? (
            // Render skeletons utilizing clean CSS classes
            Array.from({ length: 8 }).map((_, i) => (
              <div key={`search-skel-${i}`} className="search-page__skeleton-item">
                <Skeleton variant="rect" width="48px" height="48px" className="search-page__skeleton-rect" />
                <div className="search-page__skeleton-text-group">
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="text" width="20%" />
                </div>
              </div>
            ))
          ) : error ? (
            <div className="search-page__error">{error}</div>
          ) : results.length > 0 ? (
            results.map((track, index) => (
              <TrackRow key={track.id} track={track} index={index} showImage={true} />
            ))
          ) : query.trim() ? (
            <div className="search-page__empty">No results found for "{query}"</div>
          ) : (
            <div className="search-page__empty">Find your favorite music</div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
