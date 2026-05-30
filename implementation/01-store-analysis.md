# Zustand Store Analysis — MoonPlayer

> **Date**: 2026-05-30
> **Scope**: All Zustand stores + core services that interact with them
> **Files Analyzed**: 7 files (4 stores, 3 services)

---

## Findings Summary

| Severity | Count |
|----------|-------|
| High     | 6     |
| Medium   | 12    |
| Low      | 8     |

---

## `playerStore.js`

### Finding P-1: Side effects inside `set()` updater function

- **Category**: Design Pattern Violations
- **File**: `src/store/playerStore.js`
- **Line**: 102–131
- **Severity**: HIGH
- **Issue**: The `play()` action calls `AudioEngine.playTrack()`, `AudioEngine.setPlaybackSpeed()`, and `AudioEngine.updateMediaSession()` **inside** the `set((state) => {...})` updater callback (lines 117–122). Zustand's updater function should be a **pure function** that only computes and returns new state. Side effects inside the updater are an anti-pattern: they break the expected semantics, make testing harder, and if the updater throws, the state is left in a partially-applied state.
- **Suggestion**: Move all side effects (AudioEngine calls, `useLibraryStore.getState().addToRecentlyPlayed(track)` on line 134) **outside** the `set()` call. Compute the new state first, then call `set()`, then run side effects:

```js
play: (track) => {
  let newQueue, newIndex;
  // ... compute new state ...
  set({ currentTrack: track, queue: newQueue, queueIndex: newIndex, isPlaying: true, progress: 0 });
  AudioEngine.playTrack(track.streamUrl, get().volume);
  AudioEngine.setPlaybackSpeed(usePreferenceStore.getState().playbackSpeed);
  AudioEngine.updateMediaSession(track);
  useLibraryStore.getState().addToRecentlyPlayed(track).catch(console.error);
},
```

---

### Finding P-2: `playNext` insertion index logic error

- **Category**: Logic Errors
- **File**: `src/store/playerStore.js`
- **Line**: 208–222
- **Severity**: HIGH
- **Issue**: When `playNext(track)` is called and the track **already exists** in the queue before the current index, the `insertIdx` calculation is wrong. The track is first removed from the queue (line 211), which shifts all elements after it by -1. But `insertIdx` is computed from the **old** `state.queueIndex + 1`, not accounting for this shift.

  **Example**: Queue = `[A, B, C, D]`, `queueIndex = 2` (playing C). Call `playNext(B)`.
  1. `filteredQueue = [A, C, D]` (B removed, C shifts from index 2 → 1)
  2. `insertIdx = 2 + 1 = 3` (still using old index)
  3. Result: `[A, C, D, B]` — **B should be right after C**: `[A, C, B, D]`

  The correct logic: if the removed track was **before** `queueIndex`, insert at `queueIndex` (not +1); if after, insert at `queueIndex + 1`.

- **Suggestion**: Recalculate `insertIdx` based on whether the removed element was before or after the current track:

```js
playNext: (track) => set((state) => {
  const currentIdx = state.queue.findIndex(t => t.id === track.id);
  const wasRemoved = currentIdx !== -1;
  const filteredQueue = state.queue.filter(t => t.id !== track.id);
  const insertIdx = state.queueIndex !== -1 ? state.queueIndex + 1 : 0;
  // Adjust if removed element was before current position
  const adjustedInsertIdx = (wasRemoved && currentIdx < state.queueIndex) ? insertIdx - 1 : insertIdx;
  filteredQueue.splice(Math.max(0, adjustedInsertIdx), 0, track);
  const newCurrentIdx = filteredQueue.findIndex(t => t.id === state.currentTrack?.id);
  useToastStore.getState().addToast(`Added "${track.title}" to play next`, 'success');
  return { queue: filteredQueue, queueIndex: newCurrentIdx !== -1 ? newCurrentIdx : 0 };
}),
```

---

### Finding P-3: Unhandled async call in `play()` action

- **Category**: Missing Error Boundaries
- **File**: `src/store/playerStore.js`
- **Line**: 134
- **Severity**: HIGH
- **Issue**: `useLibraryStore.getState().addToRecentlyPlayed(track)` is an **async** function but is called **without `await`** and without `.catch()`. If the Dexie `put` operation inside `addToRecentlyPlayed` fails, the error becomes an unhandled promise rejection. The `play()` action is synchronous, so this is fire-and-forget with no error visibility.
- **Suggestion**: Append `.catch(console.error)` to the call, or make the `play` action handle it properly:

