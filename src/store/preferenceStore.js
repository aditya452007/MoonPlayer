import { create } from 'zustand';
import { preferenceDAO } from '../core/data-access/preferenceDAO';
import { useToastStore } from './toastStore';

const DEFAULT_PREFS = {
  id: 'user_prefs',
  username: 'Guest',
  isOnboardingComplete: false,
  streamQuality: '320kbps',
  dataSaverEnabled: false,
  petEnabled: true,
  petCharacter: 'astronaut',
  petPosition: { x: 20, y: 20 },
  vibeTuneEnabled: true,
  visualizerType: 'aurora',
  preferredLanguages: ['hindi', 'english'],
  favoriteArtists: [],
  playbackSpeed: 1.0,
  crossfade: 3,
  equalizerPreset: 'Normal',
  sleepTimerMinutes: 0,
  notificationsEnabled: true,
  hasSeenGestureGuide: true,
  lastSeenVersion: '',
  trackReplacementConfidence: 65,
};

const PERSISTABLE_KEYS = Object.keys(DEFAULT_PREFS);

export const usePreferenceStore = create((set, get) => ({
  ...DEFAULT_PREFS,
  isHydrated: false,

  hydrate: async () => {
    try {
      const storedPrefs = await preferenceDAO.get();
      if (storedPrefs) {
        set({ ...storedPrefs, isHydrated: true });
      } else {
        await preferenceDAO.replace(DEFAULT_PREFS);
        set({ isHydrated: true });
      }
    } catch (error) {
      console.error('Failed to hydrate preferences:', error);
      set({ isHydrated: true });
    }
  },

  updatePreference: async (key, value) => {
    const previousValue = get()[key];
    set({ [key]: value });
    
    try {
      const currentPrefs = get();
      const prefsToSave = {};
      
      PERSISTABLE_KEYS.forEach((k) => {
        if (currentPrefs[k] !== undefined) {
          prefsToSave[k] = currentPrefs[k];
        }
      });
      
      await preferenceDAO.replace(prefsToSave);
    } catch (error) {
      console.error(`Failed to persist preference ${key}:`, error);
      set({ [key]: previousValue });
      useToastStore.getState().addToast('Failed to save settings changes', 'error');
    }
  },

  clearCache: async () => {
    try {
      const { db } = await import('../core/db/schema');
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
