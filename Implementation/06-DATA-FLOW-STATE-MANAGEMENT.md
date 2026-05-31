# MoonPlayer Data Flow & State Management — Implementation Guide

**Reference**: BloomeeTunes (Flutter/Dart) → MoonPlayer (React/JavaScript)  
**Goal**: Port proven data layer and state management patterns from BloomeeTunes into MoonPlayer's React/Zustand codebase.

---

## 1. Data Layer Architecture Restructure

### BloomeeTunes Pattern
Strict 5-layer unidirectional architecture: `UI → State (Blocs/Cubits) → Repositories → DAOs → Isar DB`. Rules: UI never imports DAOs or DB types. State only uses domain types. DAOs own all DB-to-domain mapping via pure function mappers.

### MoonPlayer Current State
Components import stores or API services directly (`src/views/pages/Home.jsx:3` imports `recommendationService` directly, `src/components/player/BottomPlaybar/BottomPlaybar.jsx:2` imports `usePlayerStore` directly). API calls in `MusicService.js` return raw data — no repository layer, no DAOs, no domain models.

### The Gap
No separation between data access and business logic. Changes to the API provider or persistence layer cascade through every consumer. No cached/remote distinction. No domain types.

### Implementation Steps

1. **Create domain type definitions** in `src/core/types.js`:
```javascript
// src/core/types.js — Domain types (no DB/API imports)
/**
 * @typedef {Object} Track
 * @property {string} id
 * @property {string} title
 * @property {string[]} artistNames
 * @property {string[]} artistIds
 * @property {string} albumId
 * @property {string} albumName
 * @property {number} duration
 * @property {string} streamUrl
 * @property {string} imageUrl
 * @property {string|null} lyricsId
 */

/**
 * @typedef {Object} Playlist
 * @property {string} id
 * @property {string} name
 * @property {string|null} description
 * @property {Track[]} tracks
 * @property {string|null} coverImage
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {number} trackCount
 */

/**
 * @typedef {'network'|'api'|'audio'|'storage'|'unknown'} ErrorCategory
 * @typedef {Object} AppError
 * @property {string} message
 * @property {ErrorCategory} category
 * @property {boolean} recoverable
 * @property {number} timestamp
 * @property {string} [stack]
 */
```

2. **Create `src/core/repositories/` directory** with three repository classes:

```javascript
// src/core/repositories/TrackRepository.js
import { MusicService } from '../api/MusicService';
import { trackDAO } from '../data-access/trackDAO';
import { CacheLRU } from '../utils/CacheLRU';

const streamUrlCache = new CacheLRU(200); // L1 memory cache

export class TrackRepository {
  /**
   * Gets track details with L1→L2→API resolution.
   * @param {string} id
   * @param {Object} options
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<import('../types').Track>}
   */
  async getTrackDetails(id, { signal, quality, dataSaver } = {}) {
    // Check L1 memory cache
    const cached = streamUrlCache.get(id);
    if (cached) return cached;

    // Check L2 IndexedDB
    const stored = await trackDAO.get(id);
    if (stored && stored.streamUrl) {
      streamUrlCache.set(id, stored);
      return stored;
    }

    // Fetch from API
    const track = await MusicService.getTrackDetails(id, quality, dataSaver, signal);
    if (track) {
      streamUrlCache.set(id, track);
      await trackDAO.put(track);
    }
    return track;
  }

  /**
   * Searches tracks with normalized results.
   * @param {string} query
   * @param {Object} options
   * @returns {Promise<import('../types').Track[]>}
   */
  async searchTracks(query, { page, limit, quality, dataSaver, signal } = {}) {
    const results = await MusicService.searchSongs(query, page, limit, quality, dataSaver, signal);
    // Batch cache results in background
    results.forEach(t => trackDAO.put(t).catch(() => {}));
    return results;
  }

  invalidateCache(id) {
    streamUrlCache.delete(id);
  }

  clearCache() {
    streamUrlCache.clear();
  }
}

export const trackRepository = new TrackRepository();
```

```javascript
// src/core/repositories/PlaylistRepository.js
import { db } from '../db/schema';
import { playlistDAO } from '../data-access/playlistDAO';
import { MusicService } from '../api/MusicService';

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
    playlist.tracks.push(track);
    playlist.trackCount = playlist.tracks.length;
    playlist.updatedAt = Date.now();
    await playlistDAO.put(playlist);
    return playlist;
  }

  async removeTrack(playlistId, trackId) {
    const playlist = await playlistDAO.get(playlistId);
    if (!playlist) throw new Error('Playlist not found');
    playlist.tracks = playlist.tracks.filter(t => t.id !== trackId);
    playlist.trackCount = playlist.tracks.length;
    playlist.updatedAt = Date.now();
    await playlistDAO.put(playlist);
    return playlist;
  }
}

export const playlistRepository = new PlaylistRepository();
```

```javascript
// src/core/repositories/SettingsRepository.js
import { preferenceDAO } from '../data-access/preferenceDAO';

const DEFAULTS = {
  username: 'Guest',
  streamQuality: '320kbps',
  dataSaverEnabled: false,
  petEnabled: true,
  petCharacter: 'astronaut',
  playbackSpeed: 1.0,
  crossfade: 3,
  equalizerPreset: 'Normal',
  notificationsEnabled: true,
};

export class SettingsRepository {
  async getAll() {
    const stored = await preferenceDAO.get();
    return { ...DEFAULTS, ...stored };
  }

  async update(key, value) {
    await preferenceDAO.upsert(key, value);
  }
}

export const settingsRepository = new SettingsRepository();
```

3. **Create `src/core/data-access/` directory** with DAO modules:

```javascript
// src/core/data-access/trackDAO.js
import { db } from '../db/schema';

export const trackDAO = {
  /** @param {string} id */
  async get(id) {
    return db.tracks.get(id) || null;
  },

  /** @param {import('../types').Track} track */
  async put(track) {
    return db.tracks.put(track);
  },

  async delete(id) {
    return db.tracks.delete(id);
  },

  async getAll() {
    return db.tracks.toArray();
  },

  async getByAlbum(albumId) {
    return db.tracks.where('albumId').equals(albumId).toArray();
  },
};
```

```javascript
// src/core/data-access/playlistDAO.js
import { db } from '../db/schema';

export const playlistDAO = {
  /** @param {string} id */
  async get(id) {
    return db.playlists.get(id) || null;
  },

  /** @param {Object} playlist */
  async put(playlist) {
    return db.playlists.put(playlist);
  },

  async delete(id) {
    return db.playlists.delete(id);
  },

  async getAll() {
    return db.playlists.toArray();
  },
};
```

```javascript
// src/core/data-access/preferenceDAO.js
import { db } from '../db/schema';

const PREF_ID = 'user_prefs';

export const preferenceDAO = {
  async get() {
    return db.preferences.get(PREF_ID) || null;
  },

  /** @param {string} key @param {any} value */
  async upsert(key, value) {
    const existing = (await db.preferences.get(PREF_ID)) || {};
    existing[key] = value;
    return db.preferences.put(existing);
  },

  /** @param {Object} prefs */
  async replace(prefs) {
    return db.preferences.put({ id: PREF_ID, ...prefs });
  },

  async delete() {
    return db.preferences.delete(PREF_ID);
  },
};
```

### Files to Create
- `src/core/types.js`
- `src/core/repositories/TrackRepository.js`
- `src/core/repositories/PlaylistRepository.js`
- `src/core/repositories/SettingsRepository.js`
- `src/core/data-access/trackDAO.js`
- `src/core/data-access/playlistDAO.js`
- `src/core/data-access/preferenceDAO.js`

### Files to Modify
- `src/core/api/MusicService.js` — add `AbortSignal` param to all methods
- `src/store/libraryStore.js` — replace direct `db.playlists.put/get` calls with `playlistRepository`
- `src/store/preferenceStore.js` — replace direct `db.preferences.get/put` with `preferenceDAO`

### Migration/Risk Notes
- **Incremental — not a rewrite**: Keep existing store+API code. Introduce repositories alongside. Migrate one consumer at a time. The `TrackRepository` is the highest-value first target (used by player, queue, search, recommendations).
- **Risk**: Existing stores call `db` directly. If both the store and a new repository write to the same Dexie table, they'll conflict. Migrate in order: start with read-only paths (Home page recommendations → TrackRepository), then write paths.
- **Testing**: DAOs are thin wrappers over Dexie — test via Dexie's own test utilities. Repositories should be tested with mocked DAOs.

---

## 2. State Management Enhancement

### BloomeeTunes Pattern
17 cubits/blocs for specific concerns (ContentBloc, PlayerBloc, PlaylistBloc, LibraryBloc, SettingsBloc, etc.). All states extend `Equatable` for referential equality checks, suppressing unnecessary rebuilds. UI subscribes only to the slices it needs via `context.select()` or `BlocSelector`.

### MoonPlayer Current State
4 Zustand stores managing too many concerns:
- `playerStore` (`src/store/playerStore.js:14-372`): playback state, queue management, UI visibility toggles, sleep timer — 395 lines
- `libraryStore` (`src/store/libraryStore.js:25-272`): playlists, liked songs, recently played — 273 lines
- `preferenceStore` (`src/store/preferenceStore.js:56-119`): all user settings in one flat object
- `toastStore` (`src/store/toastStore.js:5-57`): ephemeral toasts

Components subscribe to entire stores and destructure what they need (`src/components/player/BottomPlaybar/BottomPlaybar.jsx:15-32`), causing re-renders on unrelated state changes.

### The Gap
No store splitting, no selector optimization, no cross-store consistency enforcement.

### Implementation Steps

1. **Split `playerStore` into `playerStore` + `queueStore`**:

```javascript
// src/store/playerStore.js — Refactored: playback only
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AudioEngine } from '../core/audio/AudioEngine';
import { useToastStore } from './toastStore';

export const usePlayerStore = create(
  persist(
    (set, get) => ({
      currentTrack: null,
      isPlaying: false,
      volume: 1,
      isMuted: false,
      previousVolume: 1,
      progress: 0,
      loopMode: 'none',
      isShuffled: false,
      // UI state
      isQueueVisible: false,
      isFullscreen: false,
      isLyricsVisible: false,
      sleepTimerEnd: null,

      // Playback actions only
      play: (track) => {
        if (!track) return;
        if (!track.streamUrl) {
          useToastStore.getState().addToast('No stream URL available', 'error');
          return;
        }
        try {
          AudioEngine.playTrack(track.streamUrl, get().volume);
          AudioEngine.updateMediaSession(track);
          set({ currentTrack: track, isPlaying: true, progress: 0 });
        } catch (error) {
          console.error('play failed:', error);
          useToastStore.getState().addToast('Playback failed to start', 'error');
        }
      },

      pause: () => {
        AudioEngine.pause();
        set({ isPlaying: false });
      },

      resume: () => {
        AudioEngine.resume();
        set({ isPlaying: true });
      },

      seek: (seconds) => {
        const clamped = Math.max(0, seconds);
        AudioEngine.seek(clamped);
        set({ progress: clamped });
      },

      setVolume: (volume) => {
        const clamped = Math.max(0, Math.min(1, volume));
        AudioEngine.setVolume(clamped);
        set({ volume: clamped, isMuted: clamped === 0 });
      },

      toggleMute: () => {
        const { isMuted, previousVolume, volume } = get();
        if (isMuted) {
          const newVol = previousVolume > 0 ? previousVolume : 1;
          AudioEngine.setVolume(newVol);
          set({ volume: newVol, isMuted: false });
        } else {
          AudioEngine.setVolume(0);
          set({ isMuted: true, previousVolume: volume, volume: 0 });
        }
      },

      toggleLoop: () => set(state => {
        const modes = { none: 'all', all: 'one', one: 'none' };
        return { loopMode: modes[state.loopMode] };
      }),

      toggleShuffled: () => set(state => ({ isShuffled: !state.isShuffled })),

      setSleepTimer: (minutes) => { /* existing logic */ },
      toggleQueueVisibility: () => set(s => ({ isQueueVisible: !s.isQueueVisible })),
      toggleFullscreen: () => set(s => ({ isFullscreen: !s.isFullscreen })),
      toggleLyrics: () => set(s => ({ isLyricsVisible: !s.isLyricsVisible })),
    }),
    {
      name: 'moonplayer-playback',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentTrack: state.currentTrack,
        volume: state.volume,
        loopMode: state.loopMode,
        isShuffled: state.isShuffled,
        isMuted: state.isMuted,
        previousVolume: state.previousVolume,
      }),
    }
  )
);
```

```javascript
// src/store/queueStore.js — NEW: queue management only
import { create } from 'zustand';
import { useToastStore } from './toastStore';

export const useQueueStore = create((set, get) => ({
  queue: [],
  queueIndex: -1,

  setQueue: (tracks, startIndex = 0) => set({ queue: tracks, queueIndex: startIndex }),

  playNext: (track) => {
    if (!track) return;
    set(state => {
      const filtered = state.queue.filter(t => t.id !== track.id);
      const insertIdx = state.queueIndex + 1;
      filtered.splice(insertIdx, 0, track);
      return { queue: filtered };
    });
    useToastStore.getState().addToast('Added to play next', 'success');
  },

  addToQueue: (tracks) => {
    const toAdd = Array.isArray(tracks) ? tracks : [tracks];
    set(state => {
      const existing = new Set(state.queue.map(t => t.id));
      const unique = toAdd.filter(t => !existing.has(t.id));
      return { queue: [...state.queue, ...unique] };
    });
  },

  removeFromQueue: (index) => set(state => {
    if (index === state.queueIndex) return state;
    const newQueue = [...state.queue];
    newQueue.splice(index, 1);
    const newIndex = index < state.queueIndex ? state.queueIndex - 1 : state.queueIndex;
    return { queue: newQueue, queueIndex: newIndex };
  }),

  clearQueue: () => set(state => ({
    queue: state.queue.length > 0 ? [state.queue[state.queueIndex]] : [],
    queueIndex: 0,
  })),

  reorderQueue: (newQueue) => set(state => {
    const idx = newQueue.findIndex(t => t.id === state.queue[state.queueIndex]?.id);
    return { queue: newQueue, queueIndex: idx >= 0 ? idx : 0 };
  }),

  shuffleQueue: () => set(state => {
    if (state.queue.length <= 1) return state;
    const current = state.queue[state.queueIndex];
    const rest = state.queue.filter((_, i) => i !== state.queueIndex);
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    return { queue: [current, ...rest], queueIndex: 0 };
  }),
}));
```

2. **Split `libraryStore` into `libraryStore` + `likesStore` + `historyStore`**:

```javascript
// src/store/libraryStore.js — Refactored: playlists only
import { create } from 'zustand';
import { playlistRepository } from '../core/repositories/PlaylistRepository';

export const useLibraryStore = create((set, get) => ({
  playlists: [],
  isHydrated: false,
  hydrationError: null,

  hydrate: async () => {
    try {
      const playlists = await playlistRepository.getAllPlaylists();
      const custom = playlists.filter(p => p.id !== 'liked_songs' && p.id !== 'recently_played');
      set({ playlists: custom, isHydrated: true, hydrationError: null });
    } catch (error) {
      set({ isHydrated: true, hydrationError: error.message });
    }
  },

  createPlaylist: async (name, description) => {
    const prev = get().playlists;
    const playlist = await playlistRepository.createPlaylist(name, description);
    set(s => ({ playlists: [...s.playlists, playlist] }));
    return playlist;
  },

  deletePlaylist: async (id) => {
    const prev = get().playlists;
    set(s => ({ playlists: s.playlists.filter(p => p.id !== id) }));
    try { await playlistRepository.deletePlaylist(id); }
    catch (e) { set({ playlists: prev }); throw e; }
  },

  renamePlaylist: async (id, name) => {
    const updated = await playlistRepository.renamePlaylist(id, name);
    set(s => ({ playlists: s.playlists.map(p => p.id === id ? updated : p) }));
  },

  addTrackToPlaylist: async (playlistId, track) => {
    const updated = await playlistRepository.addTrack(playlistId, track);
    set(s => ({ playlists: s.playlists.map(p => p.id === playlistId ? updated : p) }));
  },

  removeTrackFromPlaylist: async (playlistId, trackId) => {
    const updated = await playlistRepository.removeTrack(playlistId, trackId);
    set(s => ({ playlists: s.playlists.map(p => p.id === playlistId ? updated : p) }));
  },
}));
```

```javascript
// src/store/likesStore.js — NEW
import { create } from 'zustand';
import { db } from '../core/db/schema';
import { useToastStore } from './toastStore';

export const useLikesStore = create((set, get) => ({
  likedSongs: [],
  isHydrated: false,

  hydrate: async () => {
    const playlist = await db.playlists.get('liked_songs');
    set({ likedSongs: playlist?.tracks || [], isHydrated: true });
  },

  isLiked: (trackId) => get().likedSongs.some(t => t.id === trackId),

  toggleLike: async (track) => {
    const { likedSongs } = get();
    const isLiked = likedSongs.some(t => t.id === track.id);
    const newLiked = isLiked
      ? likedSongs.filter(t => t.id !== track.id)
      : [...likedSongs, track];
    const prev = likedSongs;
    set({ likedSongs: newLiked });
    try {
      await db.playlists.put({ id: 'liked_songs', name: 'Liked Songs', tracks: newLiked, dateUpdated: Date.now() });
    } catch (e) {
      set({ likedSongs: prev });
      throw e;
    }
  },
}));
```

```javascript
// src/store/historyStore.js — NEW
import { create } from 'zustand';
import { db } from '../core/db/schema';

const MAX_HISTORY = 20;

export const useHistoryStore = create((set, get) => ({
  recentlyPlayed: [],
  isHydrated: false,

  hydrate: async () => {
    const playlist = await db.playlists.get('recently_played');
    set({ recentlyPlayed: playlist?.tracks || [], isHydrated: true });
  },

  addTrack: async (track) => {
    const { recentlyPlayed } = get();
    const filtered = recentlyPlayed.filter(t => t.id !== track.id);
    const updated = [track, ...filtered].slice(0, MAX_HISTORY);
    const prev = recentlyPlayed;
    set({ recentlyPlayed: updated });
    try {
      await db.playlists.put({ id: 'recently_played', name: 'Recently Played', tracks: updated, dateUpdated: Date.now() });
    } catch (e) {
      set({ recentlyPlayed: prev });
    }
  },
}));
```

3. **Add usage tracking store** for recommendations personalization:

```javascript
// src/store/usageStore.js — NEW: tracks listening patterns for personalization
import { create } from 'zustand';
import { db } from '../core/db/schema';

export const useUsageStore = create((set, get) => ({
  /** @type {Object<string, number>} artist -> play count */
  artistPlayCounts: {},
  /** @type {Object<string, number>} genre -> play count */
  genrePlayCounts: {},
  lastUpdated: 0,

  hydrate: async () => {
    const stored = await db.preferences.get('usage_stats');
    if (stored) {
      set({
        artistPlayCounts: stored.artistPlayCounts || {},
        genrePlayCounts: stored.genrePlayCounts || {},
        lastUpdated: stored.lastUpdated || 0,
      });
    }
  },

  /**
   * Record a track play for personalization.
   * Debounced persistence — batched into preferences table as JSON.
   */
  recordPlay: async (track) => {
    set(state => {
      const newArtistCounts = { ...state.artistPlayCounts };
      (track.artistNames || []).forEach(a => {
        newArtistCounts[a] = (newArtistCounts[a] || 0) + 1;
      });
      return { artistPlayCounts: newArtistCounts, lastUpdated: Date.now() };
    });
  },

  persist: async () => {
    const { artistPlayCounts, genrePlayCounts, lastUpdated } = get();
    await db.preferences.put({ id: 'usage_stats', artistPlayCounts, genrePlayCounts, lastUpdated });
  },
}));
```

4. **Update `queueService.js`** to subscribe to new stores with selectors:

```javascript
// src/core/audio/queueService.js — Updated
import { useQueueStore } from '../../store/queueStore';
import { usePlayerStore } from '../../store/playerStore';
import { trackRepository } from '../repositories/TrackRepository';

let activeFetchId = null;

export function initQueueService() {
  useQueueStore.subscribe(
    (state) => ({ queue: state.queue, queueIndex: state.queueIndex }),
    ({ queue, queueIndex }, prev) => {
      if (queueIndex === prev.queueIndex && queue.length === prev.queue.length) return;

      const remaining = queue.length - queueIndex - 1;
      if (remaining >= 3) return;

      const currentTrack = usePlayerStore.getState().currentTrack;
      if (!currentTrack) return;

      const artist = currentTrack.artistNames?.[0];
      if (!artist) return;

      const fetchId = `${currentTrack.id}-${Date.now()}`;
      activeFetchId = fetchId;

      trackRepository.searchTracks(artist, { limit: 15 })
        .then(tracks => {
          if (activeFetchId !== fetchId) return; // stale
          const current = useQueueStore.getState();
          if (current.currentTrack?.id !== currentTrack.id) return; // track changed
          useQueueStore.getState().addToQueue(tracks);
        })
        .catch(err => console.error('Auto-queue failed:', err))
        .finally(() => { if (activeFetchId === fetchId) activeFetchId = null; });
    }
  );
}
```