```js
useLibraryStore.getState().addToRecentlyPlayed(track).catch((err) => {
  console.error('Failed to log recently played:', err);
});
```

---

### Finding P-4: Missing error handling on all `AudioEngine.*` calls

- **Category**: Error Handling Issues
- **File**: `src/store/playerStore.js`
- **Line**: 117–119, 138, 143, 148, 155, 158, 164, 177, 191
- **Severity**: MEDIUM
- **Issue**: Every `AudioEngine` method call (`playTrack`, `pause`, `resume`, `setVolume`, `seek`, etc.) is called without try/catch. If any throws (e.g., invalid stream URL, audio context failure, browser policy), the error propagates unhandled and the store state becomes inconsistent with the actual audio engine state. For example, `play()` sets `isPlaying: true` even if `AudioEngine.playTrack()` threw.
- **Suggestion**: Wrap AudioEngine calls in try/catch, roll back optimistic state on failure, and surface errors to the user via toast:

```js
play: (track) => {
  try {
    AudioEngine.playTrack(track.streamUrl, get().volume);
  } catch (error) {
    console.error('Playback failed:', error);
    useToastStore.getState().addToast('Failed to play track', 'error');
    return; // don't update state
  }
  set({ ... });
}
```

---

### Finding P-5: Module-level `storeAPI` escape hatch is fragile

- **Category**: Design Pattern Violations
- **File**: `src/store/playerStore.js`
- **Line**: 10, 40
- **Severity**: MEDIUM
- **Issue**: `storeAPI` is a module-level mutable variable that is set inside the `create()` callback. This is used to wire up `AudioEngine` callbacks. The pattern is fragile:
  1. If the store module is imported but the `create()` call hasn't executed yet, `storeAPI` is `null` and callbacks silently no-op.
  2. Multiple stores or hot-reload scenarios could cause stale references.
  3. Mutating a module-level variable from inside a closure is a side-effect that makes the module's behavior dependent on initialization order.
- **Suggestion**: Use Zustand's own `subscribe` for reacting to state changes, or expose the store-api via a dedicated exported function rather than a mutable variable:

```js
export function getPlayerStoreAPI() {
  return usePlayerStore;
}
```

---

### Finding P-6: No input validation on `setVolume` / `seek`

- **Category**: Error Handling Issues
- **File**: `src/store/playerStore.js`
- **Line**: 147–149, 163–166
- **Severity**: LOW
- **Issue**: `setVolume(volume)` and `seek(seconds)` accept raw values with no validation. Passing `NaN`, `Infinity`, or negative values to `AudioEngine.setVolume()` or `AudioEngine.seek()` results in undefined behavior. For example, `setVolume(-5)` calls `Howler.volume(-5)` and sets `state.volume = -5`.
- **Suggestion**: Add clamping:

```js
setVolume: (volume) => {
  const clamped = Math.max(0, Math.min(1, volume));
  AudioEngine.setVolume(clamped);
  set({ volume: clamped, isMuted: clamped === 0 });
},
seek: (seconds) => {
  const clamped = Math.max(0, seconds);
  AudioEngine.seek(clamped);
  set({ progress: clamped });
},
```

---

### Finding P-7: `sleepTimer` uses global `window` property

- **Category**: Design Pattern Violations
- **File**: `src/store/playerStore.js`
- **Line**: 76–78, 90, 94–95
- **Severity**: LOW
- **Issue**: `window._sleepTimerInterval` is used to store the interval ID. This pollutes the global namespace and couples the store to the DOM environment (making SSR/impossible, though not yet a concern). In testing, this global would persist across tests and cause leaks.
- **Suggestion**: Store the interval ID in a module-level variable (closure-scoped) rather than on `window`:

```js
let sleepTimerInterval = null;
// inside create: use sleepTimerInterval instead of window._sleepTimerInterval
```

---

### Finding P-8: `onRehydrateStorage` calls AudioEngine without init guard

