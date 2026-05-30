import { create } from 'zustand';
import { db } from '../core/db/schema';
import { useToastStore } from './toastStore';

/**
 * @typedef {Object} PreferencePosition
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} Preferences
 * @property {string} id - Unique identifier for preference entry (always 'user_prefs').
 * @property {string} username - User display name.
 * @property {boolean} isOnboardingComplete - Whether the onboarding flow is completed.
 * @property {'96kbps'|'160kbps'|'192kbps'|'320kbps'} streamQuality - Selected audio stream bitrate.
 * @property {boolean} dataSaverEnabled - Reduces quality on mobile if true.
 * @property {boolean} petEnabled - Whether the space pet is active.
 * @property {'astronaut'|'spacecat'} petCharacter - Selected space pet character.
 * @property {PreferencePosition} petPosition - Screen position of the pet.
 * @property {boolean} vibeTuneEnabled - Sound effects / visual sync setting.
 * @property {'aurora'|'waveform'} visualizerType - Active visualizer view mode.
 * @property {string[]} preferredLanguages - Selection of user preferred languages.
 * @property {string[]} favoriteArtists - Selected favorite artist IDs.
 * @property {number} playbackSpeed - Custom audio playback rate.
 * @property {number} crossfade - Crossfade duration in seconds.
 * @property {string} equalizerPreset - Equalizer frequency response preset.
 * @property {number} sleepTimerMinutes - Default sleep timer duration in minutes.
 * @property {boolean} notificationsEnabled - Whether push/in-app notifications are enabled.
 * @property {boolean} hasSeenGestureGuide - Track if the user viewed mobile gestures.
 */

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
  sleepTimerMinutes: 0,
  notificationsEnabled: true,
  hasSeenGestureGuide: false,
};

const PERSISTABLE_KEYS = Object.keys(DEFAULT_PREFS);

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

  /**
   * Generic updater that updates local Zustand state and persists to Dexie.
   * Rollbacks if IndexedDB write fails.
   * @param {keyof Preferences} key The preference field to update.
   * @param {any} value The new value for the field.
   */
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
      
      await db.preferences.put(prefsToSave);
    } catch (error) {
      console.error(`Failed to persist preference ${key}:`, error);
      // Rollback memory state on persistence failure (PREFS-1)
      set({ [key]: previousValue });
      useToastStore.getState().addToast('Failed to save settings changes', 'error');
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
