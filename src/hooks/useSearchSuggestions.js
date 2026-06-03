import { useState, useEffect } from 'react';
import { MusicService } from '../core/api/MusicService';

export function useSearchSuggestions(query) {
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [prevQuery, setPrevQuery] = useState(query);

  if (query !== prevQuery) {
    setPrevQuery(query);
    if (!query || !query.trim()) {
      setSuggestions([]);
    }
  }

  useEffect(() => {
    const run = async () => {
      await Promise.resolve();
      try {
        const saved = localStorage.getItem('moonplayer_recent_searches');
        if (saved) {
          setRecentSearches(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Failed to load recent searches:', e);
      }
    };
    run();
  }, []);

  const addRecentSearch = (term) => {
    if (!term || !term.trim()) return;
    const cleanTerm = term.trim();
    setRecentSearches(prev => {
      const filtered = prev.filter(t => t.toLowerCase() !== cleanTerm.toLowerCase());
      const updated = [cleanTerm, ...filtered].slice(0, 10);
      try {
        localStorage.setItem('moonplayer_recent_searches', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save recent search:', e);
      }
      return updated;
    });
  };

  const removeRecentSearch = (term) => {
    setRecentSearches(prev => {
      const updated = prev.filter(t => t !== term);
      try {
        localStorage.setItem('moonplayer_recent_searches', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save recent search:', e);
      }
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('moonplayer_recent_searches');
    } catch (e) {
      console.error('Failed to clear recent searches:', e);
    }
  };

  useEffect(() => {
    if (!query || !query.trim()) {
      return;
    }

    let isMounted = true;
    const delayDebounce = setTimeout(async () => {
      try {
        const response = await fetch(`${MusicService.baseUrl}/api/search?query=${encodeURIComponent(query)}`);
        if (response.ok && isMounted) {
          const res = await response.json();
          if (res.success && res.data && isMounted) {
            const data = res.data;
            const songSuggestions = (data.songs?.results || []).map(s => s.name);
            const artistSuggestions = (data.artists?.results || []).map(a => a.name);
            const albumSuggestions = (data.albums?.results || []).map(al => al.name);
            const all = [...new Set([...songSuggestions, ...artistSuggestions, ...albumSuggestions])].slice(0, 8);
            setSuggestions(all);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch search suggestions:', err);
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(delayDebounce);
    };
  }, [query]);

  return {
    suggestions,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches
  };
}