5. **Add Zustand selectors** to all existing components to prevent unnecessary re-renders:

```javascript
// Before (re-renders on ANY playerStore change):
const { currentTrack, isPlaying, pause, resume, progress, seek } = usePlayerStore();

// After (only subscribes to specific slices):
const currentTrack = usePlayerStore(s => s.currentTrack);
const isPlaying = usePlayerStore(s => s.isPlaying);
const progress = usePlayerStore(s => s.progress);
```

Apply this pattern to all consumers:
- `src/components/player/BottomPlaybar/BottomPlaybar.jsx:15-32`
- `src/components/player/Controls/Controls.jsx`
- `src/components/player/GlobalPlayer/GlobalPlayer.jsx:12`
- `src/components/player/FullscreenPlayer/FullscreenPlayer.jsx`
- `src/components/player/QueuePanel/QueuePanel.jsx`

### Files to Create
- `src/store/queueStore.js`
- `src/store/likesStore.js`
- `src/store/historyStore.js`
- `src/store/usageStore.js`

### Files to Modify
- `src/store/playerStore.js` — remove queue logic, sleep timer, UI toggles
- `src/store/libraryStore.js` — keep only playlist operations, remove likedSongs/recentlyPlayed
- `src/core/audio/queueService.js` — update subscriptions + use TrackRepository
- `src/core/audio/recommendationService.js` — use HistoryStore instead of LibraryStore
- All components that use `usePlayerStore` — add selector subscriptions

### Migration/Risk Notes
- **Backward compat shim**: During migration, re-export selectors from `playerStore.js` that delegate to new stores: `export const useQueueStore = ...` in a compat layer.
- **Breaking change for liked songs**: Previously in `libraryStore.likedSongs`, moved to `likesStore.likedSongs`. Update all `toggleLikeTrack` callers (`TrackContextMenu.jsx`, `TrackCard.jsx`, `TrackRow.jsx`).
- **Testing risk**: 8 stores instead of 4 means more test files. Each store is simpler, though. Write store unit tests in `src/store/__tests__/`.

---

## 3. Bootstrap & Initialization Sequence

### BloomeeTunes Pattern
`bootstrap.dart` with ordered dependency initialization: `RustLib.init() → DBProvider.init() → ServiceLocator.setup() → PluginBootstrapService → initializePluginSystem() → LocalMusicService auto-scan → cache completion flags`. Each step reports progress. App doesn't render critical UI until bootstrapping completes.

### MoonPlayer Current State
No bootstrap sequence. `src/App.jsx:76-89` fires `hydratePrefs()`, `hydrateLibrary()`, `initQueueService()`, and `updateService.checkForUpdates()` in a `useEffect` — all in parallel with no ordering. `src/main.jsx` registers SW imperatively. Stores hydrate independently on mount, causing race conditions (e.g., Home.jsx forces hydrate again if not hydrated).

### The Gap
No initialization ordering. No progress feedback. Race conditions between hydration and data access.

### Implementation Steps

1. **Create `src/core/bootstrap.js`** with ordered initialization:

```javascript
// src/core/bootstrap.js — Ordered app boot sequence
import { registerSW } from 'virtual:pwa-register';
import { db } from './db/schema';
import { AudioEngine } from './audio/AudioEngine';
import { initQueueService } from './audio/queueService';
import { recommendationService } from './audio/recommendationService';

/**
 * @typedef {'db'|'preferences'|'library'|'likes'|'history'|'usage'|'player'|'audio'|'queue'|'recommendations'|'sw'|'done'} BootPhase
 */

class Bootstrapper {
  constructor() {
    /** @type {BootPhase} */
    this.currentPhase = 'db';
    this.onProgress = null;
    this.bootPromise = null;
  }

  /** @param {(phase: BootPhase, index: number, total: number) => void} cb */
  setProgressCallback(cb) {
    this.onProgress = cb;
  }

  _report(phase, index, total) {
    this.currentPhase = phase;
    this.onProgress?.(phase, index, total);
  }

  async boot() {
    if (this.bootPromise) return this.bootPromise;

    const phases = [
      'db', 'preferences', 'library', 'likes', 'history',
      'usage', 'player', 'audio', 'queue', 'recommendations', 'sw', 'done'
    ];
    const total = phases.length;

    this.bootPromise = (async () => {
      // Phase 1: Open IndexedDB
      this._report('db', 1, total);
      await db.open();

      // Phases 2-6: Hydrate stores in dependency order
      const { usePreferenceStore } = await import('../store/preferenceStore');
      this._report('preferences', 2, total);
      await usePreferenceStore.getState().hydrate();

      const { useLibraryStore } = await import('../store/libraryStore');
      this._report('library', 3, total);
      await useLibraryStore.getState().hydrate();

      const { useLikesStore } = await import('../store/likesStore');
      this._report('likes', 4, total);
      await useLikesStore.getState().hydrate();

      const { useHistoryStore } = await import('../store/historyStore');
      this._report('history', 5, total);
      await useHistoryStore.getState().hydrate();

      const { useUsageStore } = await import('../store/usageStore');
      this._report('usage', 6, total);
      await useUsageStore.getState().hydrate();

      // Phase 7: Player store rehydration (depends on preferences for volume)
      this._report('player', 7, total);
      const { usePlayerStore } = await import('../store/playerStore');
      // Zustand persist middleware auto-rehydrates; wait a tick
      await new Promise(r => setTimeout(r, 0));
      const playerState = usePlayerStore.getState();
      if (playerState.volume !== undefined) {
        AudioEngine.setVolume(playerState.volume);
      }

      // Phase 8: Initialize AudioEngine
      this._report('audio', 8, total);
      AudioEngine.setMediaSessionHandlers({
        onPlay: () => usePlayerStore.getState().resume(),
        onPause: () => usePlayerStore.getState().pause(),
        onNext: () => { /* next logic */ },
        onPrev: () => { /* prev logic */ },
      });

      // Phase 9: Initialize queue auto-refill
      this._report('queue', 9, total);
      initQueueService();

      // Phase 10: Warm recommendation cache in background
      this._report('recommendations', 10, total);
      recommendationService.getPersonalizedRecommendations().catch(() => {});

      // Phase 11: Register service worker
      this._report('sw', 11, total);
      try {
        registerSW({ immediate: true, onRegisterError: (e) => console.warn('SW registration failed:', e) });
      } catch (e) {
        console.warn('SW registration skipped:', e);
      }

      // Phase 12: Done
      this._report('done', 12, total);
    })();

    return this.bootPromise;
  }
}

export const bootstrapper = new Bootstrapper();
```

2. **Create `src/components/common/BootstrapGate/BootstrapGate.jsx`**:

```javascript
// src/components/common/BootstrapGate/BootstrapGate.jsx
import { useState, useEffect } from 'react';
import { bootstrapper } from '../../../core/bootstrap';

const PHASE_LABELS = {
  db: 'Opening database...',
  preferences: 'Loading preferences...',
  library: 'Loading library...',
  likes: 'Loading likes...',
  history: 'Loading history...',
  usage: 'Loading usage data...',
  player: 'Restoring playback state...',
  audio: 'Initializing audio...',
  queue: 'Preparing queue...',
  recommendations: 'Warming recommendations...',
  sw: 'Registering service worker...',
  done: 'Ready!',
};

export function BootstrapGate({ children }) {
  const [phase, setPhase] = useState('db');
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    bootstrapper.setProgressCallback((phase) => setPhase(phase));

    bootstrapper.boot()
      .then(() => setReady(true))
      .catch((err) => {
        console.error('Bootstrapping failed:', err);
        setError(err.message || 'Boot failed');
        setReady(true); // Don't block UI permanently
      });
  }, []);

  if (ready) return children;

  return (
    <div className="bootstrap-gate">
      <div className="bootstrap-gate__content">
        <div className="bootstrap-gate__spinner" />
        <p className="bootstrap-gate__label">{PHASE_LABELS[phase] || 'Loading...'}</p>
      </div>
    </div>
  );
}
```

3. **Integrate into `src/App.jsx`**:

```javascript
// src/App.jsx — Updated
import { BootstrapGate } from './components/common/BootstrapGate/BootstrapGate';
// ... other imports

export function App() {
  return (
    <ErrorBoundary>
      <BootstrapGate>
        <LazyMotion features={domMax}>
          <HashRouter>
            <AppInner />
          </HashRouter>
        </LazyMotion>
      </BootstrapGate>
    </ErrorBoundary>
  );
}
```

4. **Remove ad-hoc hydration calls** from `App.jsx` and `Home.jsx`:

Delete these from `src/App.jsx:76-89`:
```javascript
const hydratePrefs = usePreferenceStore((state) => state.hydrate);
const hydrateLibrary = useLibraryStore((state) => state.hydrate);

useEffect(() => {
  hydratePrefs();
  hydrateLibrary();
  initQueueService();
  updateService.checkForUpdates().catch(() => {});
}, [hydratePrefs, hydrateLibrary]);
```

Delete hydration guard from `src/views/pages/Home.jsx:17-23`:
```javascript
useEffect(() => {
  if (!isHydrated) {
    hydrate().catch((err) => console.error('Hydration failed on Home mount:', err));
  }
}, [isHydrated, hydrate]);
```

### Files to Create
- `src/core/bootstrap.js`
- `src/components/common/BootstrapGate/BootstrapGate.jsx`
- `src/components/common/BootstrapGate/BootstrapGate.css`

### Files to Modify
- `src/App.jsx` — wrap with BootstrapGate, remove hydration useEffect
- `src/views/pages/Home.jsx` — remove hydration guard
- `src/main.jsx` — remove registerSW call (moved to bootstrap)

### Migration/Risk Notes
- **Bootstrap time**: First load will show the gate for ~500-1500ms depending on IndexedDB size. Add a transition/animation to make it feel fast.
- **Error tolerance**: If any hydration fails, the gate still passes through after logging the error. Never block the user permanently.
- **Race condition fix**: Previously Home.jsx would re-hydrate if the store wasn't hydrated yet. With bootstrap, by the time Home renders, hydration is guaranteed complete. Remove all `isHydrated` checks from page components.

---

## 4. API Layer with Cancellation & Retry

