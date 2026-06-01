class LocalMusicServiceImpl {
  async scanDirectory() {
    if (!('showDirectoryPicker' in window)) {
      throw new Error('File System Access API is not supported in this browser. Try Chrome or Edge.');
    }

    const dirHandle = await window.showDirectoryPicker({ mode: 'read' });
    const audioExtensions = new Set(['.mp3', '.m4a', '.ogg', '.wav', '.flac', '.aac', '.opus', '.weba']);
    const tracks = [];

    for await (const [name, handle] of dirHandle) {
      if (handle.kind !== 'file') continue;
      const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
      if (!audioExtensions.has(ext)) continue;

      const file = await handle.getFile();
      const url = URL.createObjectURL(file);

      tracks.push({
        id: `local_${file.name}_${file.lastModified}`,
        title: name.replace(/\.[^/.]+$/, ''),
        artistNames: ['Local File'],
        albumName: '',
        albumId: '',
        artistIds: [],
        duration: 0,
        streamUrl: url,
        imageUrl: '',
        lyricsId: null,
        isLocal: true,
        fileName: name,
        fileSize: file.size,
      });
    }

    return tracks;
  }

  async scanFiles() {
    return new Promise((resolve, _reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'audio/*';
      input.onchange = (e) => {
        const files = Array.from(e.target.files || []);
        const tracks = files.map(file => ({
          id: `local_${file.name}_${file.lastModified}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          artistNames: ['Local File'],
          albumName: '',
          albumId: '',
          artistIds: [],
          duration: 0,
          streamUrl: URL.createObjectURL(file),
          imageUrl: '',
          lyricsId: null,
          isLocal: true,
          fileName: file.name,
          fileSize: file.size,
        }));
        resolve(tracks);
      };
      input.oncancel = () => resolve([]);
      input.click();
    });
  }
}

export const localMusicService = new LocalMusicServiceImpl();
