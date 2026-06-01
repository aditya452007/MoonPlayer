import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlass, Clock, X, Warning, MusicNotes } from '@phosphor-icons/react';
import { PageTransition } from '../../components/layout/PageTransition/PageTransition';
import { TrackRow } from '../../components/common/TrackRow/TrackRow';
import { AlbumCard } from '../../components/common/AlbumCard/AlbumCard';
import { ArtistCard } from '../../components/common/ArtistCard/ArtistCard';
import { PlaylistCard } from '../../components/common/PlaylistCard/PlaylistCard';
import { SearchResultCategory } from './SearchResultCategory';
import { EmptyState } from '../../components/common/EmptyState/EmptyState';
import { AnimatedList } from '../../components/common/AnimatedList/AnimatedList';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton/LoadingSkeleton';
import { useSearchSuggestions } from '../../hooks/useSearchSuggestions';
import { MusicService } from '../../core/api/MusicService';
import { usePreferenceStore } from '../../store/preferenceStore';
import { GlassPanel } from '../../components/common/GlassPanel/GlassPanel';
import { useScrollRestoration } from '../../hooks/useScrollRestoration';
import './Search.css';

export function Search() {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const scrollRef = useRef(null);

  useScrollRestoration(scrollRef);

  const { streamQuality, dataSaverEnabled } = usePreferenceStore();
  
  const {
    suggestions,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches
  } = useSearchSuggestions(query);

  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const executeSearch = async (searchTerm) => {
    if (!searchTerm || !searchTerm.trim()) return;
    setLoading(true);
    setError(null);
    setShowSuggestions(false);
    addRecentSearch(searchTerm);

    try {
      const data = await MusicService.searchAll(searchTerm, streamQuality, dataSaverEnabled);
      setResults(data);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (term) => {
    setQuery(term);
    executeSearch(term);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      executeSearch(query);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      searchInputRef.current?.blur();
    }
  };

  // Click outside to close suggestions drawer
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target) &&
        !searchInputRef.current?.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const clearSearch = () => {
    setQuery('');
    setResults(null);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const filters = ['All', 'Songs', 'Albums', 'Artists', 'Playlists'];

  return (
    <PageTransition>
      <div ref={scrollRef} className="search-page" style={{ overflowY: 'auto', height: '100%' }}>
        {/* Sticky floating frosted glass search bar */}
        <GlassPanel variant="searchbar" className="search-page__input-wrapper">
          <MagnifyingGlass size={20} className="search-page__search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="search-page__input"
            placeholder="Search songs, albums, artists, or playlists..."
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            maxLength={100}
          />
          {query && (
            <button type="button" onClick={clearSearch} className="search-page__clear-btn" aria-label="Clear input">
              <X size={18} />
            </button>
          )}
        </GlassPanel>

        {/* Category filter chips */}
        <div className="search-page__filter-wrapper">
          <div className="search-page__filter-chips">
            {filters.map((filter) => (
              <button
                type="button"
                key={filter}
                className={`search-page__filter-chip ${activeFilter === filter ? 'search-page__filter-chip--active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Search Content */}
        <div className="search-page__content" style={{ position: 'relative' }}>
          
          {/* Autocomplete suggestions panel */}
          {showSuggestions && suggestions.length > 0 && (
            <div ref={suggestionsRef} className="search-page__suggestions-dropdown glass-panel">
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion}-${index}`}
                  className="search-page__suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <MagnifyingGlass size={16} />
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="search-page__loading">
              <LoadingSkeleton shape="list" count={6} />
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <EmptyState
              icon={Warning}
              title="Search error occurred"
              description={error}
              actionLabel="Retry"
              onAction={() => executeSearch(query)}
              variant="error"
            />
          )}

          {/* Default state: Search history (recent searches) */}
          {!query && !results && !loading && (
            <div className="search-page__history">
              {recentSearches.length > 0 ? (
                <>
                  <div className="search-page__history-header">
                    <h3>Recent Searches</h3>
                    <button type="button" className="search-page__clear-history-btn" onClick={clearRecentSearches}>
                      Clear All
                    </button>
                  </div>
                  <div className="search-page__history-list">
                    {recentSearches.map((term, index) => (
                      <div key={`${term}-${index}`} className="search-page__history-item" onClick={() => handleSuggestionClick(term)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <Clock size={16} style={{ color: 'var(--text-secondary)' }} />
                          <span>{term}</span>
                        </div>
                        <button
                          type="button"
                          className="search-page__remove-history-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecentSearch(term);
                          }}
                          aria-label={`Remove search term ${term}`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState
                  icon={MagnifyingGlass}
                  title="Find your music"
                  description="Search for songs, albums, or artists."
                />
              )}
            </div>
          )}

          {/* Search Results Display */}
          {results && !loading && !error && (
            <div className="search-page__results">
              
              {/* Tracks (Songs) Category */}
              {(activeFilter === 'All' || activeFilter === 'Songs') && results.songs?.length > 0 && (
                <SearchResultCategory title="Songs" type="list">
                  <AnimatedList>
                    {results.songs.map((track, i) => (
                      <TrackRow key={track.id || i} track={track} index={i} showImage />
                    ))}
                  </AnimatedList>
                </SearchResultCategory>
              )}

              {/* Albums Category */}
              {(activeFilter === 'All' || activeFilter === 'Albums') && results.albums?.length > 0 && (
                <SearchResultCategory title="Albums" type="grid">
                  {results.albums.map((album, i) => (
                    <AlbumCard key={album.id || i} album={album} />
                  ))}
                </SearchResultCategory>
              )}

              {/* Artists Category */}
              {(activeFilter === 'All' || activeFilter === 'Artists') && results.artists?.length > 0 && (
                <SearchResultCategory title="Artists" type="grid">
                  {results.artists.map((artist, i) => (
                    <ArtistCard key={artist.id || i} artist={artist} />
                  ))}
                </SearchResultCategory>
              )}

              {/* Playlists Category */}
              {(activeFilter === 'All' || activeFilter === 'Playlists') && results.playlists?.length > 0 && (
                <SearchResultCategory title="Playlists" type="grid">
                  {results.playlists.map((playlist, i) => (
                    <PlaylistCard key={playlist.id || i} playlist={playlist} variant="custom" />
                  ))}
                </SearchResultCategory>
              )}

              {/* If no categories contain elements, display empty state */}
              {results.songs?.length === 0 &&
               results.albums?.length === 0 &&
               results.artists?.length === 0 &&
               results.playlists?.length === 0 && (
                <EmptyState
                  icon={MusicNotes}
                  title="No results found"
                  description="Try searching for a different keyword or check spelling."
                />
              )}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

export default Search;