### BloomeeTunes Pattern
`PluginService` with error handling, fallback resolution across plugins, circuit breaker pattern (fail-fast after N consecutive failures), `CancelableCompleter` for in-flight request cancellation.

### MoonPlayer Current State
`MusicService.js` (`src/core/api/MusicService.js:176-286`) — minimal error handling. `_fetch()` throws generic errors. `AbortController` used only in lyrics service. No retry, no rate limiting, no network awareness.

### The Gap
No retry logic. No cancellation. No rate limiting. No network status monitoring.

### Implementation Steps

1. **Create `src/core/api/RequestQueue.js`** — rate limiter with token bucket (FR-002):

```javascript
// src/core/api/RequestQueue.js
export class RequestQueue {
  /**
   * @param {Object} options
   * @param {number} options.tokensPerSecond — requests per second (default 5)
   * @param {number} options.burstSize — max burst (default 10)
   */
  constructor({ tokensPerSecond = 5, burstSize = 10 } = {}) {
    this.tokens = burstSize;
    this.maxTokens = burstSize;
    this.refillRate = tokensPerSecond / 1000; // per ms
    this.lastRefill = Date.now();
    this.queue = [];
    this.processing = false;
  }

  async acquire() {
    this._refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }
    // Wait until next token is available
    const waitTime = 1000 / (this.refillRate * 1000);
    await new Promise(r => setTimeout(r, Math.ceil(waitTime)));
    return this.acquire();
  }

  _refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }

  /**
   * Wraps a fetch call with rate limiting.
   * @param {() => Promise<T>} fn
   * @returns {Promise<T>}
   * @template T
   */
  async enqueue(fn) {
    await this.acquire();
    return fn();
  }
}

export const globalRequestQueue = new RequestQueue({ tokensPerSecond: 5, burstSize: 10 });
```

2. **Update `MusicService.js`** with retry, cancellation, rate limiting:

```javascript
// src/core/api/MusicService.js — Updated with retry + cancellation
import { globalRequestQueue } from './RequestQueue';
import { trackRepository } from '../repositories/TrackRepository';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Fetch with retry + exponential backoff + optional cancellation.
 * @param {string} url
 * @param {Object} [options]
 * @param {AbortSignal} [options.signal]
 * @param {number} [options.retries=3]
 * @returns {Promise<Response>}
 */
async function fetchWithRetry(url, { signal, retries = 3 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    try {
      await globalRequestQueue.enqueue(() => Promise.resolve()); // rate limit
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

      const response = await fetch(url, { signal });
      if (!response.ok) {
        // 429: rate limited — always retry after delay
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('retry-after') || '2', 10);
          await sleep(retryAfter * 1000);
          continue;
        }
        // 4xx client errors (except 429): don't retry
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          throw new Error(`API Error: HTTP ${response.status}`);
        }
        // 5xx: retry
        throw new Error(`API Error: HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }

      const data = await response.json();
      if (!data || typeof data !== 'object' || !data.success) {
        throw new Error(`API failed: ${data?.message || 'unknown'}`);
      }
      return data.data;
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      lastError = error;
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 4000); // 1s, 2s, 4s
        console.warn(`API retry ${attempt + 1}/${retries} after ${delay}ms:`, error.message);
        await sleep(delay);
      }
    }
  }
  throw lastError;
}
```

3. **Create `src/core/api/NetworkStatus.js`**:

```javascript
// src/core/api/NetworkStatus.js
const listeners = new Set();

let isOnline = navigator.onLine;

function handleOnline() {
  isOnline = true;
  listeners.forEach(cb => cb(true));
}

function handleOffline() {
  isOnline = false;
  listeners.forEach(cb => cb(false));
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
}

export const NetworkStatus = {
  get isOnline() { return isOnline; },

  /** @param {(online: boolean) => void} cb */
  onChange(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
};
```

4. **Add `AbortSignal` parameter** to all MusicService methods:

```javascript
// In MusicServiceImpl — every public method gets an optional signal param
async searchSongs(query, page = 1, limit = 10, quality = '320kbps', dataSaver = false, signal = null) {
  if (!query) return [];
  try {
    const q = encodeURIComponent(query);
    const data = await fetchWithRetry(
      `${this.baseUrl}/api/search/songs?query=${q}&page=${page}&limit=${limit}`,
      { signal }
    );
    if (!data?.results) return [];
    return data.results.map(r => normalizeTrack(r, quality, dataSaver)).filter(Boolean);
  } catch (error) {
    if (error.name !== 'AbortError') console.error('searchSongs failed:', error);
    return [];
  }
}
```

### Files to Create
- `src/core/api/RequestQueue.js`
- `src/core/api/NetworkStatus.js`

### Files to Modify
- `src/core/api/MusicService.js` — add fetchWithRetry, add signal param to all methods
- `src/core/audio/recommendationService.js` — pass signals from consumers
- `src/views/pages/Home.jsx` — pass AbortController signal to recommendationService
- `src/core/api/downloadService.js` — pass signal to getTrackDetails

### Migration/Risk Notes
- **Retry visibility**: After 3 retries (4 total attempts) with 1s/2s/4s backoff, max wait is 7s. Consider adding a user-visible toast on the 2nd retry.
- **AbortController integration**: Every component that fetches data should create an AbortController and abort in the cleanup function. Pattern:
  ```javascript
  useEffect(() => {
    const ac = new AbortController();
    fetchData(ac.signal);
    return () => ac.abort();
  }, []);
  ```
- **Rate limiting**: 5 tokens/sec is conservative for a single user. If requests pile up (e.g., rapid search), they queue transparently.

---

## 5. Service Locator / DI Pattern

### BloomeeTunes Pattern
`ServiceLocator` — static typed DI container with typed service registration (`ServiceLocator.register<T>(instance)`, `ServiceLocator.get<T>()`). Application-lifetime singletons registered during `bootstrap.dart`.

### MoonPlayer Current State
Direct imports everywhere. Services are module-level singletons (`MusicService.js:286` exports `new MusicServiceImpl()`, `downloadService.js:120` exports `new DownloadServiceImpl()`). No DI, no testability, no lifecycle management.

### The Gap
Hard to mock services for testing. No centralized service lifecycle. No way to swap implementations.

### Implementation Steps

1. **Create `src/core/di/ServiceContainer.js`**:

```javascript
// src/core/di/ServiceContainer.js
import React, { createContext, useContext } from 'react';

class ServiceContainerImpl {
  constructor() {
    /** @type {Map<string, any>} */
    this._services = new Map();
    /** @type {Map<string, () => any>} */
    this._factories = new Map();
  }

  /**
   * Register a singleton service instance.
   * @param {string} name
   * @param {any} instance
   */
  register(name, instance) {
    this._services.set(name, instance);
    return this;
  }

  /**
   * Register a factory (lazy singleton).
   * @param {string} name
   * @param {() => any} factory
   */
  registerFactory(name, factory) {
    this._factories.set(name, factory);
    return this;
  }

  /**
   * Get a service by name.
   * @template T
   * @param {string} name
   * @returns {T}
   */
  get(name) {
    if (this._services.has(name)) return this._services.get(name);
    if (this._factories.has(name)) {
      const instance = this._factories.get(name)();
      this._services.set(name, instance);
      this._factories.delete(name);
      return instance;
    }
    throw new Error(`Service "${name}" not registered`);
  }

  /**
   * Check if a service is registered.
   * @param {string} name
   * @returns {boolean}
   */
  has(name) {
    return this._services.has(name) || this._factories.has(name);
  }

  /**
   * Clear all services (for testing/reset).
   */
  clear() {
    this._services.clear();
    this._factories.clear();
  }
}

// Singleton container
export const serviceContainer = new ServiceContainerImpl();

// React context
const ServiceContext = createContext(serviceContainer);

/**
 * Provider component that wraps the app with service access.
 */
export function ServiceProvider({ container = serviceContainer, children }) {
  return React.createElement(ServiceContext.Provider, { value: container }, children);
}

/**
 * Hook to access a service by name.
 * @template T
 * @param {string} name
 * @returns {T}
 */
export function useService(name) {
  const container = useContext(ServiceContext);
  return container.get(name);
}
```

2. **Register services during bootstrap**:

```javascript
// In src/core/bootstrap.js — add to boot method:
import { serviceContainer } from './di/ServiceContainer';
import { MusicService } from './api/MusicService';
import { recommendationService } from './audio/recommendationService';
import { downloadService } from './api/downloadService';
import { AudioEngine } from './audio/AudioEngine';
import { trackRepository } from './repositories/TrackRepository';

// Inside boot(), before phase 'done':
serviceContainer.register('musicService', MusicService);
serviceContainer.register('recommendationService', recommendationService);
serviceContainer.register('downloadService', downloadService);
serviceContainer.register('audioEngine', AudioEngine);
serviceContainer.register('trackRepository', trackRepository);
```

3. **Wrap App with ServiceProvider**:

```javascript
// In src/App.jsx
import { ServiceProvider } from './core/di/ServiceContainer';

export function App() {
  return (
    <ErrorBoundary>
      <ServiceProvider>
        <BootstrapGate>
          <LazyMotion features={domMax}>
            <HashRouter>
              <AppInner />
            </HashRouter>
          </LazyMotion>
        </BootstrapGate>
      </ServiceProvider>
    </ErrorBoundary>
  );
}
```

4. **Use `useService()` in components**:

```javascript
// Before:
import { recommendationService } from '../../core/audio/recommendationService';
// In component: recommendationService.getPersonalizedRecommendations()

// After:
import { useService } from '../../core/di/ServiceContainer';
// In component:
const recommendationService = useService('recommendationService');
```

### Files to Create
- `src/core/di/ServiceContainer.js`

### Files to Modify
- `src/core/bootstrap.js` — register services
- `src/App.jsx` — wrap with ServiceProvider

### Migration/Risk Notes
- **Not all at once**: Convert components incrementally. Direct imports still work alongside `useService()`.
- **Testing**: In tests, create a fresh `ServiceContainerImpl`, register mocks, and wrap the test component with `ServiceProvider container={testContainer}`.
- **No over-abstraction**: MoonPlayer doesn't need a full DI framework. This simple container covers the 80% case. Avoid `get_it`-level complexity.

---

## 6. Offline & Caching Strategy

### BloomeeTunes Pattern
Two-tier cache: L1 (in-memory LRU map for hot data) + L2 (Isar-persisted for persistence). Stale-while-revalidate pattern for plugin cache content. Plugin cache with dedicated DAO.

### MoonPlayer Current State
Manual 5-min TTL in `recommendationService` (module-level `cachedResult` + `cacheTime`, `src/core/audio/recommendationService.js:5-7`). Browser HTTP cache for API responses. No offline persistence of stream data — only metadata persisted.

### The Gap
No LRU cache primitive. No stale-while-revalidate. No stream URL caching. No graceful offline degradation.

### Implementation Steps

1. **Create `src/core/utils/CacheLRU.js`**:

```javascript
// src/core/utils/CacheLRU.js
export class CacheLRU {
  /**
   * @param {number} maxSize — max entries before eviction
   * @param {number} [ttlMs] — optional TTL in ms
   */
  constructor(maxSize = 200, ttlMs = 0) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    /** @type {Map<string, { value: any, expires: number }>} */
    this._map = new Map();
  }

  get(key) {
    const entry = this._map.get(key);
    if (!entry) return undefined;
    if (this.ttlMs && Date.now() > entry.expires) {
      this._map.delete(key);
      return undefined;
    }
    // Move to end (most recently used)
    this._map.delete(key);
    this._map.set(key, entry);
    return entry.value;
  }

  set(key, value) {
    if (this._map.has(key)) this._map.delete(key);
    else if (this._map.size >= this.maxSize) {
      // Evict least recently used (first item)
      const lru = this._map.keys().next().value;
      this._map.delete(lru);
    }
    this._map.set(key, {
      value,
      expires: this.ttlMs ? Date.now() + this.ttlMs : Infinity,
    });
  }

  delete(key) {
    this._map.delete(key);
  }

  clear() {
    this._map.clear();
  }

  get size() {
    return this._map.size;
  }
}
```

2. **Create `src/core/cache/StreamURLCache.js`** — 24-hour TTL in IndexedDB:

```javascript
// src/core/cache/StreamURLCache.js
import { db } from '../db/schema';
import { CacheLRU } from '../utils/CacheLRU';

