import { playlistDAO } from '../data-access/playlistDAO';
import { playlistEntryDAO } from '../data-access/playlistEntryDAO';
import { trackDAO } from '../data-access/trackDAO';

export class PlaylistRepository {
  async getAllPlaylists() {
    return playlistDAO.getAll();
  }

  async getPlaylist(id) {
    return playlistDAO.get(id);
  }

  async createPlaylist(name, description) {
    const playlist = {
      id: crypto.randomUUID(),
      name,
      description: description || null,
      tracks: [],
      coverImage: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      trackCount: 0,
    };
    await playlistDAO.put(playlist);
    return playlist;
  }

  async deletePlaylist(id) {
    return playlistDAO.delete(id);
  }

  async renamePlaylist(id, newName) {
    const playlist = await playlistDAO.get(id);
    if (!playlist) throw new Error('Playlist not found');
    playlist.name = newName;
    playlist.updatedAt = Date.now();
    await playlistDAO.put(playlist);
    return playlist;
  }

  async addTrack(playlistId, track) {
    const playlist = await playlistDAO.get(playlistId);
    if (!playlist) throw new Error('Playlist not found');
    if (playlist.tracks.some(t => t.id === track.id)) return playlist;

    await trackDAO.put(track);
    await playlistEntryDAO.add(playlistId, track.id);

    playlist.tracks.push(track);
    playlist.trackCount = playlist.tracks.length;
    playlist.updatedAt = Date.now();
    await playlistDAO.put(playlist);
    return playlist;
  }

  async removeTrack(playlistId, trackId) {
    const playlist = await playlistDAO.get(playlistId);
    if (!playlist) throw new Error('Playlist not found');

    await playlistEntryDAO.remove(playlistId, trackId);

    playlist.tracks = playlist.tracks.filter(t => t.id !== trackId);
    playlist.trackCount = playlist.tracks.length;
    playlist.updatedAt = Date.now();
    await playlistDAO.put(playlist);
    return playlist;
  }
}

export const playlistRepository = new PlaylistRepository();
