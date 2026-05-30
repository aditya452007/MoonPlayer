# Core Services Analysis

> Comprehensive audit of all `src/core/` files in MoonPlayer.
> Covers audio, API, updater, DB, and utility modules.

---

## Architecture Overview

The core layer is built around **singleton service instances** exported as module-level constants. Seven of eight service modules follow this pattern; `UpdateService` is the lone exception (static class). Utilities are pure functions. The database (`schema.js`) is clean and well-structured.

**Export pattern inconsistency:**

| Module | Pattern |
|--------|---------|
| AudioEngine | `export const AudioEngine = new AudioEngineImpl()` |
| VisualizerEngine | `export const visualizerEngine = new VisualizerEngineImpl()` |
| MusicService | `export const MusicService = new MusicServiceImpl()` |
| downloadService | `export const downloadService = new DownloadServiceImpl()` |
| shareService | `export const shareService = new ShareServiceImpl()` |
| UpdateService | `export class UpdateService` (static methods only) |
| schema | `export const db = new MoonDatabase()` |

---

## File-by-File Analysis

---

### 1. `src/core/audio/AudioEngine.js` (207 lines)

**Category**: Logic Error
**File**: `src/core/audio/AudioEngine.js`
**Lines**: 34-55
**Severity**: **HIGH**
**Issue**: Howl instance created without `onloaderror` or `onplayerror` callbacks. If the stream URL is invalid, CORS-blocked, or the server returns a non-media response, playback silently fails. The `onplay` callback at line 39 never fires, so `_startProgressLoop()` and `_setupEqualizer()` are never called, leaving the engine in a partially initialized state.
**Suggestion**: Add `onloaderror` and `onplayerror` handlers that invoke a user-facing error callback, clean up the sound instance, and reset engine state.

---

**Category**: Design Pattern / Tight Coupling
**File**: `src/core/audio/AudioEngine.js`
**Lines**: 103-105
**Severity**: **HIGH**
**Issue**: Accesses Howler.js private internals via `this.sound._sounds[0]._node`. The `_sounds` array may be empty if the audio hasn't loaded yet, causing a runtime `TypeError: Cannot read properties of undefined`. Also deeply couples the equalizer to Howler's undocumented internal data structures, which can break silently on library version bumps.
**Suggestion**: Use Howler's public `sound._howl` reference or restructure to create the `MediaElementSource` using a dedicated `<audio>` element (instantiated separately and passed into Howl via the `html5` option's `src` attribute), avoiding any dependency on private properties.

---

**Category**: Logic Error
**File**: `src/core/audio/AudioEngine.js`
**Lines**: 107-110
**Severity**: **HIGH**
**Issue**: `crossOrigin` is set on `audioNode` *after* the Howl instance is constructed. For HTML5 audio (which AudioEngine forces via `html5: true`), the underlying `<audio>` element may already have started fetching the resource by the time `_setupEqualizer` runs. Setting `crossOrigin` after the fetch has begun is ignored by the browser, resulting in a tainted canvas error if the audio element doubles as a source for analysis.
**Suggestion**: Configure `crossOrigin` before the audio element begins loading. This can be done by providing a pre-configured `<audio>` element to Howl, or by setting `crossOrigin` on the element synchronously during Howl construction via a Howler.js plugin/hook.

---

**Category**: Resource Management
**File**: `src/core/audio/AudioEngine.js`
**Lines**: 1-207
**Severity**: **HIGH**
**Issue**: No `destroy()` / `dispose()` method. AudioEngine creates an `AudioContext` (line 114), connects filter nodes, and creates a `MediaElementSource`. None of these are ever disconnected or closed. If the engine needs to be reset or if the component unmounts, the AudioContext remains open, accumulating memory. The progress `setInterval` (line 192) persists until playback ends.
**Suggestion**: Add a `destroy()` method that: (1) disconnects all equalizer filters, (2) closes `this.eqContext`, (3) calls `this.sound.unload()`, (4) clears the progress interval, and (5) nullifies all references.

---

**Category**: Concurrency / Race Condition
**File**: `src/core/audio/AudioEngine.js`
**Lines**: 26-57
**Severity**: **MEDIUM**
**Issue**: `playTrack()` calls `this.sound.unload()` and then immediately creates a new Howl instance. If `playTrack` is called rapidly (e.g., user skipping songs quickly), the unload of the previous sound may not complete before the new Howl is created. The new Howl's `src` attribute may also be affected if the previous HTML5 audio element is still releasing resources.
**Suggestion**: Add an `unloading` flag. If a sound is currently unloading, await a small microtask tick before proceeding. Alternatively, queue `playTrack` calls so they execute serially.