const STREAM_TTL = 24 * 60 * 60 * 1000; // 24 hours
const L1 = new CacheLRU(200, STREAM_TTL);

export const StreamURLCache = {
  /** @param {string} trackId @returns {Promise<string|null>} */
  async get(trackId) {
    // L1 check
    const l1 = L1.get(trackId);
    if (l1) return l1;

    // L2 check
    const entry = await db.cache.get(trackId);
    if (entry && entry.expiresAt > Date.now()) {
      L1.set(trackId, entry.value);
      return entry.value;
    }
    return null;
  },

  /** @param {string} trackId @param {string} streamUrl */
  async set(trackId, streamUrl) {
    L1.set(trackId, streamUrl);
    await db.cache.put({
      key: trackId,
      value: streamUrl,
      expiresAt: Date.now() + STREAM_TTL,
    });
  },

  async invalidate(trackId) {
    L1.delete(trackId);
    await db.cache.delete(trackId);
  },

  async clear() {
    L1.clear();
    await db.cache.clear();
  },
};
```

3. **Create `src/core/cache/HomeCache.js`** — stale-while-revalidate for recommendations:

```javascript
// src/core/cache/HomeCache.js
import { db } from '../db/schema';

const STALE_TTL = 5 * 60 * 1000; // 5 min fresh
const MAX_AGE = 30 * 60 * 1000;   // 30 min max age

export const HomeCache = {
  /**
   * Implements stale-while-revalidate pattern.
   * @param {string} key
   * @param {() => Promise<any>} fetchFn
   * @returns {Promise<{ data: any, stale: boolean }>}
   */
  async getOrFetch(key, fetchFn) {
    const cached = await db.cache.get(key);
    const isFresh = cached && (Date.now() - cached.savedAt) < STALE_TTL;
    const isUsable = cached && (Date.now() - cached.savedAt) < MAX_AGE;

    if (isFresh) {
      return { data: cached.value, stale: false };
    }

    // Stale-while-revalidate: return stale data, revalidate in background
    if (isUsable) {
      fetchFn().then(fresh => {
        db.cache.put({
          key,
          value: fresh,
          savedAt: Date.now(),
          expiresAt: Date.now() + MAX_AGE,
        }).catch(() => {});
      }).catch(() => {});
      return { data: cached.value, stale: true };
    }

    // No usable cache — fetch fresh
    const fresh = await fetchFn();
    await db.cache.put({
      key,
      value: fresh,
      savedAt: Date.now(),
      expiresAt: Date.now() + MAX_AGE,
    }).catch(() => {});
    return { data: fresh, stale: false };
  },
};
```

4. **Update `recommendationService.js`** to use HomeCache:

```javascript
// In recommendationService.js
import { HomeCache } from '../cache/HomeCache';

async getPersonalizedRecommendations(signal = null) {
  const key = 'home_recommendations';
  const { data, stale } = await HomeCache.getOrFetch(key, async () => {
    // ... existing recommendation logic ...
  });
  return data;
}
```

5. **Create `src/core/cache/RecentlyPlayedSync.js`** — debounced batch writes:

```javascript
// src/core/cache/RecentlyPlayedSync.js
import { db } from '../db/schema';

let pending = [];
let timer = null;

const FLUSH_DEBOUNCE = 5000; // 5 seconds

export const RecentlyPlayedSync = {
  /** @param {import('../types').Track} track */
  push(track) {
    pending = pending.filter(t => t.id !== track.id);
    pending.push(track);
    if (pending.length >= 10) {
      this.flush();
    } else if (!timer) {
      timer = setTimeout(() => this.flush(), FLUSH_DEBOUNCE);
    }
  },

  async flush() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (pending.length === 0) return;
    const batch = [...pending];
    pending = [];
    try {
      const existing = await db.playlists.get('recently_played');
      const tracks = existing?.tracks || [];
      const merged = [...batch];
      for (const t of tracks) {
        if (!merged.some(m => m.id === t.id)) merged.push(t);
      }
      await db.playlists.put({
        id: 'recently_played',
        name: 'Recently Played',
        tracks: merged.slice(0, 20),
        dateUpdated: Date.now(),
      });
    } catch (e) {
      pending = [...batch, ...pending]; // re-queue on failure
    }
  },
};
```

6. **Add offline detection with graceful degradation**:

```javascript
// src/core/cache/OfflineDetector.js
import { NetworkStatus } from '../api/NetworkStatus';
import { useToastStore } from '../../store/toastStore';

let wasOffline = false;

export function initOfflineDetector() {
  NetworkStatus.onChange((online) => {
    if (!online) {
      wasOffline = true;
      useToastStore.getState().addToast('You are offline. Playing from cache.', 'warning', 4000);
    } else if (wasOffline) {
      wasOffline = false;
      useToastStore.getState().addToast('Connection restored.', 'success', 3000);
    }
  });
}
```

### Files to Create
- `src/core/utils/CacheLRU.js`
- `src/core/cache/StreamURLCache.js`
- `src/core/cache/HomeCache.js`
- `src/core/cache/RecentlyPlayedSync.js`
- `src/core/cache/OfflineDetector.js`

### Files to Modify
- `src/core/audio/recommendationService.js` — use HomeCache
- `src/core/bootstrap.js` — init offline detector
- `src/core/db/schema.js` — add `cache` table to schema
- `src/store/historyStore.js` — use RecentlyPlayedSync

### Migration/Risk Notes
- **Cache invalidation**: Hardest problem in CS. For stream URLs, invalidate on 403/404 from the CDN. For home recommendations, invalidate when recentlyPlayed changes (already done via `useLibraryStore.subscribe`).
- **Storage limits**: IndexedDB has ~50MB-∞ depending on browser. Cache table entries should be pruned periodically. Add a startup guard: if cache entries > 500, delete oldest 100.
- **Offline UX**: Only tracks whose stream URLs were previously resolved and cached can play offline. Show a "Cached" badge on those tracks. `BottomPlaybar` should show offline indicator.

---

## 7. Playback Data Flow Refinement

### BloomeeTunes Pattern
`bloomeePlayer.loadPlaylist(playlist, idx, doPlay)` → `_enqueuePlayTrack()` → `CancelableCompleter` → `_resolveWithFallback()` → `MediaResolverService.resolve()` → `PluginService` resolves URL → `_tryAutoReplace()` on failure → `engine.openDirect(uri, headers)` → `_preResolveNextTrack()` → `_broadcastPlaybackState()`. Two tracks ahead pre-resolution. Race condition handling via `CancelableCompleter`.

### MoonPlayer Current State
`playerStore.play(track)` → `AudioEngine.playTrack(streamUrl, volume)` → Howler → `onEnd` → `playerStore.next()`. Progress via `setInterval(1000ms)` (`AudioEngine.js:297-301`). No pre-resolution, no fallback, no cancellation.

### The Gap
No track resolution with cancellation. No fallback when stream URL fails. No pre-resolve next tracks. Choppy progress (1s intervals).

### Implementation Steps

1. **Create `src/core/player/TrackResolver.js`** — resolve with cancellation + fallback:

```javascript
// src/core/player/TrackResolver.js
import { MusicService } from '../api/MusicService';
import { StreamURLCache } from '../cache/StreamURLCache';

const RESOLVE_TIMEOUT = 15000; // 15s max per resolution

export class TrackResolver {
  constructor() {
    /** @type {Map<string, AbortController>} */
    this._inFlight = new Map();
  }

  /**
   * Resolve a track's stream URL with fallback and cancellation.
   * @param {import('../types').Track} track
   * @param {Object} options
   * @param {string} options.quality
   * @param {boolean} options.dataSaver
   * @returns {Promise<string|null>}
   */
  async resolve(track, { quality = '320kbps', dataSaver = false } = {}) {
    // Cancel any in-flight resolution for this track
    this.cancel(track.id);

    const ac = new AbortController();
    this._inFlight.set(track.id, ac);

    try {
      // 1. Check stream URL cache
      const cachedUrl = await StreamURLCache.get(track.id);
      if (cachedUrl) {
        this._inFlight.delete(track.id);
        return cachedUrl;
      }

      // 2. If track already has streamUrl, cache and return
      if (track.streamUrl) {
        await StreamURLCache.set(track.id, track.streamUrl);
        this._inFlight.delete(track.id);
        return track.streamUrl;
      }

      // 3. Resolve via API with timeout
      const timeoutId = setTimeout(() => ac.abort(), RESOLVE_TIMEOUT);

      const resolved = await MusicService.getTrackDetails(
        track.id, quality, dataSaver, ac.signal
      );
      clearTimeout(timeoutId);

      if (ac.signal.aborted) {
        this._inFlight.delete(track.id);
        return null;
      }

      if (resolved?.streamUrl) {
        await StreamURLCache.set(track.id, resolved.streamUrl);
        this._inFlight.delete(track.id);
        return resolved.streamUrl;
      }

      // 4. Fallback: try lower quality
      const fallbackQualities = dataSaver
        ? ['96kbps', '48kbps']
        : ['192kbps', '160kbps', '96kbps'];

      for (const q of fallbackQualities) {
        if (ac.signal.aborted) break;
        const fallback = await MusicService.getTrackDetails(track.id, q, true, ac.signal);
        if (fallback?.streamUrl) {
          await StreamURLCache.set(track.id, fallback.streamUrl);
          this._inFlight.delete(track.id);
          return fallback.streamUrl;
        }
      }

      this._inFlight.delete(track.id);
      return null;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error(`TrackResolver failed for ${track.id}:`, error);
      }
      this._inFlight.delete(track.id);
      return null;
    }
  }

  /** Cancel in-flight resolution for a track */
  cancel(trackId) {
    const existing = this._inFlight.get(trackId);
    if (existing) {
      existing.abort();
      this._inFlight.delete(trackId);
    }
  }

  /** Cancel all in-flight resolutions */
  cancelAll() {
    this._inFlight.forEach(ac => ac.abort());
    this._inFlight.clear();
  }
}