- **Category**: Error Handling Issues
- **File**: `src/store/playerStore.js`
- **Line**: 306–310
- **Severity**: LOW
- **Issue**: `AudioEngine.setVolume(state.volume)` is called on rehydration. If `AudioEngine` hasn't been fully initialized by this point (e.g., import order issue, SSR, or testing environment without Web Audio API), this will throw. There's no try/catch guard.
- **Suggestion**: Wrap in try/catch:

```js
onRehydrateStorage: () => (state) => {
  if (state) {
    try { AudioEngine.setVolume(state.volume); } catch (e) { /* AudioEngine not ready */ }
  }
}
```

---

### Finding P-9: `play()` references `playbackSpeed` from preferenceStore inside updater

- **Category**: Design Pattern Violations
- **File**: `src/store/playerStore.js`
- **Line**: 118–120
- **Severity**: LOW
- **Issue**: `usePreferenceStore.getState()` is called **inside** `set()`'s updater function. While this is a read (not a write), it introduces cross-store coupling inside what should be a pure state computation. If `usePreferenceStore` ever throws, the updater fails and state is partially applied.
- **Suggestion**: Move `usePreferenceStore.getState().playbackSpeed` outside the `set()` call (this is resolved when the call to `play()` is moved outside `set()` per P-1).

---

## `preferenceStore.js`

### Finding PREFS-1: Optimistic update with no rollback on Dexie failure

- **Category**: Error Handling Issues
- **File**: `src/store/preferenceStore.js`
- **Line**: 47–62
- **Severity**: MEDIUM
- **Issue**: `updatePreference` calls `set({ [key]: value })` **before** persisting to Dexie (line 48). If `db.preferences.put()` throws (line 58), the in-memory state is already updated but Dexie wasn't. The error is logged but never surfaced to the user. On next hydrate, preferences revert to the old values, creating a confusing UX where a setting appears saved but isn't.
- **Suggestion**: Swap the order — persist first, then update in-memory state. Or implement an optimistic update with rollback:

```js
updatePreference: async (key, value) => {
  const prev = get()[key]; // snapshot for rollback
  set({ [key]: value });
  try {
    const prefsToSave = { ...get() };
    delete prefsToSave.isHydrated;
    delete prefsToSave.hydrate;
    delete prefsToSave.updatePreference;
    await db.preferences.put(prefsToSave);
  } catch (error) {
    set({ [key]: prev }); // rollback
    console.error(`Failed to persist preference ${key}:`, error);
    throw error;
  }
},
```

---

### Finding PREFS-2: Manual deletion of non-persistable fields is fragile

- **Category**: Code Duplication / Maintenance
- **File**: `src/store/preferenceStore.js`
- **Line**: 53–56
- **Severity**: LOW
- **Issue**: `updatePreference` manually deletes `isHydrated`, `hydrate`, and `updatePreference` from the saved object. This is error-prone: if someone adds a new action or a non-persistable state key and forgets to add it to the delete list, it gets serialized. A whitelist approach would be more maintainable.
- **Suggestion**: Use a whitelist of persistable keys:

```js
const PERSISTABLE_KEYS = ['id', 'username', 'isOnboardingComplete', 'streamQuality', ...];
const prefsToSave = Object.fromEntries(
  Object.entries(currentPrefs).filter(([k]) => PERSISTABLE_KEYS.includes(k))
);
```

---

### Finding PREFS-3: No JSDoc / TypeScript annotations

- **Category**: TypeScript Issues
- **File**: `src/store/preferenceStore.js`
- **Line**: 1–77
- **Severity**: LOW
- **Issue**: All 25+ preference fields and 3 methods lack any type documentation. There are implicit `any` types throughout. This makes refactoring risky and IDE support poor.
- **Suggestion**: Add JSDoc typedefs:

```js
/**
 * @typedef {Object} Preferences
 * @property {string} id
 * @property {string} username
 * @property {boolean} isOnboardingComplete
 * @property {'96kbps'|'160kbps'|'192kbps'|'320kbps'} streamQuality
 * // ... etc
 */
```

---

### Finding PREFS-4: `DEFAULT_PREFS` spread as top-level keys

