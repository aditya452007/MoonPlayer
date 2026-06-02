import Dexie from 'dexie';

export class MoonDatabase extends Dexie {
  constructor() {
    super('MoonDatabase');

    this.version(1).stores({
      preferences: '&id',
      playlists: '&id, name, dateUpdated', 
      tracks: '&id, albumId',
      artists: '&id',
      history: '&id, timestamp',
      lyrics: '&trackId'
    });

    this.version(2).stores({
      preferences: '&id',
      playlists: '&id, name, dateUpdated',
      tracks: '&id, albumId',
      artists: '&id',
      history: '&id, timestamp',
      lyrics: '&trackId',
      downloads: '&id, trackId, downloadedAt',
    });

    this.version(3).stores({
      preferences: '&id',
      playlists: '&id, name, dateUpdated',
      playlist_entries: '[playlistId+trackId], playlistId, trackId, order, &id',
      tracks: '&id, albumId, [albumId+id]',
      artists: '&id',
      liked_songs: '&trackId, likedAt',
      recently_played: '&trackId, playedAt, count',
      history: '&id, timestamp',
      lyrics: '&trackId',
      downloads: '&id, trackId, downloadedAt',
      cache: '&key, expiresAt',
      usage_stats: '&key',
    }).upgrade(async tx => {
      const playlists = await tx.table('playlists').toArray();
      for (const playlist of playlists) {
        if (playlist.tracks && Array.isArray(playlist.tracks)) {
          const entries = playlist.tracks.map((track, idx) => ({
            id: `${playlist.id}_${track.id}`,
            playlistId: playlist.id,
            trackId: track.id,
            order: idx,
            addedAt: playlist.dateUpdated || Date.now(),
          }));
          
          if (entries.length > 0) {
            await tx.table('playlist_entries').bulkAdd(entries).catch(() => {});
          }

          if (playlist.id === 'liked_songs') {
            const likedEntries = playlist.tracks.map(t => ({ trackId: t.id, likedAt: Date.now() }));
            if (likedEntries.length > 0) {
              await tx.table('liked_songs').bulkAdd(likedEntries).catch(() => {});
            }
          }

          if (playlist.id === 'recently_played') {
            const recentEntries = playlist.tracks.map((t, i) => ({
              trackId: t.id,
              playedAt: Date.now() - i * 60000,
              count: 1
            }));
            if (recentEntries.length > 0) {
              await tx.table('recently_played').bulkAdd(recentEntries).catch(() => {});
            }
          }
        }
      }
    });
  }

  async getPlaylistWithTracks(id) {
    const playlist = await this.playlists.get(id);
    if (!playlist) return null;
    const entries = await this.playlist_entries
      .where('playlistId')
      .equals(id)
      .sortBy('order');
    const trackIds = entries.map(e => e.trackId);
    const tracks = await this.tracks.where('id').anyOf(trackIds).toArray();
    const trackMap = new Map(tracks.map(t => [t.id, t]));
    return { 
      ...playlist, 
      tracks: trackIds.map(id => trackMap.get(id)).filter(Boolean) 
    };
  }
}

export const db = new MoonDatabase();