export const trackResolver = new TrackResolver();
```

2. **Update `AudioEngine.js`** — use `requestAnimationFrame` for progress, fix race conditions:

```javascript
// In AudioEngineImpl — replace setInterval with requestAnimationFrame:
_startProgressLoop() {
  this._stopProgressLoop();
  this._progressRunning = true;

  const tick = () => {
    if (!this._progressRunning) return;
    if (this.onProgressCallback && this.sound) {
      this.onProgressCallback(this.getPosition());
    }
    this._rafId = requestAnimationFrame(tick);
  };
  this._rafId = requestAnimationFrame(tick);
}

_stopProgressLoop() {
  this._progressRunning = false;
  if (this._rafId) {
    cancelAnimationFrame(this._rafId);
    this._rafId = null;
  }
}

// Add state guard for race conditions in playTrack:
playTrack(streamUrl, volume = 1) {
  if (!streamUrl) return;

  // Generate a play session ID to track stale state
  const sessionId = Date.now();
  this._currentSessionId = sessionId;

  if (this.sound) {
    try { this.sound.unload(); } catch {}
    this.sound = null;
  }

  Howler.volume(volume);

  this.sound = new Howl({
    src: [streamUrl],
    html5: true,
    format: ['mp4', 'm4a', 'aac', 'mp3'],
    volume: 1,
    onplay: () => {
      if (this._currentSessionId !== sessionId) {
        this.sound?.unload();
        return;
      }
      if (this.onPlayCallback) this.onPlayCallback();
      this._startProgressLoop();
      this._setupEqualizer();
    },
    onpause: () => {
      if (this.onPauseCallback) this.onPauseCallback();
      this._stopProgressLoop();
    },
    onend: () => {
      this._stopProgressLoop();
      if (this.onEndCallback) this.onEndCallback();
    },
    onstop: () => { this._stopProgressLoop(); },
    onloaderror: (id, error) => {
      this._stopProgressLoop();
      if (this._currentSessionId !== sessionId) return; // stale session
      if (this.onErrorCallback) this.onErrorCallback('load_error', error);
    },
    onplayerror: (id, error) => {
      this._stopProgressLoop();
      if (this._currentSessionId !== sessionId) return;
      if (this.onErrorCallback) this.onErrorCallback('play_error', error);
    },
  });

  // CORS fix
  if (this.sound?._sounds?.[0]?._node) {
    this.sound._sounds[0]._node.crossOrigin = 'anonymous';
  }

  this.sound.play();
}
```

3. **Add pre-resolve next tracks** — subscribe to queue changes and resolve ahead:

```javascript
// src/core/player/PreResolver.js
import { useQueueStore } from '../../store/queueStore';
import { trackResolver } from './TrackResolver';

const PRE_RESOLVE_COUNT = 2;

export function initPreResolver() {
  useQueueStore.subscribe(
    (state) => ({ queue: state.queue, queueIndex: state.queueIndex }),
    ({ queue, queueIndex }) => {
      if (queue.length === 0 || queueIndex < 0) return;

      // Pre-resolve next N tracks
      for (let i = 1; i <= PRE_RESOLVE_COUNT; i++) {
        const idx = queueIndex + i;
        if (idx >= queue.length) break;
        const track = queue[idx];
        if (!track.streamUrl) {
          trackResolver.resolve(track).catch(() => {});
        }
      }
    }
  );
}
```

4. **Create `src/core/player/PlaybackOrchestrator.js`** — central playback coordinator:

```javascript
// src/core/player/PlaybackOrchestrator.js
import { usePlayerStore } from '../../store/playerStore';
import { useQueueStore } from '../../store/queueStore';
import { useHistoryStore } from '../../store/historyStore';
import { useUsageStore } from '../../store/usageStore';
import { useToastStore } from '../../store/toastStore';
import { AudioEngine } from '../audio/AudioEngine';
import { trackResolver } from './TrackResolver';

export class PlaybackOrchestrator {
  constructor() {
    this._currentResolveId = null;
  }

  /**
   * Play a track with full resolution + fallback + history logging.
   * @param {import('../types').Track} track
   * @param {Object} [options]
   * @param {boolean} [options.appendToQueue=false]
   */
  async play(track, { appendToQueue = false } = {}) {
    if (!track) return;

    const resolveId = Date.now();
    this._currentResolveId = resolveId;

    const { volume, loopMode } = usePlayerStore.getState();
    const { streamQuality, dataSaverEnabled } = usePreferenceStore.getState();

    // Resolve stream URL (cancellable)
    const url = await trackResolver.resolve(track, {
      quality: streamQuality,
      dataSaver: dataSaverEnabled,
    });

    // Check if this resolve was superseded by a newer play request
    if (resolveId !== this._currentResolveId) return;

    if (!url) {
      useToastStore.getState().addToast('Could not load this track', 'error');
      // Auto-replace with next in queue
      const queueState = useQueueStore.getState();
      if (queueState.queueIndex < queueState.queue.length - 1) {
        const nextTrack = queueState.queue[queueState.queueIndex + 1];
        useToastStore.getState().addToast('Skipping to next track', 'info');
        return this.play(nextTrack);
      }
      return;
    }

    // Play through AudioEngine
    try {
      AudioEngine.playTrack(url, volume);
      AudioEngine.updateMediaSession(track);

      usePlayerStore.setState({ currentTrack: track, isPlaying: true, progress: 0 });

      // Log history in background
      useHistoryStore.getState().addTrack(track);
      useUsageStore.getState().recordPlay(track);
    } catch (error) {
      console.error('Playback failed:', error);
      useToastStore.getState().addToast('Playback failed', 'error');
    }
  }

  /** Cancel any pending resolution */
  cancelPending() {
    this._currentResolveId = null;
    trackResolver.cancelAll();
  }
}

export const playbackOrchestrator = new PlaybackOrchestrator();
```

5. **Wire AudioEngine error callbacks** to orchestrator for auto-replace:

```javascript
// In bootstrap.js:
AudioEngine.onErrorCallback = (type, error) => {
  useToastStore.getState().addToast(
    type === 'load_error' ? 'Track unavailable, skipping...' : 'Playback error',
    'warning'
  );
  // Auto-skip to next track on load error
  usePlayerStore.getState().next();
};
```

### Files to Create
- `src/core/player/TrackResolver.js`
- `src/core/player/PreResolver.js`
- `src/core/player/PlaybackOrchestrator.js`

### Files to Modify
- `src/core/audio/AudioEngine.js` — rAF progress, session ID guards
- `src/core/bootstrap.js` — init PreResolver
- `src/store/playerStore.js` — use PlaybackOrchestrator in play() action
- `src/views/pages/Home.jsx` — use orchestrator instead of direct store.play()

### Migration/Risk Notes
- **Race conditions**: The `resolveId` pattern prevents stale resolution callbacks from starting playback after the user has already skipped to a different track. This is the exact pattern BloomeeTunes uses with `CancelableCompleter`.
- **Pre-resolution network cost**: Pre-resolving 2 tracks ahead means 2 extra API calls per track play. The StreamURLCache mitigates this — once a URL is cached, pre-resolution is a L1 cache hit.
- **Auto-replace loop risk**: If every track in the queue fails, the auto-replace logic will exhaust the queue. Add a max-skip counter: skip at most 3 consecutive failed tracks before stopping.

---

## 8. Database Schema & Query Optimization

### BloomeeTunes Pattern
11 Isar collections with specific DAOs and mappers. Compound indexes, efficient queries. `TrackDB`, `PlaylistDB`, `PlaylistEntryDB`, `LyricsDB`, etc. Schema versioning with migration support.

### MoonPlayer Current State
Dexie.js v4 with minimal schema (`src/core/db/schema.js:14-21`):
- `preferences` (id)
- `playlists` (id, name, dateUpdated)
- `tracks` (id, albumId)
- `artists` (id)
- `history` (id, timestamp)
- `lyrics` (trackId)

No compound indexes, no `playlist_entries` table (tracks are embedded in playlists), no migration support, no cache table.

### The Gap
Embedded track arrays in playlists cause full-document reads/writes for single track operations. No cache table for stream URLs and home recommendations. No migrations.

### Implementation Steps

1. **Refactor Dexie schema with proper tables and compound indexes**:

```javascript
// src/core/db/schema.js — Enhanced schema
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
      lyrics: '&trackId',
    });

    // v2: Add playlist_entries, cache table, compound indexes
    this.version(2).stores({
      preferences: '&id',
      playlists: '&id, name, dateUpdated',
      playlist_entries: '[playlistId+trackId], playlistId, trackId, order, &id',
      tracks: '&id, albumId, [albumId+id]',
      artists: '&id',
      liked_songs: '&trackId, likedAt',
      recently_played: '&trackId, playedAt, count',
      history: '&id, timestamp',
      lyrics: '&trackId',
      cache: '&key, expiresAt',
    }).upgrade(tx => {
      // Migration: Extract tracks from playlists into playlist_entries
      return tx.table('playlists').toCollection().each(playlist => {
        if (playlist.tracks && Array.isArray(playlist.tracks)) {
          const entries = playlist.tracks.map((track, idx) => ({
            id: `${playlist.id}_${track.id}`,
            playlistId: playlist.id,
            trackId: track.id,
            order: idx,
            addedAt: playlist.dateUpdated || Date.now(),
          }));
          // Also populate liked_songs
          if (playlist.id === 'liked_songs') {
            return tx.table('liked_songs').bulkAdd(
              playlist.tracks.map(t => ({ trackId: t.id, likedAt: Date.now() }))
            ).catch(() => {});
          }
          // Populate recently_played
          if (playlist.id === 'recently_played') {
            return tx.table('recently_played').bulkAdd(
              playlist.tracks.map((t, i) => ({ trackId: t.id, playedAt: Date.now() - i * 60000, count: 1 }))
            ).catch(() => {});
          }
          return tx.table('playlist_entries').bulkAdd(entries).catch(() => {});
        }
      });
    });

    // v3: Add usage stats table
    this.version(3).stores({
      preferences: '&id',
      playlists: '&id, name, dateUpdated',
      playlist_entries: '[playlistId+trackId], playlistId, trackId, order',
      tracks: '&id, albumId',
      artists: '&id',
      liked_songs: '&trackId, likedAt',
      recently_played: '&trackId, playedAt, count',
      history: '&id, timestamp',
      lyrics: '&trackId',
      cache: '&key, expiresAt',
      usage_stats: '&key',
    });
  }

  /**
   * Get a playlist with its entries joined.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getPlaylistWithTracks(id) {
    const playlist = await this.playlists.get(id);
    if (!playlist) return null;
    const entries = await this.playlist_entries
      .where('playlistId')
      .equals(id)
      .sortBy('order');
    const trackIds = entries.map(e => e.trackId);
    const tracks = await this.tracks.where('id').anyOf(trackIds).toArray();
    // Preserve entry order
    const trackMap = new Map(tracks.map(t => [t.id, t]));
    return { ...playlist, tracks: trackIds.map(id => trackMap.get(id)).filter(Boolean) };
  }
}

export const db = new MoonDatabase();
```

2. **Create `src/core/db/migrations.js`** for future schema changes:

```javascript
// src/core/db/migrations.js
import { db } from './schema';

const MIGRATIONS = {
  // Example future migration
  'v4_add_favorites_index': async () => {
    // Dexie handles schema migrations via version() blocks,
    // but for data migrations that don't fit version().upgrade():
    const count = await db.recently_played.count();
    if (count > 100) {
      const oldest = await db.recently_played
        .orderBy('playedAt')
        .limit(count - 100)
        .toArray();
      await db.recently_played.bulkDelete(oldest.map(r => r.trackId));
    }
  },
};

export async function runPostMigration() {
  const { lastMigration } = await db.preferences.get('migration_state') || {};
  const keys = Object.keys(MIGRATIONS);

  for (const key of keys) {
    if (!lastMigration || keys.indexOf(key) > keys.indexOf(lastMigration)) {
      console.log(`Running migration: ${key}`);
      await MIGRATIONS[key]();
      await db.preferences.put({ id: 'migration_state', lastMigration: key });
    }
  }
}
```

3. **Update DAOs to use new schema**:

```javascript
// src/core/data-access/trackDAO.js — Updated with compound index query
export const trackDAO = {
  // ... existing methods ...

  /** Get tracks by album, ordered by id */
  async getByAlbum(albumId) {
    return db.tracks
      .where('[albumId+id]')
      .between([albumId, ''], [albumId, '\uffff'])
      .toArray();
  },

  /** Bulk insert tracks (for search results) */
  async bulkPut(tracks) {
    return db.tracks.bulkPut(tracks, { allKeys: true });
  },
};
```

```javascript
// src/core/data-access/playlistEntryDAO.js — NEW
import { db } from '../db/schema';

