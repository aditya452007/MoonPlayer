/**
 * Safe, DOM-free HTML entity decoder.
 * @param {string} text
 * @returns {string}
 */
function decodeHtmlEntities(text) {
  if (!text || typeof text !== 'string') return '';
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&#39;': "'",
    '&apos;': "'"
  };
  return text.replace(/&amp;|&lt;|&gt;|&quot;|&#039;|&#39;|&apos;/g, match => entities[match] || match);
}

/**
 * Extracts the best image URL from either:
 *   - New API v2 format: Array<{ quality: string, url: string }>
 *   - Old API format:    Array<{ quality: string, link: string }>
 * @param {Array} imageArray
 * @returns {string}
 */
function extractBestImage(imageArray) {
  if (!Array.isArray(imageArray) || imageArray.length === 0) return '';

  // Try to find 500x500 quality
  const target = imageArray.find(img => img.quality === '500x500');
  if (target) return target.url || target.link || '';

  // Fallback to last (assumed highest res)
  const last = imageArray[imageArray.length - 1];
  return last.url || last.link || '';
}

/**
 * Extracts the appropriate streaming URL from either:
 *   - New API v2 format: Array<{ quality: string, url: string }>
 *   - Old API format:    Array<{ quality: string, link: string }>
 * @param {Array} downloadUrlArray
 * @param {string} userPreferenceQuality
 * @param {boolean} dataSaverEnabled
 * @returns {string}
 */
function extractStreamUrl(downloadUrlArray, userPreferenceQuality, dataSaverEnabled) {
  if (!Array.isArray(downloadUrlArray) || downloadUrlArray.length === 0) return '';

  const urlMap = new Map();
  for (const item of downloadUrlArray) {
    if (item && item.quality) {
      urlMap.set(item.quality, item.url || item.link || '');
    }
  }

  const targetQuality = dataSaverEnabled ? '96kbps' : userPreferenceQuality;
  const targetLink = urlMap.get(targetQuality);
  if (targetLink) return targetLink;

  const cascade = dataSaverEnabled
    ? ['96kbps', '48kbps', '12kbps']
    : ['320kbps', '192kbps', '160kbps', '96kbps', '48kbps', '12kbps'];

  for (const quality of cascade) {
    const matched = urlMap.get(quality);
    if (matched) return matched;
  }

  const last = downloadUrlArray[downloadUrlArray.length - 1];
  return last.url || last.link || '';
}

/**
 * Normalizes a song object from the JioSaavn API (v2 schema from sumitkolhe/jiosaavn-api)
 * into our internal Track interface.
 *
 * New v2 response shape (after the API helper transforms raw JioSaavn data):
 * {
 *   id, name, type, year, duration,
 *   hasLyrics, lyricsId,
 *   album: { id, name, url },
 *   artists: {
 *     primary: [{ id, name, ... }],
 *     ...
 *   },
 *   image:       [{ quality, url }],   // e.g. "50x50", "150x150", "500x500"
 *   downloadUrl: [{ quality, url }],   // e.g. "12kbps", "48kbps", "96kbps", "160kbps", "320kbps"
 * }
 *
 * @param {Object} raw
 * @param {'96kbps'|'160kbps'|'320kbps'} [userQuality='320kbps']
 * @param {boolean} [dataSaver=false]
 * @returns {import('../../store/libraryStore').Track|null}
 */
function normalizeTrack(raw, userQuality = '320kbps', dataSaver = false) {
  if (!raw || typeof raw !== 'object') return null;
  try {
    // ── Artist extraction ─────────────────────────────────────────────────────
    // v2: artists.primary is an array of { id, name, ... }
    // v1 fallback: primaryArtists is a comma-separated string
    let artistNames = [];
    let artistIds = [];

    if (raw.artists && Array.isArray(raw.artists.primary) && raw.artists.primary.length > 0) {
      // v2 shape
      artistNames = raw.artists.primary.map(a => decodeHtmlEntities(a.name || '')).filter(Boolean);
      artistIds   = raw.artists.primary.map(a => String(a.id || '')).filter(Boolean);
    } else if (typeof raw.primaryArtists === 'string') {
      // v1 fallback
      const primaryArtistsId = typeof raw.primaryArtistsId === 'string' ? raw.primaryArtistsId : '';
      artistNames = raw.primaryArtists.split(',').map(n => decodeHtmlEntities(n.trim())).filter(Boolean);
      artistIds   = primaryArtistsId.split(',').map(id => id.trim()).filter(Boolean);
    }

    if (artistNames.length === 0) artistNames = ['Unknown Artist'];

    // ── Song name ─────────────────────────────────────────────────────────────
    // v2 uses `name`; v1 used `name` too but mapped from raw `title` field
    const title = decodeHtmlEntities(raw.name || raw.title || 'Unknown Track');

    // ── Album ─────────────────────────────────────────────────────────────────
    // v2: album is { id, name, url }
    // v1: album is { id, name }
    const album = raw.album || {};
    const albumId   = String(album.id   || '');
    const albumName = decodeHtmlEntities(album.name || '');

    // ── Duration ──────────────────────────────────────────────────────────────
    const duration = parseInt(raw.duration || 0, 10);

    // ── Lyrics flag ───────────────────────────────────────────────────────────
    // v2 exposes lyricsId directly; v1 uses hasLyrics boolean
    const lyricsId = raw.lyricsId
      ? String(raw.lyricsId)
      : (raw.hasLyrics === true || raw.hasLyrics === 'true')
        ? String(raw.id)
        : null;

    // ── Media URLs ────────────────────────────────────────────────────────────
    const streamUrl = extractStreamUrl(raw.downloadUrl, userQuality, dataSaver);
    const imageUrl  = extractBestImage(raw.image);

    return {
      id: String(raw.id || ''),
      title,
      artistNames,
      artistIds,
      albumId,
      albumName,
      duration,
      streamUrl,
      imageUrl,
      lyricsId,
    };
  } catch (error) {
    console.error('Failed to normalize track payload:', error, raw);
    return null;
  }
}