---

**Category**: Logic Error
**File**: `src/core/audio/AudioEngine.js`
**Lines**: 152-155
**Severity**: **MEDIUM**
**Issue**: `seek(seconds)` calls `this.sound.seek(seconds)` without checking if the underlying Howl sound has finished loading. If the audio is still buffering (HTML5 streaming mode), `seek()` may silently fail or behave unpredictably. Howler.js internally queues seek operations, but no status is returned to the caller.
**Suggestion**: Check `this.sound.state()` before seeking, or queue the seek operation for after the `load` event if the sound is not yet ready.

---

**Category**: Logic Error
**File**: `src/core/audio/AudioEngine.js`
**Lines**: 158-163
**Severity**: **MEDIUM**
**Issue**: `getPosition()` returns `0` when the sound is paused (line 162). This means any UI that reads position during pause (e.g., to display the current scrub position or for seek bar rendering) will wrongly jump to zero. The correct behavior is to return `this.sound.seek()` regardless of playback state (Howl's `seek()` already returns the last-known position when paused).
**Suggestion**: Change the condition to `if (this.sound)` and remove the `.playing()` check. Howl.seek() with no arguments returns the current position even when paused.

---

**Category**: Design Pattern / Singleton Issues
**File**: `src/core/audio/AudioEngine.js`
**Lines**: 207
**Severity**: **MEDIUM**
**Issue**: Module-level `new AudioEngineImpl()` creates a singleton that persists across the entire app lifecycle. The constructor's state is shared globally, making it impossible to create isolated instances for testing or for multi-track scenarios. The `__tests__/AudioEngine.test.js` file confirms this pain point by directly mutating `AudioEngine.sound = null` (line 7 of test), bypassing all API methods.
**Suggestion**: Keep singleton for production but export the class `AudioEngineImpl` for testing. Add a static `getInstance()` factory method instead of eager instantiation.

---

**Category**: Error Handling
**File**: `src/core/audio/AudioEngine.js`
**Lines**: 82-101
**Severity**: **LOW**
**Issue**: `setEqualizerPreset` silently exits if `this.eqFilters.length !== 5` (line 84). No indication is given to the caller that the preset was not applied. This can happen if `_setupEqualizer` failed or was never called.
**Suggestion**: Log a warning and return early, or throw a descriptive error so the UI can react accordingly.

---

**Category**: TypeScript / JSDoc
**File**: `src/core/audio/AudioEngine.js`
**Lines**: 26, 72, 76, 152, 158, 167, 180, 207
**Severity**: **LOW**
**Issue**: Public methods `playTrack`, `setVolume`, `setPlaybackSpeed`, `seek`, `getPosition`, `updateMediaSession`, and `setMediaSessionHandlers` lack JSDoc annotations for their parameters and return types. This reduces IDE autocompletion quality and makes the API surface hard to navigate.
**Suggestion**: Add `@param` and `@returns` JSDoc tags to all public methods.

---

**Category**: Logic Error
**File**: `src/core/audio/AudioEngine.js`
**Lines**: 113-114
**Severity**: **MEDIUM**
**Issue**: Line 114 creates a new `AudioContext` if `Howler.ctx` is falsy (`this.eqContext = Howler.ctx || new (window.AudioContext || window.webkitAudioContext)()`). This can produce a *second* AudioContext in the browser. Most browsers limit the number of AudioContexts (Chrome allows ~6 before deprecation warnings; some mobile browsers allow far fewer). If Howler hasn't initialized its context yet (e.g., no user gesture has occurred), this creates an orphaned context that may be suspended.
**Suggestion**: Always use `Howler.ctx` as the single source of truth for the AudioContext. If it's null, throw an explanatory error that playback must be initiated by a user gesture. Never create a separate AudioContext.

---

### 2. `src/core/audio/VisualizerEngine.js` (100 lines)

**Category**: Resource Management
**File**: `src/core/audio/VisualizerEngine.js`
**Lines**: 29-30
**Severity**: **HIGH**
**Issue**: `Howler.masterGain.connect(this.analyser)` connects to Howler's master gain node but never disconnects. If `init()` is called multiple times (despite the guard at line 17), multiple analyser nodes could be connected to the master gain, each consuming CPU cycles. More critically, there is no `disconnect()` or `destroy()` method to clean up when the visualizer is no longer needed.
**Suggestion**: Add a `disconnect()` method that calls `this.analyser.disconnect()` and nullifies the reference. Call this in a teardown lifecycle hook (e.g., React `useEffect` cleanup). Make the `init()` guard more robust by checking `this.analyser` and disconnecting the old one before re-connecting.

---

**Category**: Error Handling / State Inconsistency
**File**: `src/core/audio/VisualizerEngine.js`
**Lines**: 16-34
**Severity**: **MEDIUM**
**Issue**: The `try` block at line 19 wraps lines 20-30, but `this.analyser` and `this.dataArray` are assigned *inside* the try block (lines 25-27). If `Howler.ctx.createAnalyser()` succeeds but `Howler.masterGain.connect()` throws (line 30), then `this.analyser` is left set to a valid analyser but it is not connected to the audio graph. Subsequent calls to `getFrequencyData()` will return all zeros (since no audio flows into the analyser), and `this.isSimulating` will remain `false`, so no simulated fallback is triggered.
**Suggestion**: Assign `this.analyser` and `this.dataArray` only after all connection steps succeed. Move the assignments after the `Howler.masterGain.connect()` call, or nullify them in the catch block.

---

**Category**: TypeScript / JSDoc
**File**: `src/core/audio/VisualizerEngine.js`
**Lines**: 16, 42
**Severity**: **LOW**
**Issue**: `init()` lacks a `@returns` JSDoc. `getFrequencyData()` has decent JSDoc but `_generateSimulatedData()` lacks documentation for its return value shape (Uint8Array of length 64, values 0-255).
**Suggestion**: Add `@returns {void}` and `@returns {Uint8Array}` annotations.

---

**Category**: Logic Error
**File**: `src/core/audio/VisualizerEngine.js`
**Lines**: 52-55
**Severity**: **LOW**
**Issue**: CORS detection checks only the first 5 frequency bins for non-zero activity. If the audio content genuinely has silence or very low energy in those bins (e.g., a classical piano piece with deep sub-bass notes), the check falsely triggers simulated data. Conversely, if `isPlaying` just transitioned to `true` but the audio buffer hasn't populated yet, real data is returned (all zeros) without triggering simulation because `isPlaying` is `true` but `sum === 0` causes simulation to kick in — this works correctly for that edge case.
**Suggestion**: Increase the check to 10-15 bins, and/or check if the buffer has any data by verifying the Howl sound's `seek()` > 0 before deciding the data is CORS-blocked.

---

**Category**: Performance
**File**: `src/core/audio/VisualizerEngine.js`
**Lines**: 68-97
**Severity**: **LOW**
**Issue**: `_generateSimulatedData()` allocates a new `Uint8Array(64)` on every call (line 70). If the visualizer renders at 60fps, this creates 60 allocations per second. Similarly, `getFrequencyData()` returns either the internal `this.dataArray` or a new simulated array, creating inconsistency in reference identity across frames.
**Suggestion**: Pre-allocate a reusable simulated data buffer in the constructor. Write into it in `_generateSimulatedData` and return it, so the caller can benefit from object stability for React `useMemo` / `useEffect` dependency checks.

---

### 3. `src/core/api/MusicService.js` (172 lines)

**Category**: Error Handling
**File**: `src/core/api/MusicService.js`
**Lines**: 119-129, 134-144
**Severity**: **HIGH**
**Issue**: `searchSongs()` (line 119) and `getTrackDetails()` (line 134) both `await this._fetch(...)` without any try/catch block. Since `_fetch` re-throws all errors (line 112), any network failure, CORS error, or API 5xx response results in an unhandled promise rejection that propagates to the caller. This forces every consumer of MusicService to wrap calls in try/catch, spreading error handling responsibility.
**Suggestion**: Add try/catch blocks in each public method. For `searchSongs`, return `[]` on error (graceful degradation). For `getTrackDetails`, re-throw with a meaningful message.

---

**Category**: Error Handling
**File**: `src/core/api/MusicService.js`
**Lines**: 99-113
**Severity**: **MEDIUM**
**Issue**: In `_fetch()`, line 106 checks `if (!data.success)` after parsing JSON. However, if the API returns a non-JSON response (e.g., HTML error page, gateway timeout), `await response.json()` may throw a `SyntaxError`. This is caught by the outer catch, but the error message is generic: `API Error: ${response.status}` from line 103 is never reached because the response was OK but the body isn't JSON. The user sees a confusing error.
**Suggestion**: Check the `Content-Type` header before parsing JSON. Alternatively, wrap the `response.json()` call in its own try and include the response status and partial body text in the error message.

---

**Category**: Logic Error
**File**: `src/core/api/MusicService.js`
**Line**: 106
**Severity**: **MEDIUM**
**Issue**: `if (!data.success)` will throw a `TypeError: Cannot read properties of null (reading 'success')` if the JSON response body is `null` (valid JSON primitive). While uncommon for JioSaavn's API, it's a brittle assumption.
**Suggestion**: Add a guard: `if (!data || typeof data !== 'object' || !data.success)`.

---

**Category**: API Design
**File**: `src/core/api/MusicService.js`
**Lines**: 152-154
**Severity**: **MEDIUM**
**Issue**: `getTrending()` is implemented as `this.searchSongs('top hits', 1, 15, ...)`. This is a search query, not an actual trending/charting endpoint. Results will vary based on JioSaavn's search algorithm and may not represent actual trending music. This is semantically misleading.
**Suggestion**: Investigate if the underlying API (saavn.dev) supports a dedicated trending or chart endpoint. If not, rename the method to `searchTopHits()` or document clearly that it's a search-based approximation.

---

**Category**: TypeScript / JSDoc
**File**: `src/core/api/MusicService.js`
**Lines**: 91-94, 119, 134, 152, 160
**Severity**: **LOW**
**Issue**: The `MusicServiceImpl` class and its public methods lack JSDoc annotations for parameters and return types. `searchSongs` has 5 parameters with only the first documented.
**Suggestion**: Add `@param` and `@returns` JSDoc to all public methods.

---

**Category**: API Design
**File**: `src/core/api/MusicService.js`
**Lines**: 68-88
**Severity**: **LOW**
**Issue**: `normalizeTrack()` accepts `raw` with no type validation. If `raw.primaryArtists` is not a string (e.g., `null` or an array), `.split()` would throw (line 70). The try/catch at line 69 catches it and returns `null`, silently dropping the track.
**Suggestion**: Add type guards for each field used: `String(raw.primaryArtists || '')`, `String(raw.primaryArtistsId || '')`, etc.

---

**Category**: Error Handling
**File**: `src/core/api/MusicService.js`
**Lines**: 160-169
**Severity**: **LOW**
**Issue**: `getLyrics()` catches all errors and returns `null`. However, the empty catch block at line 165 (`catch {`) swallows the error variable, making debugging harder. The log at line 166 uses `console.warn` but doesn't include the error object.
**Suggestion**: Change to `catch (error) { console.warn(... , error); }`.

---

### 4. `src/core/api/downloadService.js` (98 lines)

**Category**: Error Handling
**File**: `src/core/api/downloadService.js`
**Line**: 36
**Severity**: **HIGH**
**Issue**: `response.body.getReader()` is called without checking that `response.body` exists. The ReadableStream API (`response.body`) is supported in all modern browsers but may be `null` in certain edge cases or if a service worker strips the body. This would throw a `TypeError: Cannot read properties of null (reading 'getReader')`.
**Suggestion**: Add a guard: `if (!response.body) throw new Error('Streaming not supported for this response')`.

---

**Category**: Logic Error
**File**: `src/core/api/downloadService.js`
**Line**: 51
**Severity**: **MEDIUM**
**Issue**: Blob MIME type is hardcoded to `'audio/mp4'`. JioSaavn streams can be in various formats (MP3, AAC, M4A). The hardcoded MIME type may cause the downloaded file to have incorrect metadata or fail to play in some media players. Additionally, the filename extension is hardcoded to `.m4a` (line 54).
**Suggestion**: Detect the MIME type from the `Content-Type` response header: `response.headers.get('content-type')`. Derive the file extension dynamically (e.g., `'.mp3'` for `audio/mpeg`, `'.m4a'` for `audio/mp4`, etc.).

---

**Category**: Resource Management
**File**: `src/core/api/downloadService.js`
**Lines**: 91-94
**Severity**: **MEDIUM**
**Issue**: `URL.revokeObjectURL(url)` and DOM cleanup are scheduled with `setTimeout(fn, 100)`. The 100ms delay assumes the browser's download prompt fires synchronously after `click()`. On slower systems or with browser throttling (especially after a user gesture timeout), the blob URL may be revoked before the browser has started the download, resulting in a failed download with a "network error".
**Suggestion**: Use `requestAnimationFrame` or `setTimeout(fn, 0)` instead of 100ms. Even better, attach the `click()` call inside the same synchronous block and revoke on the next microtask via `queueMicrotask` or `Promise.resolve().then(revoke)`.

---

**Category**: Logic Error
**File**: `src/core/api/downloadService.js`
**Line**: 54
**Severity**: **MEDIUM**
**Issue**: `track.artistNames[0]` assumes at least one artist exists. If `normalizeTrack` produces an empty artist name (e.g., `raw.primaryArtists` is an empty string, resulting in `['']`), the filename becomes `"SongTitle - .m4a"`. If `artistNames` is somehow an empty array, `[0]` is `undefined`, and the filename becomes `"SongTitle - undefined.m4a"`.
**Suggestion**: Use `track.artistNames?.filter(Boolean)[0] || 'Unknown Artist'`.

---

**Category**: TypeScript / JSDoc
**File**: `src/core/api/downloadService.js`
**Lines**: 9, 78
**Severity**: **LOW**
**Issue**: `downloadTrack` and `_saveToDisk` lack JSDoc `@param` types. `_saveToDisk` has no JSDoc at all.
**Suggestion**: Add `@param {Blob} blob` and `@param {string} filename` to `_saveToDisk`, and `@param {Object} track` with shape description to `downloadTrack`.

---

### 5. `src/core/api/shareService.js` (92 lines)

**Category**: Logic Error
**File**: `src/core/api/shareService.js`
**Lines**: 63, 81
**Severity**: **HIGH**
**Issue**: `window.location.href` is used as the base URL for share links. If the user is on a deep-linked page (e.g., `moonplayer.app/#/settings`), the shared link will be `settings#/song/123` instead of the clean root `#/song/123`. More critically, if the app is accessed over `localhost`, the shared URL contains `localhost`, which is useless for recipients.
**Suggestion**: Define a canonical application URL constant (e.g., `'https://moonplayer.app'`) and construct share URLs against that instead of `window.location.href`.

---

**Category**: Error Handling
**File**: `src/core/api/shareService.js`
**Lines**: 11-26
**Severity**: **MEDIUM**
**Issue**: If Web Share API throws a non-AbortError, `_fallbackCopyToClipboard(url)` is called (line 24). If the clipboard fallback also fails, the user receives the "Failed to copy" toast (line 52) but the original Web Share error is only logged to console. The user has no way to know what the original error was.
**Suggestion**: Chain error messages: when both share and clipboard fail, show a combined error toast like "Sharing failed and clipboard also unavailable".

---

**Category**: Logic Error
**File**: `src/core/api/shareService.js`
**Line**: 36
**Severity**: **MEDIUM**
**Issue**: `if (navigator.clipboard)` checks for API existence but not for secure context availability. On HTTP pages, `navigator.clipboard` exists but `navigator.clipboard.writeText()` rejects with a `NotAllowedError`. The catch at line 50 handles this, but the user sees a generic "Failed to copy link" error with no explanation that HTTPS is required.
**Suggestion**: Check `navigator.clipboard?.writeText` and provide a contextual error message: "Clipboard access requires HTTPS. Link shown in console as fallback."

---

**Category**: Code Duplication
**File**: `src/core/api/shareService.js`
**Lines**: 60-73, 80-89
**Severity**: **LOW**
**Issue**: `shareTrack` and `sharePlaylist` both construct a share URL using `new URL(window.location.href)`, set the hash, and call `_handleShare`. This URL construction logic is duplicated.
**Suggestion**: Extract a private method `_buildShareUrl(hash)` that takes the hash fragment and returns the full URL.

---

**Category**: TypeScript / JSDoc
**File**: `src/core/api/shareService.js`
**Lines**: 7, 33, 60, 80
**Severity**: **LOW**
**Issue**: `_handleShare`, `_fallbackCopyToClipboard`, `shareTrack`, and `sharePlaylist` all lack `@param` and `@returns` JSDoc annotations.
**Suggestion**: Add comprehensive JSDoc annotations on all methods.

---

### 6. `src/core/updater/UpdateService.js` (38 lines)

**Category**: Logic Error — **CRITICAL**
**File**: `src/core/updater/UpdateService.js`
**Line**: 19
**Severity**: **HIGH** (Critical)
**Issue**: Version comparison `latestVersion !== CURRENT_VERSION` uses JavaScript string (`!==`) comparison, which is **lexicographic**, not semantic. A string comparison of `'v1.10.0' < 'v1.9.0'` is `true` because `'1' < '9'` at position 3. This means versions like `v1.10.0` will never be detected as newer than `v1.9.0`. Users would be stuck on the older version forever, never seeing update notifications for minor/major releases.
**Suggestion**: Use a semantic version comparison library (e.g., `semver` package via `semver.gt(latestVersion, CURRENT_VERSION)`) or implement a simple numeric comparison by stripping the `v` prefix, splitting on `.`, and comparing tuples component-wise.

---

**Category**: Logic Error
**File**: `src/core/updater/UpdateService.js`
**Line**: 4
**Severity**: **MEDIUM**
**Issue**: `CURRENT_VERSION = 'v1.0.0'` is hardcoded. The source file comment acknowledges it "Should ideally match package.json". In practice, this value will almost certainly drift from the actual app version during development, causing either false-positive update notifications (if hardcoded version is lower than package.json) or missed updates (if higher).
**Suggestion**: Import `version` from `package.json` or from a centralized `constants.js` module. Example: `import { version } from '../../package.json'` (with bundler support) or `import { APP_VERSION } from '../config'`.

---

**Category**: Error Handling
**File**: `src/core/updater/UpdateService.js`
**Line**: 15
**Severity**: **MEDIUM**
**Issue**: No validation of the GitHub API response shape. If the API changes, rate-limits the request, or returns an unexpected structure, `data.tag_name` could be `undefined`. The code uses `if (latestVersion && ...)` which guards against `undefined`, but `data.assets?.find(...)` could also fail if `data.assets` is not an array (e.g., a draft release with no assets).
**Suggestion**: Add response shape validation: `if (!data || typeof data.tag_name !== 'string') return { updateAvailable: false }`. Also check `Array.isArray(data.assets)` before calling `.find()`.

---

**Category**: Design Pattern Inconsistency
**File**: `src/core/updater/UpdateService.js`
**Line**: 6
**Severity**: **LOW**
**Issue**: `UpdateService` is an exported class with a static method, while all other services in `src/core/` use instantiated singletons (`export const service = new ServiceImpl()`). This inconsistency confuses consumers who must remember to import and call `UpdateService.checkForUpdates()` vs `MusicService.searchSongs()`.
**Suggestion**: Convert to the same singleton pattern: `class UpdateServiceImpl { ... }` and `export const updateService = new UpdateServiceImpl()`.

---

**Category**: TypeScript / JSDoc
**File**: `src/core/updater/UpdateService.js`
**Lines**: 6-7
**Severity**: **LOW**
**Issue**: The class and its only method lack JSDoc annotations. The return type `{ updateAvailable: boolean, version?: string, downloadUrl?: string, error?: string }` should be documented.
**Suggestion**: Add JSDoc with `@returns` describing the result object shape.

---

### 7. `src/core/db/schema.js` (25 lines)

**Category**: TypeScript / JSDoc
**File**: `src/core/db/schema.js`
**Lines**: 14-21
**Severity**: **LOW**
**Issue**: The schema definition is clean but the table purpose comments are terse. The `preferences` table (single row), `history` (limited to 20), and `lyrics` table relationships could benefit from documentation about expected row structure.
**Suggestion**: Add inline JSDoc or table definitions with `schema` property annotations for Dexie's type-aware operations.

**No other issues found.** Schema is well-structured with proper indices and unique constraints.

---

### 8. `src/core/utils/colorExtractor.js` (65 lines)

**Category**: Resource Management
**File**: `src/core/utils/colorExtractor.js`
**Lines**: 8-64
**Severity**: **MEDIUM**
**Issue**: The function creates an `Image` and sets `img.src` but provides no abort mechanism. If the component unmounts before the image loads, the callback (`resolve('rgb(26, 30, 37)')`) still fires, potentially triggering a React state update on an unmounted component. There is no `AbortController` or cleanup return value.
**Suggestion**: If using this in React, wrap with an `isCancelled` flag pattern. For a more modern approach, use `fetch(URL)` to download the image as a blob, create an `ObjectURL`, and use `AbortController` to cancel the fetch on unmount.

---

**Category**: Logic Error
**File**: `src/core/utils/colorExtractor.js`
**Lines**: 8-64
**Severity**: **LOW**
**Issue**: The Promise never rejects. All error paths resolve to a fallback color `'rgb(26, 30, 37)'`. This means callers cannot distinguish between a successfully extracted vibrant color and a fallback color. For UI purposes (e.g., gradient backgrounds), this may be acceptable, but it removes the ability to surface errors to the user or to attempt alternative color extraction methods.
**Suggestion**: Consider returning an object `{ color: string, isFallback: boolean }` so callers can adjust UI treatment (e.g., reduce saturation for fallback colors).

---

**Category**: Performance
**File**: `src/core/utils/colorExtractor.js`
**Lines**: 22-23
**Severity**: **LOW**
**Issue**: Canvas size is 50×50, which is 2500 pixels. The loop (lines 33-41) processes 10,000 array elements per pixel (4 channels × 2500). This is fast for a single call, but if `extractDominantColor` is called rapidly for multiple images (e.g., scrolling through a playlist), each image download is a network request and each canvas extraction is synchronous, potentially causing jank.
**Suggestion**: Consider debouncing or throttling calls, or use `requestIdleCallback` for the color averaging computation. Also consider caching results by image URL using a `Map<string, Promise<string>>`.

---

**Category**: Security
**File**: `src/core/utils/colorExtractor.js`
**Line**: 63
**Severity**: **LOW**
**Issue**: `img.src = imageUrl` sets the source to an arbitrary URL from the API. While images are sandboxed by the browser and cannot execute JavaScript, a `javascript:` URL assigned to `img.src` is silently ignored (no error, no execution), so this is safe. However, an extremely large image URL (e.g., 100MB) could consume bandwidth and memory.
**Suggestion**: This is acceptable for the intended use case. As an enhancement, validate that `imageUrl` starts with `https://` before setting `img.src`.

---

### 9. `src/core/utils/formatTime.js` (24 lines)

**No issues found.** The implementation is clean:
- Guards against `NaN`, `Infinity`, and negative values at line 8
- Properly pads seconds with `padStart(2, '0')`
- Handles both `M:SS` and `H:MM:SS` formats correctly
- No side effects, no external dependencies
- Has JSDoc with `@param` and `@returns`

**Suggestion**: Consider adding a `@param {number} totalSeconds` validation note that this function expects a finite number. Optionally rename `paddedSeconds` variable (line 16) to `sec` for consistency with `minutes`/`hours`.

---

### 10. `src/core/utils/debounce.js` (30 lines)

**No issues found.** The implementation is clean:
- Returns both a `debounced` function and a `cancel` function — good API design
- Properly clears the timer on each call and after execution
- Has JSDoc with `@param` and `@returns`
- Default delay of 300ms is reasonable

---

### 11. `src/core/audio/__tests__/AudioEngine.test.js` (45 lines)

**Category**: Test Design
**File**: `src/core/audio/__tests__/AudioEngine.test.js`
**Lines**: 7-9
**Severity**: **MEDIUM**
**Issue**: Tests directly mutate internal singleton state (`AudioEngine.sound = null`, `AudioEngine.currentPreset = 'Normal'`). This bypasses all API methods and makes the tests fragile — if a property is renamed on `AudioEngineImpl`, the tests silently continue (setting a new property that has no effect) or break. It also means tests don't exercise the public API's reset behavior.
**Suggestion**: Create a fresh `AudioEngineImpl` instance for each test, or add a `reset()` method to the class and call it in `beforeEach`. Export the class for testing.

---

**Category**: Test Coverage — **Critical Gap**
**File**: `src/core/audio/__tests__/AudioEngine.test.js`
**Lines**: 12-45
**Severity**: **HIGH**
**Issue**: The test suite covers only 4 basic scenarios (play, pause, seek, set preset). **No tests exist for:**
- Error conditions (invalid URL, network failure, CORS error)
- `onloaderror` / `onplayerror` propagation
- Progress callback functionality (`onProgressCallback`)
- `resume()` after pause
- `getPosition()` during play vs pause
- `setPlaybackSpeed()` boundary values
- `setVolume()` at extremes (0, 1, >1)
- Equalizer: actual filter creation and gain application
- `updateMediaSession()` with various track shapes
- `setMediaSessionHandlers()` with null/missing handlers
- Multiple rapid `playTrack()` calls (race condition)
- Cleanup — ensuring `_stopProgressLoop` is called on stop/end
- `seek()` before audio is loaded
- `_setupEqualizer()` with null sounds, Howler context missing

**Suggestion**: Expand test coverage to include error paths, edge cases, callbacks, and lifecycle methods. Aim for >80% coverage of AudioEngine.

---

**Category**: Test Design
**File**: `src/core/audio/__tests__/AudioEngine.test.js`
**Lines**: 21-29
**Severity**: **LOW**
**Issue**: The `pause` test mocks `Howl.prototype.playing` to return `true` (line 23) but does not restore the original in case of test failure. `playingSpy.mockRestore()` is called on line 29 after `expect`, which is correct for success paths, but if `expect` throws, the spy remains active, potentially affecting subsequent tests.
**Suggestion**: Use `afterEach` or `try/finally` to ensure all spies are restored. Alternatively, use `vi.spyOn(...).mockReturnValue(true)` within a `vi.mocked()` context.

---

## Cross-Cutting Issues

### 1. Singleton Inconsistency
- 7 of 8 services use `export const x = new XImpl()` pattern
- `UpdateService` uses `export class UpdateService` with static method
- **Suggestion**: Unify all services under the same pattern. Prefer `class ServiceImpl { ... }` + `export const service = new ServiceImpl()` for consistency.

### 2. Missing Destroy/Dispose Pattern
- `AudioEngine`: No cleanup method for AudioContext, equalizer filters, progress interval
- `VisualizerEngine`: No `disconnect()` for analyser node
- `MusicService`, `downloadService`, `shareService`: No cleanup for in-flight requests (no AbortController)
- **Suggestion**: Add a `destroy()` or `dispose()` method to every service class. In React consumers, call it in `useEffect` cleanup.

### 3. JSDoc Quality
- Only `formatTime.js`, `debounce.js`, `colorExtractor.js` have complete JSDoc
- All service classes lack `@param` and `@returns` on most public methods
- **Suggestion**: Add TypeScript or JSDoc annotations to all public API surfaces. Consider migrating to TypeScript.

### 4. Console-Only Error Reporting
- All error handling degrades to `console.error` / `console.warn` with no user-facing fallback
- No error reporting service integration (e.g., Sentry)
- **Suggestion**: Consider a centralized error handler that both logs and optionally surfaces errors to the user.

### 5. Hardcoded External URLs
- `MusicService.js:93` — `https://saavn.dev` (API base URL)
- `UpdateService.js:3` — GitHub API URL
- **Suggestion**: Centralize all external endpoint URLs in a single `src/core/config.js` or `.env` file.

---

## Risk Summary

| File | High | Medium | Low |
|------|------|--------|-----|
| AudioEngine.js | 3 | 4 | 2 |
| VisualizerEngine.js | 1 | 1 | 2 |
| MusicService.js | 1 | 3 | 3 |
| downloadService.js | 1 | 3 | 1 |
| shareService.js | 1 | 2 | 1 |
| UpdateService.js | 1 (critical) | 2 | 1 |
| schema.js | 0 | 0 | 1 |
| colorExtractor.js | 0 | 1 | 2 |
| formatTime.js | 0 | 0 | 0 |
| debounce.js | 0 | 0 | 0 |
| AudioEngine.test.js | 1 | 1 | 1 |
| **Total** | **9** | **17** | **14** |

**Priority remediation order:**
1. `UpdateService.js:19` — Lexicographic version comparison (critical bug: updates never detected for v1.10+)
2. `AudioEngine.js:103-105` — Private member access + `crossOrigin` timing bug
3. `downloadService.js:36` — Missing `response.body` null guard
4. `shareService.js:63` — `window.location.href` used for share URLs
5. `MusicService.js:119,134` — Unhandled promise rejections in public API
6. All `Medium` items — Progressively add destroy/dispose, error handlers, test coverage

---

*Analysis generated: comprehensive audit of 11 files across 10 categories.*