export const playlistEntryDAO = {
  /** Get all entries for a playlist, ordered */
  async getByPlaylist(playlistId) {
    return db.playlist_entries
      .where('playlistId')
      .equals(playlistId)
      .sortBy('order');
  },

  /** Add a single entry at the end */
  async add(playlistId, trackId) {
    const entries = await this.getByPlaylist(playlistId);
    const maxOrder = entries.length > 0 ? entries[entries.length - 1].order : -1;
    return db.playlist_entries.add({
      id: `${playlistId}_${trackId}`,
      playlistId,
      trackId,
      order: maxOrder + 1,
      addedAt: Date.now(),
    });
  },

  /** Remove a single entry */
  async remove(playlistId, trackId) {
    return db.playlist_entries
      .where('[playlistId+trackId]')
      .equals([playlistId, trackId])
      .delete();
  },

  /** Reorder entries */
  async reorder(playlistId, trackIds) {
    await db.transaction('rw', db.playlist_entries, async () => {
      await db.playlist_entries
        .where('playlistId')
        .equals(playlistId)
        .delete();
      await db.playlist_entries.bulkAdd(
        trackIds.map((trackId, idx) => ({
          id: `${playlistId}_${trackId}`,
          playlistId,
          trackId,
          order: idx,
          addedAt: Date.now(),
        }))
      );
    });
  },
};
```

### Files to Create
- `src/core/db/migrations.js`
- `src/core/data-access/playlistEntryDAO.js`

### Files to Modify
- `src/core/db/schema.js` — v2+v3 schemas with compound indexes, playlist_entries, cache
- `src/core/data-access/trackDAO.js` — compound index queries, bulkPut
- `src/core/data-access/playlistDAO.js` — use getPlaylistWithTracks for reads
- `src/core/repositories/PlaylistRepository.js` — use playlistEntryDAO for addTrack/removeTrack

### Migration/Risk Notes
- **Data migration on upgrade**: The `version(2).upgrade()` callback runs exactly once per client. It reads existing playlists, creates `playlist_entries` rows, and populates `liked_songs`/`recently_played`. Test this thoroughly — if it fails, the database could be in an inconsistent state.
- **Backward compat**: The old `playlist.tracks` field still exists on the Playlist document for backward compat during rollback. New code reads from `playlist_entries` + `tracks` join.
- **Write amplification eliminated**: With `playlist_entries`, adding/removing a single track no longer reads/writes the entire playlist document. For a 200-track playlist, this is ~200x less data per operation.

---

## 9. Error Handling & Recovery

### BloomeeTunes Pattern
`PluginException` hierarchy with specific types (`PluginNotFoundException`, `TrackResolveException`, `PlayerException`). `PlayerErrorHandler` with circuit breaker (N consecutive failures → fail-fast for T seconds). `SkipError` logging for analytics.

### MoonPlayer Current State
`console.error` + toast notifications in most places. `ErrorBoundary` at app root (`src/components/common/ErrorBoundary/ErrorBoundary.jsx`). No error classification, no retry, no circuit breaker, no recovery suggestions.

### The Gap
No structured errors. No automatic recovery. No circuit breaker. No debugging history.

### Implementation Steps

1. **Create `src/core/errors/AppError.js`** — error classification:

```javascript
// src/core/errors/AppError.js

/** @typedef {'network'|'api'|'audio'|'storage'|'unknown'} ErrorCategory */

/**
 * Application error with classification and recovery metadata.
 */
export class AppError extends Error {
  /**
   * @param {string} message
   * @param {ErrorCategory} category
   * @param {Object} [options]
   * @param {boolean} [options.recoverable=true]
   * @param {string} [options.recoveryHint]
   * @param {Error} [options.cause]
   */
  constructor(message, category, { recoverable = true, recoveryHint, cause } = {}) {
    super(message);
    this.name = 'AppError';
    this.category = category;
    this.recoverable = recoverable;
    this.recoveryHint = recoveryHint || this._defaultHint(category);
    this.timestamp = Date.now();
    this.cause = cause;
  }

