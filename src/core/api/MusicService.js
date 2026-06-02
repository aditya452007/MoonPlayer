import { globalRequestQueue } from './RequestQueue';
import { apiCircuitBreaker } from '../errors/CircuitBreaker';

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

function extractBestImage(imageArray) {
  if (!Array.isArray(imageArray) || imageArray.length === 0) return '';
  const target = imageArray.find(img => img.quality === '500x500');
  if (target) return target.url || target.link || '';
  const last = imageArray[imageArray.length - 1];
  return last.url || last.link || '';
}

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

function normalizeTrack(raw, userQuality = '320kbps', dataSaver = false) {
  if (!raw || typeof raw !== 'object') return null;
  try {
    let artistNames = [];
    let artistIds = [];

    if (raw.artists && Array.isArray(raw.artists.primary) && raw.artists.primary.length > 0) {
      artistNames = raw.artists.primary.map(a => decodeHtmlEntities(a.name || '')).filter(Boolean);
      artistIds   = raw.artists.primary.map(a => String(a.id || '')).filter(Boolean);
    } else if (typeof raw.primaryArtists === 'string') {
      const primaryArtistsId = typeof raw.primaryArtistsId === 'string' ? raw.primaryArtistsId : '';
      artistNames = raw.primaryArtists.split(',').map(n => decodeHtmlEntities(n.trim())).filter(Boolean);
      artistIds   = primaryArtistsId.split(',').map(id => id.trim()).filter(Boolean);
    }

    if (artistNames.length === 0) artistNames = ['Unknown Artist'];

    const title = decodeHtmlEntities(raw.name || raw.title || 'Unknown Track');

    const album = raw.album || {};
    const albumId   = String(album.id   || '');
    const albumName = decodeHtmlEntities(album.name || '');

    const duration = parseInt(raw.duration || 0, 10);

    const lyricsId = raw.lyricsId
      ? String(raw.lyricsId)
      : (raw.hasLyrics === true || raw.hasLyrics === 'true')
        ? String(raw.id)
        : null;

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

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

class MusicServiceImpl {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://saavn.dev';
  }

  async _fetch(endpoint, signal = null, retries = 3) {
    return apiCircuitBreaker.call(async () => {
      let lastError;
      for (let attempt = 0; attempt <= retries; attempt++) {
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

        try {
          await globalRequestQueue.enqueue(() => Promise.resolve());
          if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

          const response = await fetch(`${this.baseUrl}${endpoint}`, { signal });
          if (!response.ok) {
            if (response.status === 429) {
              const retryAfter = parseInt(response.headers.get('retry-after') || '2', 10);
              await sleep(retryAfter * 1000);
              continue;
            }
            if (response.status >= 400 && response.status < 500) {
              throw new Error(`API Error: HTTP ${response.status}`);
            }
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
          if (error.name === 'AbortError') throw error;
          lastError = error;
          if (attempt < retries) {
            const delay = Math.min(1000 * Math.pow(2, attempt), 4000);
            console.warn(`API retry ${attempt + 1}/${retries} after ${delay}ms:`, error.message);
            await sleep(delay);
          }
        }
      }
      throw lastError;
    });
  }

  async searchSongs(query, page = 1, limit = 10, quality = '320kbps', dataSaver = false, signal = null) {
    if (!query) return [];
    try {
      const encodedQuery = encodeURIComponent(query);
      const data = await this._fetch(`/api/search/songs?query=${encodedQuery}&page=${page}&limit=${limit}`, signal);

      if (!data || !data.results) return [];

      return data.results
        .map(raw => normalizeTrack(raw, quality, dataSaver))
        .filter(track => track !== null);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('MusicService.searchSongs failed:', error);
      }
      return [];
    }
  }

  async searchAll(query, quality = '320kbps', dataSaver = false, signal = null) {
    if (!query) return { songs: [], albums: [], artists: [], playlists: [] };
    try {
      const encodedQuery = encodeURIComponent(query);
      const data = await this._fetch(`/api/search?query=${encodedQuery}`, signal);
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
      if (error.name !== 'AbortError') {
        console.error('MusicService.searchAll failed:', error);
      }
      return { songs: [], albums: [], artists: [], playlists: [] };
    }
  }

  async getTrackDetails(id, quality = '320kbps', dataSaver = false, signal = null) {
    try {
      const data = await this._fetch(`/api/songs/${id}`, signal);

      const rawSong = Array.isArray(data) ? data[0] : data;
      if (!rawSong) throw new Error('Track not found');

      const track = normalizeTrack(rawSong, quality, dataSaver);
      if (!track) throw new Error('Failed to normalize track payload');
      return track;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error(`MusicService.getTrackDetails failed for ID ${id}:`, error);
      }
      throw error;
    }
  }

  async getTrending(quality = '320kbps', dataSaver = false, signal = null) {
    return this.searchSongs('top hits', 1, 15, quality, dataSaver, signal);
  }

  async getAlbumDetails(id, quality = '320kbps', dataSaver = false, signal = null) {
    try {
      const data = await this._fetch(`/api/albums?id=${id}`, signal);
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
      if (error.name !== 'AbortError') {
        console.error(`MusicService.getAlbumDetails failed for ID ${id}:`, error);
      }
      throw error;
    }
  }

  async getArtistDetails(id, quality = '320kbps', dataSaver = false, signal = null) {
    try {
      const data = await this._fetch(`/api/artists/${id}`, signal);
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
      if (error.name !== 'AbortError') {
        console.error(`MusicService.getArtistDetails failed for ID ${id}:`, error);
      }
      throw error;
    }
  }

  async getPlaylistDetails(id, quality = '320kbps', dataSaver = false, signal = null) {
    try {
      const data = await this._fetch(`/api/playlists?id=${id}`, signal);
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
      if (error.name !== 'AbortError') {
        console.error(`MusicService.getPlaylistDetails failed for ID ${id}:`, error);
      }
      throw error;
    }
  }

  async getLyrics(id, signal = null) {
    if (!id) return null;
    try {
      const data = await this._fetch(`/api/songs/${id}/lyrics`, signal);
      return data;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.warn(`Native lyrics not available for track ${id}:`, error);
      }
      return null;
    }
  }
}

export const MusicService = new MusicServiceImpl();