- **Category**: Design Pattern Violations
- **File**: `src/store/preferenceStore.js`
- **Line**: 26
- **Severity**: LOW
- **Issue**: Spreading `...DEFAULT_PREFS` at the top level of the store object means every preference is a top-level key. This can cause naming collisions if a preference key happens to match a future action name or internal property. It also means every component subscribing to the store gets the entire preference object in its selector scope.
- **Suggestion**: Optionally namespace preferences:

```js
export const usePreferenceStore = create((set, get) => ({
  prefs: { ...DEFAULT_PREFS },
  isHydrated: false,
  updatePreference: async (key, value) => {
    set((state) => ({ prefs: { ...state.prefs, [key]: value } }));
    // ...
  },
}));
```

---

## `libraryStore.js`

### Finding L-1: All async actions (except `hydrate`) lack try/catch — unhandled promise rejections

- **Category**: Missing Error Boundaries
- **File**: `src/store/libraryStore.js`
- **Line**: 30–120
- **Severity**: HIGH
- **Issue**: `createPlaylist`, `deletePlaylist`, `renamePlaylist`, `addTrackToPlaylist`, `removeTrackFromPlaylist`, `toggleLikeTrack`, and `addToRecentlyPlayed` are all `async` functions that call `db.playlists.put()` or `db.playlists.delete()` **without any try/catch**. If any Dexie operation fails (e.g., IndexedDB quota exceeded, database version mismatch, or a structural clone error), the promise rejects and becomes an unhandled promise rejection. Node.js v15+ will crash on unhandled rejections; browsers will log warnings.
- **Suggestion**: Wrap every Dexie operation in try/catch:

```js
deletePlaylist: async (playlistId) => {
  set((state) => ({ playlists: state.playlists.filter(p => p.id !== playlistId) }));
  try {
    await db.playlists.delete(playlistId);
  } catch (error) {
    console.error('Failed to delete playlist:', error);
    // Optionally re-hydrate to restore state
    get().hydrate();
  }
},
```

---

### Finding L-2: Optimistic updates without rollback — state/db inconsistency

- **Category**: Error Handling Issues
- **File**: `src/store/libraryStore.js`
- **Line**: 30–120
- **Severity**: HIGH
- **Issue**: Every write action updates the in-memory Zustand state **before** persisting to Dexie. If the Dexie write fails, the in-memory state is now out of sync with the database. On the next page load (hydrate), the user will see the old state, losing their action silently. This is the same pattern issue as PREFS-1 but more severe because it affects playlist data that users might spend time curating.
- **Suggestion**: Reverse the order: persist to Dexie first, then update Zustand state. Or batch both and implement rollback. At minimum, re-hydrate on failure:

```js
addTrackToPlaylist: async (playlistId, track) => {
  const { playlists } = get();
  const target = playlists.find(p => p.id === playlistId);
  if (!target || target.tracks.some(t => t.id === track.id)) return;
  const updated = { ...target, tracks: [...target.tracks, track], dateUpdated: Date.now() };
  try {
    await db.playlists.put(updated);
    set({ playlists: playlists.map(p => p.id === playlistId ? updated : p) });
  } catch (error) {
    console.error('Failed to add track to playlist:', error);
  }
},
```

---

### Finding L-3: Silent no-op when target playlist not found

- **Category**: Error Handling Issues
- **File**: `src/store/libraryStore.js`
- **Line**: 51, 61, 73
- **Severity**: MEDIUM
- **Issue**: `renamePlaylist`, `addTrackToPlaylist`, and `removeTrackFromPlaylist` silently return without action if the playlist is not found (`target` is falsy). The caller has no way to know the operation was a no-op. This could happen due to race conditions (e.g., user deletes a playlist while another component tries to add to it).
- **Suggestion**: Log a warning in development, or surface via toast:

```js
if (!target) {
  console.warn(`Playlist ${playlistId} not found in store`);
  return;
}
```

---

### Finding L-4: `createPlaylist` stores empty `coverImage` as `null` in `db.playlists`

- **Category**: Design Pattern Violations
- **File**: `src/store/libraryStore.js`
- **Line**: 30–41
- **Severity**: LOW
- **Issue**: The `newPlaylist` object includes `coverImage: null`. If the playlist schema expects `coverImage` to be `undefined` or a string, storing `null` could cause validation issues in IndexedDB structural cloning (though IndexedDB supports `null`). Minor consistency concern.
- **Suggestion**: Omit `coverImage` entirely or use a consistent sentinel:

```js
const newPlaylist = {
  id: crypto.randomUUID(),
  name,
  tracks: [],
  dateUpdated: Date.now(),
};
```

---

## `toastStore.js`

### Finding T-1: No timeout cleanup on component unmount

- **Category**: Reactivity/Performance Issues
- **File**: `src/store/toastStore.js`
- **Line**: 13–18
- **Severity**: LOW
- **Issue**: `addToast` sets a `setTimeout` to auto-remove the toast. If a toast is dismissed manually via `removeToast` before the timeout fires, the timeout still exists and will call `set()` to filter out a toast that is no longer present (a harmless no-op on the update, but the timeout itself is a wasted callback and keeps the closure alive). This is a minor memory/reference leak.
- **Suggestion**: Return a cancellation function alongside the `id`:

```js
addToast: (message, type = 'info', duration = 3000) => {
  const id = crypto.randomUUID();
  set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
  const timer = duration > 0 ? setTimeout(() => removeToast(id), duration) : null;
  return { id, cancel: () => { if (timer) clearTimeout(timer); } };
},
```

---

### Finding T-2: No type validation for `message` / `type`

- **Category**: TypeScript Issues
- **File**: `src/store/toastStore.js`
- **Line**: 6
- **Severity**: LOW
- **Issue**: `message` and `type` are untyped. If `message` is `undefined` or an object, it would be rendered as `[object Object]` or `undefined` in the UI. No guard.
- **Suggestion**: Add a simple guard or JSDoc:

```js
addToast: (message, type = 'info', duration = 3000) => {
  if (!message) return null;
  // ...
}
```

---

## `queueService.js`

### Finding Q-1: Race condition — subscribe callback operates on stale state

- **Category**: Logic Errors
- **File**: `src/core/audio/queueService.js`
- **Line**: 9–44
- **Severity**: MEDIUM
- **Issue**: The subscribe callback is `async`. Since Zustand's `subscribe` does not await or cancel previous callbacks, multiple invocations can overlap:

  1. User plays track A → `remainingTracks < 3` → starts fetching for artist A
  2. `isFetching` is `true` (line 20)
  3. User clears queue or plays track B → subscribe fires again
  4. `isFetching` is still `true` from step 1 → callback bails early at line 18
  5. Fetch for artist A completes → adds tracks to queue that are now irrelevant

  The `isFetching` flag prevents concurrent fetches but doesn't prevent stale results from being applied after state has changed.
- **Suggestion**: Use an `AbortController` or a "generation counter" to discard stale results:

```js
let fetchGeneration = 0;
export function initQueueService() {
  usePlayerStore.subscribe(async (state, prevState) => {
    if (...) return;
    const currentGeneration = ++fetchGeneration;
    isFetching = true;
    try {
      const similarTracks = await MusicService.searchSongs(...);
      if (currentGeneration !== fetchGeneration) return; // stale, discard
      if (similarTracks?.length) {
        usePlayerStore.getState().addToQueue(similarTracks);
      }
    } finally {
      isFetching = false;
    }
  });
}
```

---

### Finding Q-2: No guard against adding duplicates of tracks already in queue tail

- **Category**: Logic Errors
- **File**: `src/core/audio/queueService.js`
- **Line**: 36
- **Severity**: LOW
- **Issue**: `addToQueue` filters out tracks already present by `id`. But what if the queue already has many tracks by the same artist and a search returns those exact tracks? They'll be silently filtered out, potentially resulting in `addToQueue` adding 0 tracks with no feedback. The user might notice the queue isn't growing but won't know why.
- **Suggestion**: No action needed — the behavior is correct (no duplicates). But consider logging when all tracks were filtered out.

---

## `lyricsService.js`

### Finding LYR-1: `MusicService.getLyrics()` call not wrapped in try/catch

- **Category**: Error Handling Issues
- **File**: `src/core/audio/lyricsService.js`
- **Line**: 16
- **Severity**: MEDIUM
- **Issue**: On line 16, `await MusicService.getLyrics(track.lyricsId)` is called without a try/catch. `MusicService.getLyrics()` internally calls `this._fetch()` which can throw on network errors or bad API responses (it re-throws after logging). Since there's no try/catch on line 16, if `track.lyricsId` exists and the API fails, the entire `getLyrics()` method throws an **unhandled promise rejection** that propagates to the caller. The LRCLIB fallback (line 27+) is never reached.
- **Suggestion**: Wrap line 16 in a try/catch to gracefully fall through to LRCLIB:

