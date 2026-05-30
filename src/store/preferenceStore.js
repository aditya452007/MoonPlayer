import { create } from 'zustand';
import { db } from '../core/db/schema';

const DEFAULT_PREFS = {
  id: 'user_prefs',
  username: 'Guest',
  isOnboardingComplete: false,
  streamQuality: '320kbps', // High, Med, Low (mapped to bitrates in MusicService)
  dataSaverEnabled: false,
  petEnabled: true,
  petCharacter: 'astronaut', // 'astronaut' or 'spacecat'
  petPosition: { x: 20, y: 20 },
  vibeTuneEnabled: true,
  visualizerType: 'aurora', // 'aurora' or 'waveform'
  preferredLanguages: ['hindi', 'english'],
  favoriteArtists: [],
  playbackSpeed: 1.0,
  crossfade: 3,
  equalizerPreset: 'Normal',
  notificationsEnabled: true,
  hasSeenGestureGuide: false,
};

export const usePreferenceStore = create((set, get) => ({
  ...DEFAULT_PREFS,
  isHydrated: false, // True once Dexie data is loaded

  // Initialize from Dexie on startup
  hydrate: async () => {
    try {
      const storedPrefs = await db.preferences.get('user_prefs');
      if (storedPrefs) {
        set({ ...storedPrefs, isHydrated: true });
      } else {
        // First launch, save defaults
        await db.preferences.put(DEFAULT_PREFS);
        set({ isHydrated: true });
      }
    } catch (error) {
      console.error('Failed to hydrate preferences:', error);
      set({ isHydrated: true }); // Still mark hydrated to not block UI
    }
  },

  // Generic updater that persists to Dexie
  updatePreference: async (key, value) => {
    set({ [key]: value });
    
    // Fire and forget persistence
    try {
      const currentPrefs = get();
      const prefsToSave = { ...currentPrefs };
      delete prefsToSave.isHydrated; // Don't persist UI state flag
      delete prefsToSave.hydrate;
      delete prefsToSave.updatePreference;
      
      await db.preferences.put(prefsToSave);
    } catch (error) {
      console.error(`Failed to persist preference ${key}:`, error);
    }
  },

  clearCache: async () => {
    try {
      await Promise.all([
        db.tracks.clear(),
        db.artists.clear(),
        db.lyrics.clear()
      ]);
      return true;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }
}));
