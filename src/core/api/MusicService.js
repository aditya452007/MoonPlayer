/**
 * Safe, DOM-free HTML entity decoder.
 * Used internally by MusicService.
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

// Internal MusicService utility
function extractBestImage(imageArray) {
  if (!Array.isArray(imageArray) || imageArray.length === 0) return "";
  
  // Target high-res explicitly
  const target = imageArray.find(img => img.quality === "500x500");
  if (target) return target.link;
  
  // Fallback to highest index (assumed highest available)
  return imageArray[imageArray.length - 1].link;
}

// Internal MusicService utility
function extractStreamUrl(downloadUrlArray, userPreferenceQuality, dataSaverEnabled) {
  if (!Array.isArray(downloadUrlArray) || downloadUrlArray.length === 0) return "";
  
  // Build a Map of quality to link for O(1) lookups
  const urlMap = new Map();
  for (const item of downloadUrlArray) {
    if (item && item.quality) {
      urlMap.set(item.quality, item.link);
    }
  }

  const targetQuality = dataSaverEnabled ? '96kbps' : userPreferenceQuality;
  const targetLink = urlMap.get(targetQuality);
  if (targetLink) return targetLink;
  
  // Standard fallback cascade if preferred is missing
  let cascade = ["320kbps", "192kbps", "160kbps", "96kbps", "48kbps", "12kbps"];
  
  // If data saver is on, limit the cascade to 96kbps and below
  if (dataSaverEnabled) {
    cascade = ["96kbps", "48kbps", "12kbps"];
  }

  for (const quality of cascade) {
    const matchedLink = urlMap.get(quality);
    if (matchedLink) return matchedLink;
  }
  
  return downloadUrlArray[downloadUrlArray.length - 1].link;
}

/**
 * Normalizes a raw JioSaavn song object into our strict Track interface
 */
function normalizeTrack(raw, userQuality = '320kbps', dataSaver = false) {
  try {
    const artistNames = (raw.primaryArtists || '').split(',').map(name => decodeHtmlEntities(name.trim()));
    const artistIds = (raw.primaryArtistsId || '').split(',').map(id => id.trim());

    return {
      id: String(raw.id),
      title: decodeHtmlEntities(raw.name),
      artistNames: artistNames,
      artistIds: artistIds,
      albumId: String(raw.album?.id || ''),
      albumName: decodeHtmlEntities(raw.album?.name || ''),
      duration: parseInt(raw.duration || 0, 10),
      streamUrl: extractStreamUrl(raw.downloadUrl, userQuality, dataSaver),
      imageUrl: extractBestImage(raw.image),
      lyricsId: (raw.hasLyrics === true || raw.hasLyrics === 'true') ? String(raw.id) : null
    };
  } catch (error) {
    console.error("Failed to normalize track payload:", error, raw);
    return null;
  }
}

class MusicServiceImpl {
  constructor() {
    this.baseUrl = 'https://saavn.dev';
  }

  /**
   * Helper to execute API calls with basic error handling
   */
  async _fetch(endpoint) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(`API returned success: false - ${data.message || 'Unknown error'}`);
      }
      return data.data;
    } catch (error) {
      console.error(`MusicService request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Search for songs
   */
  async searchSongs(query, page = 1, limit = 10, quality = '320kbps', dataSaver = false) {
    if (!query) return [];
    const encodedQuery = encodeURIComponent(query);
    const data = await this._fetch(`/api/search/songs?query=${encodedQuery}&page=${page}&limit=${limit}`);
    
    if (!data || !data.results) return [];
    
    return data.results
      .map(raw => normalizeTrack(raw, quality, dataSaver))
      .filter(track => track !== null);
  }

  /**
   * Get single track details (JIT stream resolution)
   */
  async getTrackDetails(id, quality = '320kbps', dataSaver = false) {
    const data = await this._fetch(`/api/songs/${id}`);
    
    if (!data || !data[0]) {
      throw new Error('Track not found');
    }
    
    const track = normalizeTrack(data[0], quality, dataSaver);
    if (!track) throw new Error('Failed to normalize track');
    return track;
  }

  /**
   * Fetches the trending / top charting songs for the home page.
   * Note: We use global search with a common query like "trending" 
   * or a known playlist ID if a specific endpoint isn't provided.
   * For this demo, let's just search "top hits".
   */
  async getTrending(quality = '320kbps', dataSaver = false) {
    // In a real app we might fetch a specific JioSaavn charting playlist
    return this.searchSongs('top hits', 1, 15, quality, dataSaver);
  }

  /**
   * Fetches lyrics from JioSaavn API
   */
  async getLyrics(id) {
    if (!id) return null;
    try {
      const data = await this._fetch(`/api/songs/${id}/lyrics`);
      return data;
    } catch {
      console.warn(`Native lyrics not available for track ${id}`);
      return null;
    }
  }
}

export const MusicService = new MusicServiceImpl();