/**
 * Service for interfacing with the jiosaavn-api (sumitkolhe/jiosaavn-api) endpoints.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  SETUP: Deploy your own free API instance in ~2 minutes                 │
 * │  1. Go to https://github.com/sumitkolhe/jiosaavn-api                   │
 * │  2. Click "Deploy to Vercel" in the README                              │
 * │  3. Set Function Region to Mumbai (bom1) for best performance           │
 * │  4. Copy your Vercel URL (e.g. https://my-api.vercel.app)               │
 * │  5. Create a .env file in this project root with:                       │
 * │       VITE_API_BASE_URL=https://my-api.vercel.app                       │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
class MusicServiceImpl {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://saavn.dev';
  }

  /**
   * Helper to execute API calls with content-type checks.
   * @param {string} endpoint
   * @returns {Promise<any>}
   */
  async _fetch(endpoint) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      if (!response.ok) {
        throw new Error(`API Error: HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('API response is not JSON formatted');
      }

      const data = await response.json();
      if (!data || typeof data !== 'object' || !data.success) {
        throw new Error(`API returned success: false - ${data?.message || 'Unknown error'}`);
      }
      return data.data;
    } catch (error) {
      console.error(`MusicService request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Search for songs.
   * @param {string} query
   * @param {number} [page=1]
   * @param {number} [limit=10]
   * @param {'96kbps'|'160kbps'|'320kbps'} [quality='320kbps']
   * @param {boolean} [dataSaver=false]
   * @returns {Promise<import('../../store/libraryStore').Track[]>}
   */
  async searchSongs(query, page = 1, limit = 10, quality = '320kbps', dataSaver = false) {
    if (!query) return [];
    try {
      const encodedQuery = encodeURIComponent(query);
      const data = await this._fetch(`/api/search/songs?query=${encodedQuery}&page=${page}&limit=${limit}`);

      if (!data || !data.results) return [];

      return data.results
        .map(raw => normalizeTrack(raw, quality, dataSaver))
        .filter(track => track !== null);
    } catch (error) {
      console.error('MusicService.searchSongs failed:', error);
      return [];
    }
  }

  /**
   * Search for songs, albums, artists, and playlists categorized.
   * @param {string} query
   * @param {'96kbps'|'160kbps'|'320kbps'} [quality='320kbps']
   * @param {boolean} [dataSaver=false]
   * @returns {Promise<any>}
   */
  async searchAll(query, quality = '320kbps', dataSaver = false) {
    if (!query) return { songs: [], albums: [], artists: [], playlists: [] };
    try {
      const encodedQuery = encodeURIComponent(query);
      const data = await this._fetch(`/api/search?query=${encodedQuery}`);
      if (!data) return { songs: [], albums: [], artists: [], playlists: [] };

      const songs = (data.songs?.results || [])
        .map(raw => normalizeTrack(raw, quality, dataSaver))
        .filter(t => t !== null);

      const albums = (data.albums?.results || []).map(al => ({
        id: String(al.id || ''),
        title: decodeHtmlEntities(al.title || al.name || ''),
        artistName: decodeHtmlEntities(al.artist || al.artistName || ''),
        imageUrl: extractBestImage(al.image),
        year: al.year || ''
      }));

      const artists = (data.artists?.results || []).map(art => ({
        id: String(art.id || ''),
        name: decodeHtmlEntities(art.title || art.name || ''),
        imageUrl: extractBestImage(art.image),
        genre: art.role || 'Artist'
      }));

      const playlists = (data.playlists?.results || []).map(pl => ({
        id: String(pl.id || ''),
        name: decodeHtmlEntities(pl.title || pl.name || ''),
        coverImage: extractBestImage(pl.image),
        tracks: []
      }));

      return { songs, albums, artists, playlists };
    } catch (error) {
      console.error('MusicService.searchAll failed:', error);
      return { songs: [], albums: [], artists: [], playlists: [] };
    }
  }

  /**
   * Get single track details (JIT stream resolution).
   * @param {string} id
   * @param {'96kbps'|'160kbps'|'320kbps'} [quality='320kbps']
   * @param {boolean} [dataSaver=false]
   * @returns {Promise<import('../../store/libraryStore').Track>}
   */
  async getTrackDetails(id, quality = '320kbps', dataSaver = false) {
    try {
      const data = await this._fetch(`/api/songs/${id}`);

      // v2 returns array directly in data; v1 was data[0]
      const rawSong = Array.isArray(data) ? data[0] : data;
      if (!rawSong) throw new Error('Track not found');

      const track = normalizeTrack(rawSong, quality, dataSaver);
      if (!track) throw new Error('Failed to normalize track payload');
      return track;
    } catch (error) {
      console.error(`MusicService.getTrackDetails failed for ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Fetches trending songs for the home page.
   * @param {'96kbps'|'160kbps'|'320kbps'} [quality='320kbps']
   * @param {boolean} [dataSaver=false]
   * @returns {Promise<import('../../store/libraryStore').Track[]>}
   */
  async getTrending(quality = '320kbps', dataSaver = false) {
    return this.searchSongs('top hits', 1, 15, quality, dataSaver);
  }

  /**
   * Fetches album details along with tracks.
   * @param {string} id
   * @param {'96kbps'|'160kbps'|'320kbps'} [quality='320kbps']
   * @param {boolean} [dataSaver=false]
   * @returns {Promise<any>}
   */
  async getAlbumDetails(id, quality = '320kbps', dataSaver = false) {
    try {
      const data = await this._fetch(`/api/albums?id=${id}`);
      if (!data) throw new Error('Album not found');
      
      const tracks = (data.songs || [])
        .map(raw => normalizeTrack(raw, quality, dataSaver))
        .filter(t => t !== null);

      return {
        id: String(data.id || ''),
        title: decodeHtmlEntities(data.name || ''),
        artistName: decodeHtmlEntities(data.primaryArtists || (data.artists?.primary?.[0]?.name) || 'Unknown Artist'),
        imageUrl: extractBestImage(data.image),
        year: data.year || '',
        trackCount: tracks.length,
        tracks
      };
    } catch (error) {
      console.error(`MusicService.getAlbumDetails failed for ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Fetches artist details, top tracks, albums.
   * @param {string} id
   * @param {'96kbps'|'160kbps'|'320kbps'} [quality='320kbps']
   * @param {boolean} [dataSaver=false]
   * @returns {Promise<any>}
   */
  async getArtistDetails(id, quality = '320kbps', dataSaver = false) {
    try {
      const data = await this._fetch(`/api/artists/${id}`);
      if (!data) throw new Error('Artist not found');

      const tracks = (data.topSongs || [])
        .map(raw => normalizeTrack(raw, quality, dataSaver))
        .filter(t => t !== null);

      const albums = (data.topAlbums || []).map(al => ({
        id: String(al.id || ''),
        title: decodeHtmlEntities(al.name || ''),
        artistName: decodeHtmlEntities(data.name || 'Unknown Artist'),
        imageUrl: extractBestImage(al.image),
        year: al.year || '',
      }));

      return {
        id: String(data.id || ''),
        name: decodeHtmlEntities(data.name || ''),
        imageUrl: extractBestImage(data.image),
        genre: data.dominantGenre || 'Artist',
        monthlyListeners: data.followerCount ? `${parseInt(data.followerCount, 10).toLocaleString()} followers` : 'Artist',
        tracks,
        albums
      };
    } catch (error) {
      console.error(`MusicService.getArtistDetails failed for ID ${id}:`, error);
      throw error;
    }
  }

  async getPlaylistDetails(id, quality = '320kbps', dataSaver = false) {
    try {
      const data = await this._fetch(`/api/playlists?id=${id}`);
      if (!data) throw new Error('Playlist not found');
      
      const tracks = (data.songs || [])
        .map(raw => normalizeTrack(raw, quality, dataSaver))
        .filter(t => t !== null);

      return {
        id: String(data.id || ''),
        title: decodeHtmlEntities(data.name || ''),
        artistName: decodeHtmlEntities(data.userId || 'JioSaavn'),
        imageUrl: extractBestImage(data.image),
        trackCount: tracks.length,
        tracks
      };
    } catch (error) {
      console.error(`MusicService.getPlaylistDetails failed for ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Fetches lyrics for a track.
   * @param {string} id
   * @returns {Promise<any>}
   */
  async getLyrics(id) {
    if (!id) return null;
    try {
      const data = await this._fetch(`/api/songs/${id}/lyrics`);
      return data;
    } catch (error) {
      console.warn(`Native lyrics not available for track ${id}:`, error);
      return null;
    }
  }
}

export const MusicService = new MusicServiceImpl();