```js
if (track.lyricsId) {
  try {
    const nativeLyrics = await MusicService.getLyrics(track.lyricsId);
    if (nativeLyrics?.lyrics) {
      lrcString = nativeLyrics.lyrics.replace(/<br\s*\/?>/gi, '\n');
      isSynced = false;
    }
  } catch (err) {
    console.warn('Native lyrics fetch failed, trying fallback:', err);
  }
}
```

---

### Finding LYR-2: No timeout on `fetch` to lrclib.net

- **Category**: Error Handling Issues
- **File**: `src/core/audio/lyricsService.js`
- **Line**: 40
- **Severity**: MEDIUM
- **Issue**: `fetch()` has no timeout. If lrclib.net is slow or unreachable, the request could hang for 30–90 seconds (browser default). During this time, the lyrics UI will be in a loading state with no feedback.
- **Suggestion**: Use `AbortSignal.timeout()` or `Promise.race` with a timeout:

```js
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);
const response = await fetch(`https://lrclib.net/api/get?${params}`, {
  signal: controller.signal
});
clearTimeout(timeout);
```

---

### Finding LYR-3: No request cancellation mechanism (AbortController)

- **Category**: Reactivity/Performance Issues
- **File**: `src/core/audio/lyricsService.js`
- **Line**: 40
- **Severity**: LOW
- **Issue**: If the user rapidly skips tracks, multiple `getLyrics()` calls run concurrently. Old fetches that resolve later will overwrite newer lyrics in the UI. There's no mechanism to cancel the previous fetch.
- **Suggestion**: Expose an `AbortController` as an optional parameter, or use the generation-counter pattern from Q-1.

---

### Finding LYR-4: Unsanitized LRC content from network

- **Category**: Security Issues
- **File**: `src/core/audio/lyricsService.js`
- **Line**: 44, 47
- **Severity**: LOW
- **Issue**: `data.syncedLyrics` and `data.plainLyrics` come from an external API (`lrclib.net`) and are used as-is. If the consuming React component renders these via `dangerouslySetInnerHTML`, it would be an XSS vector. The `parseLRC` function extracts text portions but doesn't strip HTML tags.
- **Suggestion**: Add a text-only sanitization step in `parseLRC` or ensure the consuming component uses `textContent` rather than `innerHTML`. At minimum, strip HTML:

```js
const text = trimmed.replace(timeRegex, '').trim().replace(/<[^>]*>/g, '');
```

---

## `recommendationService.js`

### Finding R-1: Empty `catch` block silently swallows errors

- **Category**: Error Handling Issues
- **File**: `src/core/audio/recommendationService.js`
- **Line**: 90–92
- **Severity**: MEDIUM
- **Issue**: The `catch` block on line 90–92 is completely empty — no logging, no fallback, no user feedback. If the trending playlist fetch fails (which is the last fallback), the error disappears silently and the user sees an empty carousel with no indication of failure.
- **Suggestion**: At minimum log the error:

```js
} catch (err) {
  console.warn('Trending fallback fetch failed:', err);
}
```

---

### Finding R-2: No request cancellation (AbortController)

- **Category**: Reactivity/Performance Issues
- **File**: `src/core/audio/recommendationService.js`
- **Line**: 19, 25, 60, 82
- **Severity**: MEDIUM
- **Issue**: All four `MusicService` fetch calls (`getTrending`, `searchSongs`) lack an `AbortController`. If a component calls `getPersonalizedRecommendations()` on mount and the user navigates away before it resolves, all in-flight requests continue until completion, wasting bandwidth and battery.
- **Suggestion**: Accept an `AbortSignal` parameter and pass it through to `MusicService` calls, which should forward it to `fetch()`.

---

### Finding R-3: No caching — repeated calls re-fetch all data

- **Category**: Reactivity/Performance Issues
- **File**: `src/core/audio/recommendationService.js`
- **Line**: 10–96
- **Severity**: LOW
- **Issue**: `getPersonalizedRecommendations()` is designed to be called when the home page loads. If called multiple times (navigation, focus events), it re-fetches everything from the network. For a mobile/battery-sensitive environment, adding a simple TTL cache would be beneficial.
- **Suggestion**: Add a module-level cache with a 5-minute TTL:

```js
let cachedResult = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

