import { create } from 'zustand';
import { localMusicService } from '../core/api/localMusicService';

export const useLocalMusicStore = create((set) => ({
  localTracks: [],
  isScanning: false,
  scanError: null,

  scanDirectory: async () => {
    set({ isScanning: true, scanError: null });
    try {
      const tracks = await localMusicService.scanDirectory();
      set({ localTracks: tracks, isScanning: false });
      return tracks;
    } catch (err) {
      set({ isScanning: false, scanError: err.message });
      throw err;
    }
  },

  scanFiles: async () => {
    set({ isScanning: true, scanError: null });
    try {
      const tracks = await localMusicService.scanFiles();
      set(s => ({ localTracks: [...s.localTracks, ...tracks], isScanning: false }));
      return tracks;
    } catch (err) {
      set({ isScanning: false, scanError: err.message });
      throw err;
    }
  },

  clearLocalTracks: () => set({ localTracks: [], scanError: null }),
}));
