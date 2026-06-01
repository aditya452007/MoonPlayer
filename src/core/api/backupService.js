import { useLibraryStore } from '../../store/libraryStore';
import { usePreferenceStore } from '../../store/preferenceStore';

function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

class BackupServiceImpl {
  async exportBackup() {
    const { playlists, likedSongs, recentlyPlayed } = useLibraryStore.getState();
    const prefs = usePreferenceStore.getState();

    const persistableKeys = ['username', 'streamQuality', 'dataSaverEnabled', 'petEnabled',
      'petCharacter', 'vibeTuneEnabled', 'visualizerType', 'preferredLanguages', 'favoriteArtists',
      'playbackSpeed', 'crossfade', 'equalizerPreset', 'notificationsEnabled',
      'trackReplacementConfidence', 'lastSeenVersion'];

    const preferences = {};
    persistableKeys.forEach(k => { if (prefs[k] !== undefined) preferences[k] = prefs[k]; });

    const payload = {
      version: 1,
      appVersion: '0.1.0',
      exportedAt: new Date().toISOString(),
      preferences,
      playlists,
      likedSongs,
      recentlyPlayed,
    };

    downloadFile(JSON.stringify(payload, null, 2), `moonplayer-backup-${Date.now()}.json`, 'application/json');
    return { ok: true };
  }

  async importBackup(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!data.version || !data.appVersion) {
            reject(new Error('Invalid backup file format'));
            return;
          }

          const { updatePreference } = usePreferenceStore.getState();
          if (data.preferences) {
            for (const [k, v] of Object.entries(data.preferences)) {
              await updatePreference(k, v);
            }
          }

          const { createPlaylist, addTrackToPlaylist, toggleLikeTrack } = useLibraryStore.getState();

          if (Array.isArray(data.playlists)) {
            for (const pl of data.playlists) {
              createPlaylist(pl.name || 'Restored Playlist');
              const { playlists: current } = useLibraryStore.getState();
              const newPl = current.find(p => p.name === pl.name);
              if (newPl && Array.isArray(pl.tracks)) {
                pl.tracks.forEach(t => addTrackToPlaylist(newPl.id, t));
              }
            }
          }

          if (Array.isArray(data.likedSongs)) {
            data.likedSongs.forEach(t => toggleLikeTrack(t));
          }

          resolve({ ok: true, playlists: data.playlists?.length || 0 });
        } catch (err) {
          reject(new Error('Failed to parse backup: ' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}

export const backupService = new BackupServiceImpl();