  _defaultHint(category) {
    switch (category) {
      case 'network': return 'Check your internet connection and try again.';
      case 'api': return 'The server returned an error. Please try again later.';
      case 'audio': return 'This track could not be played. Try a different quality.';
      case 'storage': return 'There was a problem saving your data.';
      default: return 'Something went wrong. Please try again.';
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      recoverable: this.recoverable,
      recoveryHint: this.recoveryHint,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

// Factory functions
export const Errors = {
  network: (msg, opts) => new AppError(msg, 'network', opts),
  api: (msg, opts) => new AppError(msg, 'api', opts),
  audio: (msg, opts) => new AppError(msg, 'audio', opts),
  storage: (msg, opts) => new AppError(msg, 'storage', opts),
};
```

2. **Create `src/core/errors/CircuitBreaker.js`**:

```javascript
// src/core/errors/CircuitBreaker.js
export class CircuitBreaker {
  /**
   * @param {Object} [options]
   * @param {number} [options.failureThreshold=3] — failures before open
   * @param {number} [options.resetTimeout=30000] — ms before half-open
   * @param {string} [options.name='default']
   */
  constructor({ failureThreshold = 3, resetTimeout = 30000, name = 'default' } = {}) {
    this.name = name;
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
    this._failures = 0;
    this._state = 'closed'; // closed, open, half-open
    this._lastFailure = 0;
  }

  get state() { return this._state; }

  /**
   * Execute a function with circuit breaker protection.
   * @template T
   * @param {() => Promise<T>} fn
   * @returns {Promise<T>}
   */
  async call(fn) {
    if (this._state === 'open') {
      if (Date.now() - this._lastFailure > this.resetTimeout) {
        this._state = 'half-open';
      } else {
        throw new Error(`Circuit breaker "${this.name}" is OPEN`);
      }
    }

    try {
      const result = await fn();
      this._onSuccess();
      return result;
    } catch (error) {
      this._onFailure();
      throw error;
    }
  }

  _onSuccess() {
    this._failures = 0;
    this._state = 'closed';
  }

  _onFailure() {
    this._failures++;
    this._lastFailure = Date.now();
    if (this._failures >= this.failureThreshold) {
      this._state = 'open';
      console.warn(`Circuit breaker "${this.name}" opened after ${this._failures} failures`);
    }
  }

  reset() {
    this._failures = 0;
    this._state = 'closed';
  }
}

export const apiCircuitBreaker = new CircuitBreaker({
  name: 'MusicService',
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
});
```

3. **Create `src/core/errors/ErrorTracker.js`** — persist errors to IndexedDB:

```javascript
// src/core/errors/ErrorTracker.js
import { db } from '../db/schema';

const MAX_ERRORS = 100;

export const ErrorTracker = {
  /**
   * Log an error to persistent storage for debugging.
   * @param {AppError|Error} error
   * @param {Object} [context]
   */
  async log(error, context = {}) {
    try {
      const entry = {
        id: crypto.randomUUID(),
        message: error.message,
        category: error.category || 'unknown',
        recoverable: error.recoverable !== false,
        recoveryHint: error.recoveryHint || null,
        stack: error.stack,
        context: JSON.stringify(context),
        timestamp: Date.now(),
      };

      await db.history.add(entry);

      // Prune old entries
      const count = await db.history.count();
      if (count > MAX_ERRORS) {
        const oldest = await db.history
          .orderBy('timestamp')
          .limit(count - MAX_ERRORS)
          .toArray();
        await db.history.bulkDelete(oldest.map(e => e.id));
      }
    } catch (e) {
      // Don't let error logging fail — just console.warn
      console.warn('ErrorTracker failed to log:', e);
    }
  },

  /** @returns {Promise<Object[]>} */
  async getRecent(limit = 20) {
    return db.history
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray();
  },

  async clear() {
    await db.history.clear();
  },
};
```

4. **Create `src/core/errors/ErrorHandler.js`** — centralized error handler:

```javascript
// src/core/errors/ErrorHandler.js
import { useToastStore } from '../../store/toastStore';
import { AppError } from './AppError';
import { ErrorTracker } from './ErrorTracker';

export const ErrorHandler = {
  /**
   * Handle an error with user-facing feedback and logging.
   * @param {Error} error
   * @param {Object} [options]
   * @param {string} [options.context] — where the error occurred
   * @param {boolean} [options.toast=true] — show toast to user
   * @param {boolean} [options.throwAfter=false] — re-throw after handling
   */
  async handle(error, { context = '', toast = true, throwAfter = false } = {}) {
    const appError = error instanceof AppError ? error : new AppError(
      error.message || 'An unexpected error occurred',
      'unknown',
      { recoverable: false, cause: error }
    );

    // Log to persistent store
    await ErrorTracker.log(appError, { context });

    // Show toast to user
    if (toast) {
      const message = appError.recoveryHint
        ? `${appError.message}. ${appError.recoveryHint}`
        : appError.message;
      useToastStore.getState().addToast(message, 'error', 5000);
    }

    // Console logging
    console.error(`[${context}] ${appError.category}:`, appError.message, appError.cause || '');

    if (throwAfter) throw appError;
    return appError;
  },
};
```

5. **Integrate circuit breaker into API calls**:

```javascript
// In MusicService._fetch or fetchWithRetry:
import { apiCircuitBreaker } from '../errors/CircuitBreaker';

async function fetchWithRetry(url, { signal, retries = 3 } = {}) {
  return apiCircuitBreaker.call(async () => {
    // ... existing fetch logic ...
  });
}
```

### Files to Create
- `src/core/errors/AppError.js`
- `src/core/errors/CircuitBreaker.js`
- `src/core/errors/ErrorTracker.js`
- `src/core/errors/ErrorHandler.js`

### Files to Modify
- `src/core/api/MusicService.js` — use fetchWithRetry with circuit breaker
- `src/core/bootstrap.js` — clear old error logs on boot
- `src/core/audio/AudioEngine.js` — use ErrorHandler in onloaderror/onplayerror

### Migration/Risk Notes
- **Circuit breaker visibility**: When open, API calls fail instantly with a message. Users will see "Something went wrong" toasts. Add a "Retry" button to the toast that calls `apiCircuitBreaker.reset()`.
- **Error store growth**: 100 max errors at ~500 bytes each = ~50KB max. This is reasonable. Add a monthly cleanup cron in bootstrap.
- **Recovery hints**: The hint text is shown in the toast. It should be concise (under 100 chars) and actionable.

---

## 10. State Synchronization & Consistency

### BloomeeTunes Pattern
Cubit states are synchronous observable streams. Equatable ensures derived data triggers rebuilds only when truly changed. Single source of truth: each data type is owned by exactly one Cubit.

### MoonPlayer Current State
Zustand stores are independent. `playerStore.play()` calls `useLibraryStore.getState().addToRecentlyPlayed()` directly (`src/store/playerStore.js:128`). Likes toggling is in `libraryStore`. No cross-store consistency enforcement.

### The Gap
Without store synchronization, one store can have stale data. No documented data ownership. No reconciliation on rehydration.

### Implementation Steps

1. **Document data ownership** — create `src/core/DataOwnership.md` (or inline in code as JSDoc):

Add to `src/core/types.js`:
```javascript
/**
 * Data Ownership Map:
 *
 * ┌─────────────────────┬──────────────────────────────┬─────────────────────────┐
 * │ Data Type           │ Source of Truth              │ Consumers               │
 * ├─────────────────────┼──────────────────────────────┼─────────────────────────┤
 * │ currentTrack        │ playerStore                  │ BottomPlaybar, Controls │
 * │ isPlaying           │ playerStore                  │ Controls, Fullscreen    │
 * │ queue, queueIndex   │ queueStore                   │ QueuePanel, next/prev   │
 * │ playlists           │ libraryStore                 │ Library page, Playlist  │
 * │ likedSongs          │ likesStore                   │ TrackCard, TrackRow     │
 * │ recentlyPlayed      │ historyStore                 │ Home recommendations    │
 * │ preferences         │ preferenceStore              │ Settings, AudioEngine   │
 * │ toasts              │ toastStore                   │ ToastContainer          │
 * │ usageStats          │ usageStore                   │ Recommendations only    │
 * │ streamUrl cache     │ StreamURLCache (cache table)  │ TrackResolver           │
 * └─────────────────────┴──────────────────────────────┴─────────────────────────┘
 *
 * Cross-Store Synchronization Rules:
 * 1. When a track is played → playerStore.currentTrack updates,
 *    historyStore.addTrack() fires, usageStore.recordPlay() fires
 * 2. When likedSongs changes → no other store needs to update directly
 *    (likes are consumed via useLikesStore selector)
 * 3. When queue changes → PreResolver subscribes to queueStore
 * 4. When recentlyPlayed changes → HomeCache invalidates (already in recommendationService)
 * 5. playerStore.volume is source of truth; AudioEngine.setVolume is a side effect
 */
```

2. **Create `src/core/events/EventBus.js`** — typed event bus for cross-store communication:

```javascript
// src/core/events/EventBus.js
/**
 * Simple typed event bus for decoupled cross-store communication.
 * Stores emit events; other stores/services subscribe.
 */
class EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();
  }

  /**
   * @param {string} event
   * @param  {...any} args
   */
  emit(event, ...args) {
    this._listeners.get(event)?.forEach(cb => {
      try { cb(...args); } catch (e) { console.warn(`EventBus handler for "${event}" failed:`, e); }
    });
  }

  /**
   * @param {string} event
   * @param {Function} callback
   * @returns {() => void} unsubscribe function
   */
  on(event, callback) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(callback);
    return () => this._listeners.get(event)?.delete(callback);
  }

  /** Remove all listeners for an event */
  clear(event) {
    if (event) this._listeners.delete(event);
    else this._listeners.clear();
  }
}

export const eventBus = new EventBus();

// Event name constants
export const Events = {
  TRACK_PLAYED: 'track:played',
  TRACK_PAUSED: 'track:paused',
  TRACK_RESUMED: 'track:resumed',
  TRACK_SKIPPED: 'track:skipped',
  QUEUE_CHANGED: 'queue:changed',
  LIKES_CHANGED: 'likes:changed',
  PLAYLIST_CHANGED: 'playlist:changed',
  PREFERENCES_CHANGED: 'prefs:changed',
  OFFLINE_MODE: 'network:offline',
  ONLINE_MODE: 'network:online',
};
```

3. **Update `playerStore.play()`** to emit events instead of directly calling other stores:

```javascript
// In playerStore.js play action — after set():
import { eventBus, Events } from '../../core/events/EventBus';

play: async (track) => {
  if (!track) return;
  // ... resolve logic ...
  set({ currentTrack: track, isPlaying: true, progress: 0 });
  eventBus.emit(Events.TRACK_PLAYED, track);
},
```

4. **Create sync middleware** — side effect handlers that subscribe to events:

```javascript
// src/core/sync/playbackSync.js
// Subscribes to TRACK_PLAYED and syncs history + usage
import { eventBus, Events } from '../events/EventBus';
import { useHistoryStore } from '../../store/historyStore';
import { useUsageStore } from '../../store/usageStore';

export function initPlaybackSync() {
  const unsub = eventBus.on(Events.TRACK_PLAYED, async (track) => {
    useHistoryStore.getState().addTrack(track);
    useUsageStore.getState().recordPlay(track);
  });
  return unsub;
}
```

```javascript
// src/core/sync/librarySync.js
// Syncs playerStore when liked songs change (if needed)
import { eventBus, Events } from '../events/EventBus';

export function initLibrarySync() {
  // Currently no cross-store sync needed for likes
  // This is a placeholder for future requirements
  return () => {};
}
```

5. **Add state reconciliation on rehydration**:

```javascript
// Inside bootstrap.js — after all stores are hydrated:
async function reconcileState() {
  const playerState = usePlayerStore.getState();
  const queueState = useQueueStore.getState();

  // If currentTrack is stale (deleted from library, URL expired), clear player
  if (playerState.currentTrack) {
    const { trackRepository } = await import('../repositories/TrackRepository');
    try {
      const fresh = await trackRepository.getTrackDetails(playerState.currentTrack.id);
      if (!fresh || !fresh.streamUrl) {
        console.warn('Reconciliation: currentTrack is stale, clearing player');
        usePlayerStore.setState({ currentTrack: null, isPlaying: false });
        useQueueStore.setState({ queue: [], queueIndex: -1 });
      }
    } catch {
      // Network error during rehydration — keep current state, user may be offline
      console.warn('Reconciliation: could not verify currentTrack, keeping it');
    }
  }

  // Ensure queueIndex is valid
  if (queueState.queueIndex >= queueState.queue.length) {
    useQueueStore.setState({ queueIndex: queueState.queue.length > 0 ? 0 : -1 });
  }
}
```

### Files to Create
- `src/core/events/EventBus.js`
- `src/core/sync/playbackSync.js`
- `src/core/sync/librarySync.js`

### Files to Modify
- `src/store/playerStore.js` — emit TRACK_PLAYED event instead of calling historyStore directly
- `src/core/bootstrap.js` — call initPlaybackSync(), initLibrarySync(), reconcileState()
- `src/core/types.js` — add data ownership JSDoc block

### Migration/Risk Notes
- **Event ordering**: Events are emitted synchronously. If a handler throws, other handlers still run (caught by try/catch in EventBus). No guaranteed ordering between handlers.
- **Memory leaks**: `eventBus.on()` returns an unsubscribe function. Call it on store/service cleanup. In practice, all sync handlers live for the app's lifetime, so this is mainly relevant for testing.
- **Circular dependencies**: Events flow one direction: Store → EventBus → Sync Handlers → Other Stores. Never Store → Store directly. This prevents circular update loops.
