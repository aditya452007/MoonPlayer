import { MusicService } from './MusicService';

const YOUTUBE_RE = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/;
const SPOTIFY_TRACK_RE = /spotify\.com\/track\/([A-Za-z0-9]+)/;
const SPOTIFY_PLAYLIST_RE = /spotify\.com\/playlist\/([A-Za-z0-9]+)/;
const MOONPLAYER_SONG_RE = /[#/]song\/([^/?]+)/;
const MOONPLAYER_ALBUM_RE = /[#/]album\/([^/?]+)/;
const MOONPLAYER_ARTIST_RE = /[#/]artist\/([^/?]+)/;
const MOONPLAYER_PLAYLIST_RE = /[#/]playlist\/([^/?]+)/;

class UrlResolverServiceImpl {
  detectUrlType(url) {
    if (YOUTUBE_RE.test(url)) return 'youtube';
    if (SPOTIFY_TRACK_RE.test(url)) return 'spotify-track';
    if (SPOTIFY_PLAYLIST_RE.test(url)) return 'spotify-playlist';
    if (MOONPLAYER_SONG_RE.test(url)) return 'moonplayer-song';
    if (MOONPLAYER_ALBUM_RE.test(url)) return 'moonplayer-album';
    if (MOONPLAYER_ARTIST_RE.test(url)) return 'moonplayer-artist';
    if (MOONPLAYER_PLAYLIST_RE.test(url)) return 'moonplayer-playlist';
    return 'unknown';
  }

  async resolveUrl(url) {
    if (!url) return { status: 'invalidUrl' };
    const type = this.detectUrlType(url);

    try {
      switch (type) {
        case 'youtube': return await this._resolveYoutube(url);
        case 'spotify-track': return await this._resolveSpotifyTrack(url);
        case 'moonplayer-song': {
          const m = url.match(MOONPLAYER_SONG_RE);
          return m ? { status: 'success', type: 'song', id: m[1] } : { status: 'invalidUrl' };
        }
        case 'moonplayer-album': {
          const m = url.match(MOONPLAYER_ALBUM_RE);
          return m ? { status: 'success', type: 'album', id: m[1] } : { status: 'invalidUrl' };
        }
        case 'moonplayer-artist': {
          const m = url.match(MOONPLAYER_ARTIST_RE);
          return m ? { status: 'success', type: 'artist', id: m[1] } : { status: 'invalidUrl' };
        }
        case 'moonplayer-playlist': {
          const m = url.match(MOONPLAYER_PLAYLIST_RE);
          return m ? { status: 'success', type: 'playlist', id: m[1] } : { status: 'invalidUrl' };
        }
        default:
          return { status: 'unsupported' };
      }
    } catch (err) {
      console.error('urlResolverService.resolveUrl failed:', err);
      return { status: 'failed', error: err.message };
    }
  }

  async _resolveYoutube(url) {
    const m = url.match(YOUTUBE_RE);
    if (!m) return { status: 'invalidUrl' };
    const videoId = m[1];
    const results = await MusicService.searchSongs(videoId, 1, 5);
    if (results.length === 0) return { status: 'failed' };
    return { status: 'success', type: 'song', track: results[0] };
  }

  async _resolveSpotifyTrack(url) {
    const m = url.match(SPOTIFY_TRACK_RE);
    if (!m) return { status: 'invalidUrl' };
    const parts = url.split('/');
    const trackName = decodeURIComponent(parts[parts.length - 1] || '').replace(/-/g, ' ');
    const results = await MusicService.searchSongs(trackName, 1, 5);
    if (results.length === 0) return { status: 'failed' };
    return { status: 'success', type: 'song', track: results[0] };
  }
}

export const urlResolverService = new UrlResolverServiceImpl();
