import { useLibraryStore } from '../../store/libraryStore';

function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

class ImportExportServiceImpl {
  async exportPlaylistAsJson(playlist) {
    const payload = JSON.stringify(playlist, null, 2);
    const safeName = playlist.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadFile(payload, `${safeName}.json`, 'application/json');
  }

  async exportAllPlaylistsAsJson() {
    const { playlists, likedSongs } = useLibraryStore.getState();
    const payload = JSON.stringify({ playlists, likedSongs, exportedAt: new Date().toISOString() }, null, 2);
    downloadFile(payload, 'moonplayer_library.json', 'application/json');
  }

  async importPlaylistFromJson(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          const { createPlaylist, addTrackToPlaylist } = useLibraryStore.getState();

          if (data.playlists && Array.isArray(data.playlists)) {
            data.playlists.forEach(pl => {
              createPlaylist(pl.name || 'Imported Playlist');
              const { playlists } = useLibraryStore.getState();
              const newPl = playlists.find(p => p.name === pl.name);
              if (newPl && Array.isArray(pl.tracks)) {
                pl.tracks.forEach(track => addTrackToPlaylist(newPl.id, track));
              }
            });
            resolve({ imported: data.playlists.length });
          } else if (data.id && data.name) {
            createPlaylist(data.name);
            const { playlists } = useLibraryStore.getState();
            const newPl = playlists.find(p => p.name === data.name);
            if (newPl && Array.isArray(data.tracks)) {
              data.tracks.forEach(track => addTrackToPlaylist(newPl.id, track));
            }
            resolve({ imported: 1 });
          } else {
            reject(new Error('Unrecognized JSON format'));
          }
        } catch (err) {
          reject(new Error('Invalid JSON file: ' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  async exportToM3U(playlist) {
    const lines = ['#EXTM3U'];
    (playlist.tracks || []).forEach(track => {
      lines.push(`#EXTINF:${track.duration || -1},${track.artistNames?.join(', ')} - ${track.title}`);
      lines.push(track.streamUrl || '');
    });
    const safeName = playlist.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadFile(lines.join('\n'), `${safeName}.m3u`, 'audio/x-mpegurl');
  }

  async importFromM3U(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const lines = e.target.result.split('\n').map(l => l.trim()).filter(Boolean);
        const tracks = [];
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('#EXTINF:')) {
            const info = lines[i].replace('#EXTINF:', '');
            const commaIdx = info.indexOf(',');
            const title = commaIdx >= 0 ? info.slice(commaIdx + 1) : 'Unknown';
            const url = lines[i + 1] && !lines[i + 1].startsWith('#') ? lines[i + 1] : '';
            tracks.push({ id: `m3u_${Date.now()}_${i}`, title, streamUrl: url, artistNames: [], imageUrl: '' });
            i++;
          }
        }
        if (tracks.length === 0) {
          reject(new Error('No tracks found in M3U file'));
          return;
        }
        const playlistName = file.name.replace(/\.[^/.]+$/, '') || 'Imported';
        const { createPlaylist, addTrackToPlaylist } = useLibraryStore.getState();
        createPlaylist(playlistName);
        const { playlists } = useLibraryStore.getState();
        const newPl = playlists.find(p => p.name === playlistName);
        if (newPl) tracks.forEach(t => addTrackToPlaylist(newPl.id, t));
        resolve({ imported: tracks.length });
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}

export const importExportService = new ImportExportServiceImpl();