async getPersonalizedRecommendations() {
  if (Date.now() - cacheTime < CACHE_TTL && cachedResult) return cachedResult;
  // ... existing logic ...
  cachedResult = carousels;
  cacheTime = Date.now();
  return carousels;
}
```

---

### Finding R-4: Empty response possible with no user feedback

- **Category**: Error Handling Issues
- **File**: `src/core/audio/recommendationService.js`
- **Line**: 10–96
- **Severity**: LOW
- **Issue**: If all API calls fail (no trending, no artist results, no fallback), the function returns an empty array `[]`. There's no mechanism to communicate the failure state to the UI. The user sees an empty home page with no errors.
- **Suggestion**: Consider throwing, returning an error flag, or returning a "Could not load recommendations" error carousel.

---

## Cross-Cutting Concerns

### CC-1: Direct `.getState()` cross-store coupling

- **Category**: Design Pattern Violations
- **Files**: `playerStore.js`, `queueService.js`, `recommendationService.js`
- **Line**: Various
- **Severity**: MEDIUM
- **Issue**: Multiple stores read each other's state via `.getState()` directly (playerStore → libraryStore + preferenceStore; recommendationService → libraryStore + preferenceStore). This creates tight coupling. If a store's internal shape changes, all consumers break. Testing a store in isolation becomes harder.
- **Suggestion**: Consider an event-bus pattern or a dedicated "service" layer for cross-store orchestration. At minimum, document the dependencies clearly.

### CC-2: No TypeScript — implicit `any` throughout

- **Category**: TypeScript Issues
- **Files**: All 7 files
- **Line**: All
- **Severity**: MEDIUM
- **Issue**: All files are plain `.js`. Every track object, playlist object, preference value, and return type is implicitly `any`. This eliminates the benefits of static analysis, makes refactoring dangerous, and degrades IDE support (no autocomplete, no inline docs).
- **Suggestion**: Convert to `.ts` or add comprehensive JSDoc typedefs. Since this is an existing JS project, JSDoc is the low-friction path:

```js
/**
 * @typedef {Object} Track
 * @property {string} id
 * @property {string} title
 * @property {string[]} artistNames
 * @property {string} streamUrl
 * @property {number} duration
 * @property {string} imageUrl
 * @property {string|null} lyricsId
 */
```

### CC-3: No unit tests for store logic

- **Category**: Missing Error Boundaries
- **Files**: All store files
- **Line**: N/A
- **Severity**: MEDIUM
- **Issue**: The stores contain complex business logic (queue management, shuffle, sleep timer, play-next insertion, optimistic persistence) with no apparent unit tests. The `AudioEngine` has tests, but store actions are untested.
- **Suggestion**: Add Zustand store tests following the pattern from the existing test suite. Zustand stores can be tested without React by using `.getState()` and `.setState()` directly.

---

## File-by-File Summary

| File | Lines | Issues Found | High | Med | Low |
|------|-------|-------------|------|-----|-----|
| `playerStore.js` | 313 | 9 | 3 | 2 | 4 |
| `preferenceStore.js` | 77 | 4 | 0 | 1 | 3 |
| `libraryStore.js` | 121 | 4 | 2 | 1 | 1 |
| `toastStore.js` | 37 | 2 | 0 | 0 | 2 |
| `queueService.js` | 45 | 2 | 0 | 1 | 1 |
| `lyricsService.js` | 106 | 4 | 0 | 2 | 2 |
| `recommendationService.js` | 99 | 4 | 0 | 2 | 2 |

## Top Priority Fixes

1. **P-1**: Side effects inside `set()` updater in `play()` → breaks Zustand purity contract
2. **P-2**: `playNext` insertion index bug → corrupts queue order
3. **P-3**: Unhandled async call in `play()` → unhandled promise rejection
4. **L-1**: All library actions lack try/catch → unhandled promise rejections
5. **L-2**: Optimistic updates without rollback → silent data loss
6. **P-4**: Missing error handling on AudioEngine calls → state/engine inconsistency
