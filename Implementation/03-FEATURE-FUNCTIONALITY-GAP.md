# Feature & Functionality Gap Analysis

**BloomeeTunes (Reference)** → **MoonPlayer (Our Codebase)**
Both use the JioSaavn API. BloomeeTunes is Flutter/Dart; MoonPlayer is React/TypeScript.

---

## 1. Chart System (P0)

### BloomeeTunes Implementation
- **`carousal_widget.dart`** (`lib/screens/screen/chart/`): `CaraouselWidget` uses `CarouselSlider.builder` with auto-play (2.5s interval), responsive sizing (viewport fractions 0.65 mobile / 0.40 tablet / 0.30 desktop), prefetches all chart details on load via `ChartBloc` -> `PrefetchAllChartDetails`.
- **`chart_widget.dart`** (`lib/screens/screen/chart/`): Individual chart card with gradient overlay (transparent -> 80% black), thumbnail, title, 16px border radius, placeholder icon fallback.
- **`chart_view.dart`** (`lib/screens/screen/chart/`, 1046 lines): Full `ChartScreen` with:
  - `_EditorialHeroMasthead`: Art background + `ImageFilter.blur(sigmaX: 70, sigmaY: 70)` + gradient fade, watermark rank number (260px mobile / 420px desktop, 6% opacity), responsive `_buildMobileLayout`/`_buildDesktopLayout`, stat chips (peak rank, weeks on chart, change indicator).
  - **Resolve state machine**: `ChartResolveActionStatus` enum (idle → resolving → success) with `_beginResolveAction()` (token-gated guard), `_resetResolveAction()`, `_completeResolveAction()` (1400ms hold). Action buttons show `CircularProgressIndicator` during resolving, checkmark on success.
  - **Cross-plugin resolution**: `ChartItemResolver` wraps `CrossPluginResolver` using `_resolver.resolve(chartItem, resolverPluginIds)`. Filters by priority list from settings. 65% confidence threshold (`_kResolverConfidenceThreshold`). Falls back to `_fallbackSearch()` on failure.
  - **ChartBloc**: Dispatches `LoadChartDetails`, `ForceRefreshChartDetails`. Chart provider plugin system (WASM-based).
  - `_ChartControlBarDelegate`: Pinned `SliverPersistentHeader` with chart title.

### MoonPlayer Status
- **Missing entirely**. No chart carousel on home, no ChartView, no editorial hero, no resolve state machine, no stat chips.
- Home page (`Home.jsx`) has `RecommendationCarousel` components but no chart section.
- `MusicService.js` has JioSaavn API integration that could provide chart/trending data (JioSaavn has `/search` and chart endpoints in their API).

### Implementation Guide

**Step 1: API layer — Fetch chart data**

File to create: `src/core/api/chartService.js`

```js
// chartService.js — wraps JioSaavn chart/trending endpoints
class ChartServiceImpl {
  async getCharts() { /* JioSaavn /modules?language=tamil,hindi… */ }
  async getChartDetails(chartId) { /* JioSaavn /chart/{id} */ }
  async prefetchChartDetails(chartIds) { /* parallel fetch */ }
}
export const chartService = new ChartServiceImpl();
```

Add to `MusicService.js` if preferred, but a dedicated module keeps concerns separate.

**Step 2: Zustand store for chart state**

File to create: `src/store/chartStore.js`

```js
import { create } from 'zustand';
import { chartService } from '../core/api/chartService';
export const useChartStore = create((set, get) => ({
  charts: [],
  activeChart: null,
  chartItems: [],
  chartsStatus: 'idle', // 'idle' | 'loading' | 'loaded' | 'error'
  chartDetailStatus: 'idle',
  resolveStates: {}, // { [actionKey]: 'idle' | 'resolving' | 'success' }
  actionTokens: {},
  
  loadCharts: async () => { /* … */ },
  loadChartDetails: async (pluginId, chartId) => { /* … */ },
  beginResolveAction: (actionKey) => { /* token-gated */ },
  completeResolveAction: (actionKey, token, holdMs) => { /* 1400ms hold */ },
  resetResolveAction: (actionKey, token) => { /* stale token guard */ },
}));
```

**Step 3: ChartCarousel component**

File to create: `src/components/common/ChartCarousel/ChartCarousel.jsx`
File to create: `src/components/common/ChartCarousel/ChartCarousel.css`

Structure:
```jsx
// ChartCarousel.jsx — uses carousel-slider library or native scroll snap
// Props: charts[] (Array<{id, title, thumbnail}>)
// Renders: CarouselSlider.builder with auto-play (2500ms)
// Each slide is a ChartCard with gradient overlay
// On tap -> navigates to /chart/:pluginId/:chartId
```

Use `react-responsive-carousel` or implement with CSS `scroll-snap-type: x mandatory`.

npm dependency: `react-responsive-carousel` (or `swiper` for mobile)

**Step 4: ChartCard component**

File to create: `src/components/common/ChartCarousel/ChartCard.jsx`

- Renders thumbnail with gradient (transparent → black 80%)
- Title at bottom, 2-line ellipsis
- 16px border radius

**Step 5: ChartView page**

File to create: `src/views/pages/ChartView.jsx`
File to create: `src/views/pages/ChartView.css`

Route: `/chart/:pluginId/:chartId?title=...`

Components:
- `EditorialHeroMasthead`: Blurred art background (`backdrop-filter: blur(70px)`), gradient fade, watermark rank "#1" (260px font, low opacity), responsive layout (centered column mobile, side-by-side desktop), stat chips (peak rank `#2`, weeks `8`, change `+3`).
- Action buttons: Play + Add to Playlist with resolve state machine (AnimatedSwitcher equivalent using framer-motion AnimatePresence: spinner → check → idle).
- Scrollable track list (chart items ranked 2+).
- `_resolveAndPlay` / `_resolveAndAdd` pattern: call `chartStore.beginResolveAction(key)`, resolve via chart API, play via `playerStore.loadPlaylist()`, then `completeResolveAction` with 1400ms hold.

**Step 6: Integrate into home page**

Modify `src/views/pages/Home.jsx`:
- Add `<ChartCarousel />` above RecommendationCarousels
- Import and call `chartStore.loadCharts()` alongside `recommendationService.getPersonalizedRecommendations()`

**Step 7: Add chart route**

Modify `src/App.jsx`:
```jsx
<Route path="/chart/:pluginId/:chartId" element={<Suspense><ChartView /></Suspense>} />
```

### Files to Create
- `src/core/api/chartService.js`
- `src/store/chartStore.js`
- `src/components/common/ChartCarousel/ChartCarousel.jsx`
- `src/components/common/ChartCarousel/ChartCarousel.css`
- `src/components/common/ChartCarousel/ChartCard.jsx`
- `src/views/pages/ChartView.jsx`
- `src/views/pages/ChartView.css`

### Files to Modify
- `src/App.jsx` (add route)
- `src/views/pages/Home.jsx` (render ChartCarousel)
- `src/store/playerStore.js` (may need resolve-play integration)

### Dependencies
- `react-responsive-carousel` or `swiper`

---

## 2. Album & Artist Detail Views (P0)

### BloomeeTunes Implementation
- **`album_view.dart`** (`lib/screens/screen/common_views/`, 665 lines): `AlbumView` with:
  - Blurred art background (`ImageFilter.blur(sigmaX: 70, sigmaY: 70)`)
  - Responsive header: mobile = centered column, desktop = side-by-side (art left, info right)
  - Track list with infinite scroll pagination (`ScrollController` + `_onScroll`)
  - Play all, save/like, share, external link actions
  - Hero tag for shared element transitions
  - Back navigation with styled back button
  - Uses `ContentBloc` to fetch `LoadAlbumDetails`
  - `_buildMobileLayout()` / `_buildDesktopLayout()` pattern
- **`artist_view.dart`** (`lib/screens/screen/common_views/`, 785 lines): Same pattern as AlbumView but for artists. Shows artist bio, top tracks, albums grid, similar artists.
- **`album_card.dart`** / **`artist_card.dart`**: Card widgets that navigate to the detail views.
- **`horizontal_card_view.dart`**: Horizontal scrolling card lists used for "Albums you might like" / "Similar Artists" sections.

### MoonPlayer Status
- **Missing entirely**. No `AlbumView`, no `ArtistView`. Routes `/album/:id` and `/artist/:id` don't exist.
- `PlaylistView.jsx` exists but is playlist-specific. No shared layout component for media detail pages.
- Track data models include `albumId`, `albumName`, `artistNames`, `artistIds` — enough data exists to build views.

### Implementation Guide

**Step 1: Album detail API**

Add to `src/core/api/MusicService.js` or create `src/core/api/contentService.js`:
```js
async getAlbumDetails(albumId) { /* JioSaavn /albums?id={albumId} */ }
async getArtistDetails(artistId) { /* JioSaavn /artists?id={artistId} */ }
async getArtistSongs(artistId, page, limit) { /* JioSaavn /artists/{id}/songs */ }
async getArtistAlbums(artistId, page, limit) { /* /artists/{id}/albums */ }
```

**Step 2: AlbumView page**

File to create: `src/views/pages/AlbumView.jsx`
File to create: `src/views/pages/AlbumView.css`

Route: `/album/:id`

```jsx
export function AlbumView() {
  // 1. Fetch album details from API using route param
  // 2. Extract dominant color from artwork for background
  // 3. Render EditorialHero-like header:
  //    - <div className="album-hero-bg"> with backdrop-filter: blur(70px)
  //    - Responsive layout: useBreakpoint() -> isDesktop
  //    - Artwork image, album title, artist name(s), year, track count
  //    - Action buttons: Play All, Save/Like, Share, External Link
  // 4. Track list with infinite scroll:
  //    - useInfiniteScroll hook or IntersectionObserver
  //    - Each track = TrackRow with play/like/download
  //    - ScrollController + IntersectionObserver for pagination
  // 5. "More from artist" carousel (horizontal card scroll)
}
```

Pattern for blurred background (CSS):
```css
.album-hero-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  filter: blur(70px);
  opacity: 0.3;
}
.album-hero-fade {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 0%, var(--bg-void) 85%);
}
```

**Step 3: ArtistView page**

File to create: `src/views/pages/ArtistView.jsx`
File to create: `src/views/pages/ArtistView.css`

Route: `/artist/:id`

```jsx
export function ArtistView() {
  // 1. Fetch artist details, top tracks, albums
  // 2. Header: artist image, name, followers, bio (if available)
  // 3. Top tracks section with TrackRow items
  // 4. Albums grid (CSS Grid, 2 cols mobile, 4 cols desktop)
  // 5. Similar artists horizontal scroll
  // 6. Play all / shuffle all actions
}
```

**Step 4: Infinite scroll hook**

File to create: `src/core/hooks/useInfiniteScroll.js` (if not existing)
```js
export function useInfiniteScroll(loadMore, hasMore) {
  // IntersectionObserver on sentinel element
  // Returns sentinelRef
}
```

**Step 5: Update routes**

Modify `src/App.jsx`:
```jsx
<Route path="/album/:id" element={<Suspense><AlbumView /></Suspense>} />
<Route path="/artist/:id" element={<Suspense><ArtistView /></Suspense>} />
```

**Step 6: Wire navigation from existing components**

- Modify `TrackCard` / `TrackRow` to link to `/album/:albumId`
- Modify artist name elements to link to `/artist/:artistId`

### Files to Create
- `src/views/pages/AlbumView.jsx`
- `src/views/pages/AlbumView.css`
- `src/views/pages/ArtistView.jsx`
- `src/views/pages/ArtistView.css`
- `src/core/hooks/useInfiniteScroll.js` (if not existing)

### Files to Modify
- `src/App.jsx` (add routes)
- `src/core/api/MusicService.js` (add album/artist detail methods)
- `src/components/common/TrackCard/TrackCard.jsx` (link to album/artist)
- `src/components/common/TrackRow/TrackRow.jsx` (link to album/artist)

### Dependencies
- None new.

---

## 3. Enhanced Fullscreen Lyrics (P1)

### BloomeeTunes Implementation
- **`fullscreen_lyrics_view.dart`** (`lib/screens/screen/player_views/`, 1019 lines):
  - **Immersive mode**: `SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky)` on init, restores on dispose.
  - **Auto-hiding controls**: `_showControls = true`, `_hideControlsTimer` (4 seconds, resets on interaction). `_toggleControls()` on tap. `_onInteraction()` to reset timer.
  - **Sync offset adjustment**: `_lyricOffset` (Duration), `_isSyncMode`, `_startOffsetChange(ms)` with `Timer.periodic(100ms)` for held adjustment, `_stopOffsetChange()`. Persisted offset loaded from `LyricsCubit` state.
  - **Auto-scrolling**: `scrollable_positioned_list` with `ItemScrollController`, `scrollTo(index, alignment: 0.5)` for current line.
  - **Seek on tap**: `_onInteraction()` + tap on line triggers seek.
  - **Background**: Track artwork + `ImageFilter.blur(sigmaX: 50, sigmaY: 50)` + 40% black overlay.
  - **Lyrics search**: `_openSettingsMenu()` -> `_LyricsSettingsBottomSheet` with sync mode toggle and lyrics search.
  - **Up Next panel**: `UpNextPanelController` for queue peek.

### MoonPlayer Status
- **`LyricsPanel.jsx`** (98 lines) exists with basic auto-scroll and seek-on-tap.
- **`FullscreenPlayer.jsx`** (410 lines) has a toggle between album art and lyrics but:
  - No immersive mode (controls always visible)
  - No auto-hiding controls (4s timer)
  - No sync offset adjustment
  - No built-in lyrics search
  - No toggle between lyrics and album art (has fragment toggle but not elegant)
  - No persistent offset saving

### Implementation Guide

**Step 1: Redesign FullscreenPlayer for immersive mode**

Modify `src/components/player/FullscreenPlayer/FullscreenPlayer.jsx`:
- Add `_showControls` state with `_hideControlsTimer` (4s auto-hide)
- Add `_onInteraction()` to show controls and reset timer on any user interaction
- Add `requestFullscreen()` / exit fullscreen for true immersive mode
- Hide all UI chrome when `_showControls === false` (only lyrics visible)
- Tap anywhere to toggle controls visibility

**Step 2: Sync offset adjustment**

Add to `FullscreenPlayer.jsx`:
```jsx
const [lyricOffset, setLyricOffset] = useState(0); // ms
const [isSyncMode, setIsSyncMode] = useState(false);
```
- Add sync mode button (visible in controls panel)
- In sync mode, show +100ms / -100ms adjustment buttons (with hold-repeat)
- Pass `lyricOffset` to `LyricsPanel` to adjust line timing
- Persist offset per track in `preferenceStore` or IndexedDB

**Step 3: Enhanced LyricsPanel**

Modify `src/components/player/LyricsPanel/LyricsPanel.jsx`:
- Accept `lyricOffset` prop for timing adjustment
- Add auto-scroll with `scrollIntoView({ behavior: 'smooth', block: 'center' })` (already partially exists)
- Add visual indicator for current line (already exists)
- Add seek-on-tap for each line (already exists)
- Add toggle between synced and plain lyrics view

**Step 4: Lyrics search within view**

Add to `FullscreenPlayer.jsx`:
- Search icon in controls panel
- Bottom sheet / inline search input that calls `lyricsService.searchLyrics()`
- Render search results and allow selection
- BloomeeTunes' pattern: `lyrics_search.dart` modal bottom sheet + sync offset mode

**Step 5: Toggle between lyrics and album art**

Already partially exists via `showLyrics` state but:
- Add animated transition between art and lyrics (framer-motion AnimatePresence) — already partially done
- Add a background option to show blurred art behind lyrics (currently solid black)
- BloomeeTunes uses artwork + 70px blur + 40% black overlay as lyrics background

### Files to Create
- None new (modify existing).

### Files to Modify
- `src/components/player/FullscreenPlayer/FullscreenPlayer.jsx` (major rework)
- `src/components/player/FullscreenPlayer/FullscreenPlayer.css`
- `src/components/player/LyricsPanel/LyricsPanel.jsx` (add offset, sync mode)
- `src/components/player/LyricsPanel/LyricsPanel.css`
- `src/store/preferenceStore.js` (add lyric offset persistence)

### Dependencies
- None new.

---

## 4. Equalizer with Real-time Band Control (P1)

### BloomeeTunes Implementation
- **`equalizer_view.dart`** (`lib/screens/screen/player_views/`, 769 lines):
  - 10-band interactive equalizer with `_InteractiveEQPainter` (CustomPainter)
  - **Interactive frequency response curve**: Drag on graph to adjust bands. `_handleGraphPanStart/Update/End` with band index detection. Paint with `Canvas.drawPath()` using Catmull-Rom spline.
  - **23 presets** (Flat, Acoustic, Bass Boost, Classical, Dance, EDM, Hip-Hop, Jazz, Metal, Pop, Rock, Vocal Booster, etc.)
  - **Preset matching**: `_matchingPreset()` — if user adjusts bands to match a preset, auto-selects it; otherwise shows "Custom".
  - **EQ source toggle**: Built-in (10-band in-app) vs Device (pass-through to system EQ like Dolby Atmos).
  - **Animation controller**: `_fadeCtrl` (500ms fade-in), `_curveCtrl` (600ms curve transition with `easeOutCubic`). `ui.lerpDouble()` for smooth gain animation between preset changes.
  - **Reactive subscriptions**: `equalizerEnabledStream`, `equalizerBandGainsStream` to stay in sync with engine state.
  - **Haptic feedback**: `HapticFeedback.lightImpact()` on preset apply, `HapticFeedback.mediumImpact()` on reset.
  - **Scroll lock**: `_isGraphInteractive` prevents ListView scroll when dragging on the EQ graph.

### MoonPlayer Status
- **5-band preset-only equalizer** in `AudioEngine.js` (`setEqualizerPreset()`). Presets: Normal, Bass Boost, Vocal, Treble, Rock, Pop.
- **No interactive band sliders**. No frequency response graph. No custom presets.
- `Settings.jsx` renders preset buttons but no visual curve.

### Implementation Guide

**Step 1: Extend AudioEngine for per-band gain control**

Modify `src/core/audio/AudioEngine.js`:
- Add method `setEqualizerBandGain(index, gain, immediate)` for individual band control
- Add method `setEqualizerBandGains(gains, immediate)` for bulk update
- Add method `setEqualizerEnabled(enabled)` to toggle EQ on/off
- Expose `getEqualizerBands()` returning `[{ centerFrequency, gain, type }]`
- Keep the 5 existing bands (60, 230, 910, 3600, 14000 Hz) but add individual control
- Add `equalizerBandGainsStream` (EventTarget/EventEmitter pattern) for reactive updates

**Step 2: Create EqualizerView page**

File to create: `src/views/pages/EqualizerView.jsx`
File to create: `src/views/pages/EqualizerView.css`

Route: `/equalizer` (accessible from Settings and FullscreenPlayer)

```jsx
export function EqualizerView() {
  // State: bands[], selectedPreset, isEnabled, eqSource
  // Preset tabs: horizontal scroll with 23 presets
  // Interactive frequency response curve:
  //   - Canvas element with custom drawing
  //   - Mouse/touch drag to adjust individual bands
  //   - Catmull-Rom spline connecting band points
  //   - Gradient fill under curve
  //   - Frequency labels below each band
  // EQ source toggle: Built-in / Device
  // Enable/disable switch
  // Reset button
}
```

**Step 3: Interactive curve painter**

In `EqualizerView.jsx`, use a `<canvas>` element with React ref:

```jsx
const canvasRef = useRef(null);
const [draggingBand, setDraggingBand] = useState(null);

useEffect(() => {
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  // Draw frequency response curve:
  // 1. Draw zero line
  // 2. Plot band points (x = proportional to index, y = mapped from gain)
  // 3. Draw Catmull-Rom spline connecting points
  // 4. Fill gradient under curve
  // 5. Draw draggable circles at each band
}, [bands, draggingBand]);

const handleCanvasMouseDown = (e) => {
  // Detect nearest band to click point
  // Set draggingBand index
};

const handleCanvasMouseMove = (e) => {
  // If draggingBand != null, update gain based on Y position
  // Call AudioEngine.setEqualizerBandGain(index, newGain)
};

const handleCanvasMouseUp = () => {
  setDraggingBand(null);
};
```

**Step 4: Preset system**

Extend presets to all 23 from BloomeeTunes:
```js
const PRESETS = {
  'Flat': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Acoustic': [3, 2, 1, 0, 0, 0, 1, 2, 2, 3],
  'Bass Boost': [6, 5, 4, 2, 0, 0, 0, 0, 0, 0],
  // ... all 23
};
```
But since MoonPlayer has 5 bands, reduce to 5-band mapping or extend to 10 bands.

**Step 5: Save custom presets**

- After user modifies bands that don't match any preset, show "Save as custom preset" button
- Store custom presets in `preferenceStore`

### Files to Create
- `src/views/pages/EqualizerView.jsx`
- `src/views/pages/EqualizerView.css`

### Files to Modify
- `src/core/audio/AudioEngine.js` (extend for per-band control)
- `src/views/pages/Settings.jsx` (add link to EqualizerView)
- `src/store/preferenceStore.js` (add custom presets, eqSource, eqEnabled)

### Dependencies
- None new.

---

## 5. Download Manager with Queue (P1)

### BloomeeTunes Implementation
- **`downloader_cubit.dart`** (`lib/blocs/downloader/cubit/`, 503 lines): Full download state machine with:
  - `DownloaderState`: `downloads` (active) and `downloaded` (persisted) lists
  - `DownloaderTasksUpdated` state — emitted on any progress change
  - `DownloadProgress`: links `DownloadTask` to live `DownloadStatus`
  - States: queued, resolving, downloading, paused, retrying, writingMetadata, completedPendingAck, failed, cancelled
  - Methods: `downloadSong()`, `pauseDownload()`, `resumeDownload()`, `cancelDownload()`, `removeDownload()`, `isDownloaded()`, `getDownloadInfo()`
  - `RustDownloadService` for actual download (via FFI to Rust)
  - `DownloadRepository` for persisting downloads to database
  - `_loadDownloadedSongs()` / `_emitUpdatedState()`
  - Initial load completion signal via `CancelableCompleter`
- **`downloader_state.dart`** (`lib/blocs/downloader/cubit/`, 48 lines): State classes
- **`downloading_item.dart`** (`lib/screens/widgets/`, 356 lines): `DownloadingCardWidget` — card with cover art, progress circle, status text, pause/resume/cancel buttons, percentage display
- **`rust_download_service.dart`** (`lib/services/download/`, Rust bridge for actual file download)

### MoonPlayer Status
- **`downloadService.js`** (`src/core/api/downloadService.js`, 120 lines): Single-track download via `fetch` + `blob` + `URL.createObjectURL()`. No queue, no progress tracking beyond a toast message, no pause/resume/cancel, no download list.
- **`DownloadButton.jsx`** (`src/components/common/DownloadButton/`, 28 lines): Simple button, calls `downloadService.downloadTrack()`.
- **No download queue**, no progress indicators per track, no pause/resume, no offline badge on downloaded tracks.

### Implementation Guide

**Step 1: Create download store**

File to create: `src/store/downloadStore.js`

```js
import { create } from 'zustand';
import { db } from '../core/db/schema'; // Dexie

// States: 'queued' | 'resolving' | 'downloading' | 'paused' | 'failed' | 'cancelled' | 'completed'

export const useDownloadStore = create((set, get) => ({
  activeDownloads: [], // Array<{ taskId, track, progress, status, message }>
  downloadedTrackIds: new Set(),
  
  enqueueDownload: async (track) => {
    /* add to queue, process sequentially or with concurrency limit */
  },
  pauseDownload: (taskId) => { /* mark as paused */ },
  resumeDownload: (taskId) => { /* re-queue */ },
  cancelDownload: (taskId) => { /* remove from queue */ },
  removeDownload: (trackId) => { /* remove from DB */ },
  isDownloaded: (trackId) => { /* check downloadedTrackIds */ },
  
  _processQueue: async () => {
    /* process next queued item, update progress */
  },
}));
```

**Step 2: Download queue manager**

Implement queue processing in `downloadStore`:
- Max 3 concurrent downloads (configurable)
- Sequential per-task lifecycle: resolving → downloading → completed
- Use `fetch` with `ReadableStream` for progress (existing pattern)
- Track each task with unique `taskId` (crypto.randomUUID())
- Store completed downloads in Dexie (`db.downloads` table)

**Step 3: Process downloads queue**

```js
_processQueue: async () => {
  const { activeDownloads } = get();
  const active = activeDownloads.filter(d => d.status === 'downloading').length;
  const maxConcurrent = 3;
  const queued = activeDownloads.filter(d => d.status === 'queued' && !d._started);
  
  if (active >= maxConcurrent || queued.length === 0) return;
  
  const batch = queued.slice(0, maxConcurrent - active);
  for (const task of batch) {
    get()._startDownload(task);
  }
},
```

**Step 4: Download progress indicator component**

File to create: `src/components/common/DownloadProgress/DownloadProgress.jsx`
File to create: `src/components/common/DownloadProgress/DownloadProgress.css`

```jsx
export function DownloadProgress({ task }) {
  // Shows: cover art (small), track title, artist
  // Circular progress indicator (SVG circle)
  // Status text: "Downloading 45%", "Paused", "Failed – Retry"
  // Action buttons: pause/resume (toggle), cancel (X)
  // Match BloomeeTunes' DownloadingCardWidget pattern
}
```

**Step 5: Download queue panel**

File to create: `src/components/common/DownloadQueuePanel/DownloadQueuePanel.jsx`

- Lists all active downloads with `DownloadProgress` components
- Accessible from Library or sidebar
- Shows total progress summary

**Step 6: Offline badge integration**

Modify `TrackRow.jsx` and `TrackCard.jsx`:
- Check `useDownloadStore.isDownloaded(track.id)`
- Show offline/downloaded badge (check icon, "Downloaded" label)

### Files to Create
- `src/store/downloadStore.js`
- `src/components/common/DownloadProgress/DownloadProgress.jsx`
- `src/components/common/DownloadProgress/DownloadProgress.css`
- `src/components/common/DownloadQueuePanel/DownloadQueuePanel.jsx`
- `src/components/common/DownloadQueuePanel/DownloadQueuePanel.css`

### Files to Modify
- `src/core/db/schema.js` (add `downloads` table)
- `src/components/common/TrackCard/TrackCard.jsx` (offline badge)
- `src/components/common/TrackRow/TrackRow.jsx` (offline badge)
- `src/views/pages/Library.jsx` (add download queue section)
- `src/core/api/downloadService.js` (refactor to use store)

### Dependencies
- None new.

---

## 6. Sleep Timer with UI (P2)

### BloomeeTunes Implementation
- **`timer_view.dart`** (`lib/screens/screen/home_views/`, 423 lines): Full `TimerView` with:
  - Number pickers for hours (0-23), minutes (0-59), seconds (0-59)
  - Start / Stop buttons
  - Visual countdown showing H:MM:SS
  - Timer states via `TimerBloc`: `TimerInitial` → `TimerRunInProgress` → `TimerRunComplete`
  - Messages: "Interlude" message during countdown, "Timer finished!" on completion
- **`timer_bloc.dart`, `timer_event.dart`, `timer_state.dart`** (`lib/blocs/timer/`): BLoC pattern for timer state machine

### MoonPlayer Status
- **Minimal**: `playerStore.js` has `setSleepTimer(minutes)` with simple `setInterval` countdown. On expiry, pauses playback.
- **No dedicated UI component**: Settings button in `FullscreenPlayer.jsx` options drawer shows preset options (15m, 30m, 45m, 60m).
- **No visual countdown timer display** in player UI.
- **`SleepTimerStatus`** component in `FullscreenPlayer.jsx` shows a small badge with "Zzz in M:SS" — exists but minimal.

### Implementation Guide

**Step 1: Create TimerView component**

File to create: `src/components/player/SleepTimer/SleepTimerView.jsx`
File to create: `src/components/player/SleepTimer/SleepTimerView.css`

```jsx
export function SleepTimerView({ onClose }) {
  // Three number pickers: hours (0-23), minutes (0-59), seconds (0-59)
  // Start button
  // When timer is running: show countdown display (H:MM:SS)
  // Stop button to cancel
  // End-of-track option checkbox (instead of hard stop)
  // Use framer-motion for animations
}
```

**Step 2: Extend playerStore for timer state**

Modify `src/store/playerStore.js`:
- Add `sleepTimerDuration` (total seconds set)
- Add `sleepTimerRemaining` (updated every second)
- Add `sleepTimerMode`: 'time' | 'endOfTrack'
- Add `setSleepTimerDuration(hours, mins, secs)`
- Add `updateSleepTimerRemaining()`
- Add `clearSleepTimer()`

**Step 3: Smart end-of-track option**

In `playerStore.js`, modify sleep timer check:
- If mode is 'endOfTrack', pause after current track finishes (in `next()` method, check flag)
- If mode is 'time', use existing countdown approach

**Step 4: Integrate into FullscreenPlayer**

Modify `src/components/player/FullscreenPlayer/FullscreenPlayer.jsx`:
- Replace the simple sleep timer button group with a "Set Timer" button that opens `SleepTimerView`
- Show visual countdown in header when timer is active

### Files to Create
- `src/components/player/SleepTimer/SleepTimerView.jsx`
- `src/components/player/SleepTimer/SleepTimerView.css`

### Files to Modify
- `src/store/playerStore.js` (extend timer state)
- `src/components/player/FullscreenPlayer/FullscreenPlayer.jsx` (integrate)

### Dependencies
- None new.

---

## 7. Changelog / What's New (P2)

### BloomeeTunes Implementation
- **`changelog_reader.dart`** (`lib/screens/screen/common_views/`, 474+ lines): `ChangelogScreen` with:
  - Parses changelog text into structured `Version` objects (version number, date, features list)
  - `parseChangelog()`: Splits markdown-style changelog into versions + features
  - Shows version badges (CURRENT, LATEST, UNRELEASED)
  - Persists last-read version in settings (`SettingKeys.readChangelogs`)
  - Auto-shows on app update via `GlobalEventListener`
  - `GlobalEventsCubit` emits `WhatIsNewState` with changelog text
- **`bloomee_updater_tools.dart`**: Fetches changelog from GitHub raw URL, attaches to update data

### MoonPlayer Status
- **Missing entirely**. No changelog component, no update detection, no "What's New" display.
- `Settings.jsx` shows static "Version 0.0.1" text only.

### Implementation Guide

**Step 1: Create Changelog data**

File to create: `src/constants/changelog.js`
```js
export const CHANGELOG = [
  {
    version: '0.1.0',
    date: '2025-06-01',
    features: [
      'Charts system with editorial hero',
      'Album & Artist detail pages',
      'Enhanced fullscreen lyrics with sync offset',
      'Interactive equalizer with visual curve',
      'Download manager with queue',
    ],
  },
  // ... more versions
];
```

**Step 2: Create ChangelogReader component**

File to create: `src/components/common/ChangelogReader/ChangelogReader.jsx`
File to create: `src/components/common/ChangelogReader/ChangelogReader.css`

```jsx
export function ChangelogReader({ changelog, currentVersion, onClose }) {
  // Render version list with badges
  // Highlight current version
  // Show "What's New" banner for unread changes
}
```

**Step 3: Persist last-seen version**

Modify `src/store/preferenceStore.js`:
- Add `lastSeenVersion` preference
- After app mount, check if `lastSeenVersion !== currentVersion`
- If newer, show ChangelogReader modal
- Update `lastSeenVersion` on close

**Step 4: What's New modal on update**

Modify `src/App.jsx` or create a bootstrap component:
- On mount, compare stored `lastSeenVersion` with `APP_VERSION`
- If different, show `<ChangelogReader>` as a modal overlay
- Reference BloomeeTunes' `GlobalEventListener` pattern (`global_event_listener.dart` listens for update events)

### Files to Create
- `src/constants/changelog.js`
- `src/components/common/ChangelogReader/ChangelogReader.jsx`
- `src/components/common/ChangelogReader/ChangelogReader.css`

### Files to Modify
- `src/store/preferenceStore.js` (add `lastSeenVersion`)
- `src/App.jsx` (show changelog on version change)

### Dependencies
- None new.

---

## 8. Import/Export Playlists (P2)

### BloomeeTunes Implementation
- **`import_export_service.dart`** (`lib/services/`, 658 lines):
  - `_playlistDao` for DB access
  - `_trackDBToMap()` / `_trackFromMap()`: Serialize/deserialize tracks to/from JSON
  - `exportPlaylistAsJson()` / `importPlaylistFromJson()`: Full playlist export/import
  - `exportAllPlaylistsAsJson()`: Batch export
  - `exportToM3U()`: Export playlist as M3U file
  - Handles legacy `MediaItemDB` backward compatibility
  - Uses `file_picker` and `share_plus` for file operations
- **`m3u_processor.dart`** (`lib/services/`): M3U parsing/writing
- **`ImportMediaView`** / **`ImportProcessScreen`**: UI screens for import flow

### MoonPlayer Status
- **Missing entirely**. No import/export functionality.
- Library data stored in Dexie (IndexedDB) — can be serialized as JSON.
- Playlists are CRUD via `libraryStore.js`.

### Implementation Guide

**Step 1: Create import/export service**

File to create: `src/core/api/importExportService.js`

```js
class ImportExportServiceImpl {
  async exportPlaylistAsJson(playlist) {
    // Serialize playlist + tracks to JSON
    // Trigger file download
  }
  
  async exportAllPlaylistsAsJson() {
    // Export all playlists from libraryStore
  }
  
  async importPlaylistFromJson(file) {
    // Parse JSON file
    // Create playlist in libraryStore
  }
  
  async exportToM3U(playlist) {
    // Generate M3U format: #EXTINF:, track URL
    // Download file
  }
  
  async importFromM3U(file) {
    // Parse M3U file
    // Create playlist
  }
}
```

**Step 2: Create import/export UI**

File to create: `src/views/pages/ImportExportView.jsx`
File to create: `src/views/pages/ImportExportView.css`

- Accessible from Library or Settings
- "Export Library" button -> downloads JSON
- "Import Playlist" button -> file picker -> parse
- "Export as M3U" for individual playlists
- Progress indication during import

**Step 3: Add to Library page**

Modify `src/views/pages/Library.jsx`:
- Add import/export buttons in a "More" section or context menu
- Or add to Settings page under a "Data" section

### Files to Create
- `src/core/api/importExportService.js`
- `src/views/pages/ImportExportView.jsx`
- `src/views/pages/ImportExportView.css`

### Files to Modify
- `src/views/pages/Library.jsx` (add UI entry points)
- `src/store/libraryStore.js` (add batch operations)

### Dependencies
- None (uses native `<input type="file">` and `<a download>`)

---

## 9. Backup & Restore (P2)

### BloomeeTunes Implementation
- **`storage_backup_service.dart`** (`lib/services/`, 125 lines):
  - `createBackup()`: Isar snapshot
  - `createJsonBackup()`: Legacy JSON backup
  - `restoreBackup(path, options)`: Detects payload type (Isar snapshot, legacy JSON, playlist/track JSON, unsupported)
  - `detectPayloadType()`: File extension + content inspection
  - `RestoreBackupOptions`: Granular restore (media items, search history, settings)
  - `resetAppData()`: Full reset

### MoonPlayer Status
- **Missing entirely**.
- `preferenceStore.js` persists to Dexie but no export/import of full app state.

### Implementation Guide

**Step 1: Create backup service**

File to create: `src/core/api/backupService.js`

```js
class BackupServiceImpl {
  async exportBackup() {
    // Collect: preferences, playlists, liked songs, recently played, download history
    // Serialize as JSON
    // Download as .moonplayer-backup file
  }
  
  async importBackup(file) {
    // Parse JSON
    // Validate format
    // Restore: preferences -> preferenceStore
    // Restore: playlists -> libraryStore
    // Restore: liked songs -> libraryStore
    // Restore: recently played -> libraryStore
  }
}
```

**Step 2: Structure backup JSON**
```json
{
  "version": 1,
  "appVersion": "0.1.0",
  "exportedAt": "2025-06-01T12:00:00Z",
  "preferences": { /* all preferenceStore values */ },
  "playlists": [ /* serialized playlists with tracks */ ],
  "likedSongs": [ /* track ids */ ],
  "recentlyPlayed": [ /* track ids with timestamps */ ]
}
```

**Step 3: Add UI entry point**

- Settings page "Backup & Restore" section
- Export button -> downloads backup file
- Import button -> file picker -> restore with confirmation dialog

### Files to Create
- `src/core/api/backupService.js`

### Files to Modify
- `src/views/pages/Settings.jsx` (add Backup/Restore section)
- `src/store/preferenceStore.js` (add batch import method)
- `src/store/libraryStore.js` (add batch import/export methods)

### Dependencies
- None new.

---

## 10. Enhanced Recommendations (P1)

### BloomeeTunes Implementation
- **Plugin-based home sections**: Each plugin provides various content sections via `ContentProvider` plugin type
- **`explore_screen.dart`**: Dynamic grid of sections with horizontal scrolling cards
- **`horizontal_card_view.dart`**: Reusable horizontal card carousel (album cards, artist cards)
- **Charts as recommendations**: Trending section pulled from chart providers
- **Genre/mood sections**: From plugin data — "Party", "Chill", "Focus", "Workout", etc.
- **Artist radio**: Generated playlists based on artist (via plugin `getMix`)
- **New releases**: From plugin data

### MoonPlayer Status
- **`recommendationService.js`** (`src/core/audio/`, 103 lines): Basic recommendations via:
  - `getPersonalizedRecommendations()`: Carousels from search (trending via `MusicService.searchSongs('trending')` + recent artists)
  - Artist-based carousels ("Because you listened to X")
  - No charts-based trending
  - No genre/mood sections
  - No new releases section
  - No artist radio / similar artists

### Implementation Guide

**Step 1: Enhance recommendationService**

Modify `src/core/audio/recommendationService.js`:

```js
export const recommendationService = {
  async getPersonalizedRecommendations() {
    // Existing: trending + artist-based
    // Add:
    // 1. Charts-based trending (from chartService.getCharts())
    // 2. New releases (from MusicService new releases endpoint)
    // 3. Genre/mood sections:
    //    - "Party Mix" (search party + dance)
    //    - "Chill Vibes" (search chill + lofi)
    //    - "Focus" (search focus + instrumental)
    //    - "Workout" (search workout + energy)
    //    - "Romantic" (search romantic + love)
    // 4. Return structured carousels array
  },
  
  async getArtistRadio(artistId, artistName) {
    // Search for songs by similar artists
    // Use MusicService.searchSongs(artistName + ' mix')
  },
  
  async getSimilarArtists(artistId) {
    // Use JioSaavn artist similar endpoint if available
    // Fallback: search by genre matches
  },
};
```

**Step 2: Add chart-based trending section**

- Use `chartService.getCharts()` to get top charts
- Render as "Trending Now" or "Top Charts" carousel
- Each card links to the chart detail view

**Step 3: Add genre/mood sections**

```js
const MOODS = [
  { query: 'chill lofi', title: 'Chill Vibes', emoji: '' },
  { query: 'party dance', title: 'Party Mix', emoji: '' },
  { query: 'focus instrumental', title: 'Focus', emoji: '' },
  { query: 'workout energy', title: 'Workout', emoji: '' },
  { query: 'romantic love', title: 'Romantic', emoji: '' },
  { query: 'retro throwback', title: 'Throwback', emoji: '' },
];

// For each mood, search and create a carousel
```

**Step 4: Add "New Releases" section**

```js
async getNewReleases() {
  // JioSaavn /albums?year=2025 or /search?q=new+releases
  // Return limited to 20 tracks
}
```

### Files to Create
- None new (modify existing).

### Files to Modify
- `src/core/audio/recommendationService.js` (major expansion)

### Dependencies
- None new.

---

## 11. Local Music Support (P2)

### BloomeeTunes Implementation
- **`local_music_service.dart`** (`lib/services/`): Scans device for audio files, indexes metadata:
  - Platform-specific directory scanning (Android: `/Music`, iOS: via picker)
  - Uses `audio_service` / `just_audio` for local file playback
  - Caches scan results in Isar DB
  - Auto-rescan on app startup with debounce
  - File watcher for new files
- **`local_music_screen.dart`** (`lib/screens/screen/`, 773 lines): Full screen with:
  - Track list with search/filter
  - Play / add-to-playlist / share actions
  - Source label (folder path)
  - Empty state for no local files
- **`local_music_cubit.dart`** (`lib/blocs/local_music/`): State management for local tracks

### MoonPlayer Status
- **Missing entirely**. No local file scanning, no local music screen.
- PWA context — limited file system access via File System Access API.

### Implementation Guide

**Step 1: Create LocalMusicService**

File to create: `src/core/api/localMusicService.js`

```js
class LocalMusicServiceImpl {
  async scanLocalFiles() {
    // Use File System Access API (showDirectoryPicker)
    // Or use file input for directory selection
    // Walk directory tree for audio files (.mp3, .m4a, .ogg, .wav, .flac)
    // Parse ID3 tags if possible (via jsmediatags or similar)
    // Return array of Track-like objects
  }
  
  async readAudioFile(fileHandle) {
    // Return track metadata: title, artist, album, duration, cover art
  }
}
```

**Step 2: Create local music store**

File to create: `src/store/localMusicStore.js`

```js
import { create } from 'zustand';
import { localMusicService } from '../core/api/localMusicService';
import { db } from '../core/db/schema';

export const useLocalMusicStore = create((set, get) => ({
  localTracks: [],
  isScanning: false,
  scanProgress: 0,
  
  startScan: async () => { /* scan, update progress, store in DB */ },
  getLocalTracks: () => { /* query from DB */ },
  removeLocalTrack: (id) => { /* remove from DB */ },
}));
```

**Step 3: Create LocalMusicScreen**

File to create: `src/views/pages/LocalMusicView.jsx`
File to create: `src/views/pages/LocalMusicView.css`

- Shows scanned local tracks
- Search/filter bar
- Play action (play via AudioEngine with local file URL)
- Scan button with progress

**Step 4: Add to Library**

Modify `src/views/pages/Library.jsx`:
- Add "Local Music" tab or section

### Files to Create
- `src/core/api/localMusicService.js`
- `src/store/localMusicStore.js`
- `src/views/pages/LocalMusicView.jsx`
- `src/views/pages/LocalMusicView.css`

### Files to Modify
- `src/views/pages/Library.jsx` (add local music section)
- `src/core/audio/AudioEngine.js` (support local file URLs in addition to stream URLs)

### Dependencies
- `jsmediatags` (for ID3 tag parsing) — optional, nice-to-have

---

## 12. Discord Rich Presence (P2)

### BloomeeTunes Implementation
- **`discord_service.dart`** (`lib/services/`, 63 lines):
  - `initialize()`: Creates `DiscordRPC` with application ID `1339113296405725235`
  - `updatePresence(track, isPlaying)`: Sets details (track title), state ("Playing • Artist" or "Paused • Artist"), large image, start timestamp
  - `clearPresence()`: Clears on stop
  - Uses `dart_discord_rpc` package
  - Only active on Windows/Linux/macOS

### MoonPlayer Status
- **Missing entirely**. No Discord integration.
- MoonPlayer runs as a PWA (browser-based). Discord RPC requires a desktop app.

### Implementation Guide

**Step 1: Create DiscordService**

File to create: `src/core/api/discordService.js`

```js
class DiscordServiceImpl {
  constructor() {
    this.clientId = null;
    this.startTimestamp = null;
    this.isInitialized = false;
  }
  
  initialize(clientId = 'YOUR_DISCORD_APP_ID') {
    // Discord RPC only works in Electron/Tauri/Browser extensions
    // For PWA: No standard Discord RPC from browser context
    // Alternative: Create a helper for Electron/Tauri builds
    
    this.clientId = clientId;
    // In Electron, use 'discord-rpc' npm package
    // In PWA: Skip initialization (or show feature-unavailable message)
  }
  
  async updatePresence(track, isPlaying) {
    if (!this.isInitialized || !this.rpc) return;
    // Set activity: details=track.title, state="Playing • Artist"
  }
  
  clearPresence() {
    // Clear activity
  }
}
```

**Step 2: Integration point — Electron/Tauri only**

In `src/App.jsx` or a bootstrap module:
```js
// Only attempt in Electron/Tauri context
if (window.electronAPI?.platform) {
  discordService.initialize(DISCORD_CLIENT_ID);
}
```

**Step 3: Wire to player events**

Modify `src/store/playerStore.js`:
- On track change / play/pause → call `discordService.updatePresence()`
- On stop → call `discordService.clearPresence()`
- Throttle updates to 1-second intervals (use `throttle` utility)

### Files to Create
- `src/core/api/discordService.js`

### Files to Modify
- `src/store/playerStore.js` (add Discord integration callbacks)
- `src/App.jsx` (initialize Discord on supported platforms)

### Dependencies
- For Electron: `discord-rpc` (npm)

---

## 13. Smart Track Replacement (P1)

### BloomeeTunes Implementation
- **`smart_track_replacement_service.dart`** (`lib/services/meta_resolver/`, 200+ lines):
  - `SmartTrackReplacementService`: Full candidate search + replacement logic
  - `searchCandidates(chartItem)`: Searches across all loaded plugins for replacement candidates
  - `findBestReplacement(chartItem)`: Ranks candidates by confidence score
  - `applyReplacement({ sourceItem, targetItem, playlist })`: Replaces failed track in playlist queue
  - Uses `CrossPluginResolver` to query all loaded content resolvers
  - Configurable confidence threshold (used alongside `ChartItemResolver`)
- **`chart_item_resolver.dart`** (`lib/services/meta_resolver/`):
  - `resolve(chartItem, resolverIds)`: Cross-plugin resolution with confidence scoring
  - `isStrongTrackMatch(chartItem, resolvedTrack)`: Additional heuristic check (title/artist similarity)
  - `fallbackQuery(chartItem)`: Generates search query for manual fallback
- **`smart_replace_dialog.dart`** (`lib/screens/widgets/`): UI dialog that shows replacement candidates and lets user choose

### MoonPlayer Status
- **Missing entirely**. No track replacement logic.
- When a track fails to load, `AudioEngine.js` calls `onErrorCallback` which shows a toast. No fallback or replacement is attempted.

### Implementation Guide

**Step 1: Create SmartTrackReplacement service**

File to create: `src/core/api/trackReplacementService.js`

```js
class TrackReplacementServiceImpl {
  constructor() {
    this.confidenceThreshold = 0.65; // Configurable
  }
  
  async searchCandidates(failedTrack) {
    // Search for the same track by different name/artist variations
    // Search across all available data sources
    // Return ranked candidates with confidence scores
  }
  
  async findBestReplacement(failedTrack) {
    const candidates = await this.searchCandidates(failedTrack);
    if (candidates.length === 0) return null;
    // Filter by confidence threshold
    // Return highest-ranked candidate
  }
  
  calculateConfidence(failedTrack, candidate) {
    // Title similarity (Levenshtein distance or simple word overlap)
    // Artist name match (exact or partial)
    // Album match
    // Duration proximity
  }
  
  async applyReplacement(failedTrack, replacementTrack) {
    // Replace failed track in current queue
    // Notify user about replacement
    // Resume playback
  }
}

export const trackReplacementService = new TrackReplacementServiceImpl();
```

**Step 2: Integrate with AudioEngine error handling**

Modify `src/core/audio/AudioEngine.js`:
- When `onloaderror` or `onplayerror` fires, instead of just showing toast, call `trackReplacementService.findBestReplacement(currentTrack)`
- If replacement found, load replacement track and resume playback
- Show "Couldn't play {title}, playing {replacement} instead" toast

**Step 3: Configurable threshold**

Add `trackReplacementConfidence` to `preferenceStore.js`:
```js
// preferenceStore.js
trackReplacementConfidence: 65, // 0-100, default 65%
```

Add setting in Settings page:
```jsx
// Settings.jsx
<div className="settings-row">
  <h4>Smart Track Replacement Confidence</h4>
  <input type="range" min="0" max="100" value={trackReplacementConfidence} />
  <span>{trackReplacementConfidence}%</span>
</div>
```

**Step 4: Manual replacement fallback**

Create `SmartReplaceDialog` component for cases where user wants to manually pick:
- Shows failed track info
- Lists replacement candidates with confidence scores
- User taps to select replacement

### Files to Create
- `src/core/api/trackReplacementService.js`
- `src/components/common/SmartReplaceDialog/SmartReplaceDialog.jsx`
- `src/components/common/SmartReplaceDialog/SmartReplaceDialog.css`

### Files to Modify
- `src/core/audio/AudioEngine.js` (wire error → replacement)
- `src/store/preferenceStore.js` (add threshold)
- `src/views/pages/Settings.jsx` (add threshold slider)

### Dependencies
- None new.

---

## 14. Crossfade Implementation (P1)

### BloomeeTunes Implementation
- **`player_engine.dart`** (core player engine): Full crossfade support:
  - `crossfadeDuration` (Duration): Configurable, stored in settings
  - `_crossfadeTriggered` (bool): Prevents double-trigger
  - `_checkCrossfadeTrigger(pos)`: When track remaining ≤ crossfadeDuration, triggers preload and starts crossfade
  - `crossfadeToPreloaded(duration)`: Asynchronous crossfade — fades out current, fades in preloaded next
  - Two-player design: `_activePlayerIndex` swaps between two audio players
  - Preloads next track into inactive player during current playback
  - Fade curve: smooth gain interpolation between the two players
  - Settings: 0 (off), 2 (default), 5, 10 seconds
  - Re-applies EQ filters after crossfade swap

### MoonPlayer Status
- **Settings UI only**: `Settings.jsx` has crossfade selector (0/3/5/10s), stored in `preferenceStore.crossfade`.
- **No implementation**: `AudioEngine.js` has NO crossfade logic. `Howler.js` doesn't natively support it.
- Track transition is immediate — no fade, no preload.

### Implementation Guide

**Step 1: Dual-player architecture**

Modify `src/core/audio/AudioEngine.js`:

```js
class AudioEngineImpl {
  constructor() {
    this.currentPlayer = null; // Active Howl instance
    this.nextPlayer = null;    // Preloaded Howl instance
    this.crossfadeDuration = 0; // seconds, 0 = off
    this.preloadedTrack = null;
    this._crossfadeTriggered = false;
    this._masterGain = null;    // Web Audio API GainNode for volume control
    // ... existing code
  }
  
  // Extend _setupEqualizer to also create a master gain node
  // Connect: source → EQ filters → masterGain → destination
}
```

**Step 2: Preload next track**

```js
async preloadNext(track) {
  if (this.crossfadeDuration <= 0) return;
  
  const streamUrl = await getStreamUrl(track);
  this.nextPlayer = new Howl({
    src: [streamUrl],
    html5: true,
    volume: 0, // Start silent
    // ...
  });
  this.preloadedTrack = track;
}
```

**Step 3: Crossfade trigger**

```js
_checkCrossfadeTrigger() {
  if (this.crossfadeDuration <= 0 || !this.currentPlayer || !this.nextPlayer) return;
  if (this._crossfadeTriggered) return;
  
  const currentPos = this.getPosition();
  const totalDuration = this.currentPlayer.duration();
  const remaining = totalDuration - currentPos;
  
  if (remaining <= this.crossfadeDuration && remaining > 0.5) {
    this._crossfadeTriggered = true;
    this._executeCrossfade();
  }
}
```

**Step 4: Execute crossfade**

```js
async _executeCrossfade() {
  const fadeDuration = this.crossfadeDuration * 1000; // ms
  
  // Start playing next track at volume 0
  this.nextPlayer.play();
  
  // Fade out current, fade in next
  const startTime = this.nextPlayer._sounds[0]._node.context.currentTime;
  this.nextPlayer._sounds[0]._node.volume.linearRampToValueAtTime(1, startTime + fadeDuration / 1000);
  this.currentPlayer._sounds[0]._node.volume.linearRampToValueAtTime(0, startTime + fadeDuration / 1000);
  
  // After fade, swap references
  setTimeout(() => {
    this.currentPlayer.unload();
    this.currentPlayer = this.nextPlayer;
    this.nextPlayer = null;
    this._crossfadeTriggered = false;
    this.onEndCallback?.(); // Trigger next track logic
  }, fadeDuration + 200);
}
```

**Step 5: Wire to player store**

Modify `src/store/playerStore.js`:
- `playTrack()`: If crossfadeDuration > 0 and queue has next track, call `AudioEngine.preloadNext(nextTrack)`
- `next()`: Respect preloaded player state
- Check remaining time in progress loop and trigger crossfade

**Step 6: Settings integration**

Already have UI in `Settings.jsx`. Wire:
```js
updatePreference('crossfade', seconds);
AudioEngine.crossfadeDuration = seconds;
```

### Files to Create
- None new (modify existing).

### Files to Modify
- `src/core/audio/AudioEngine.js` (major rework — dual-player, fade logic)
- `src/store/playerStore.js` (wire preload, crossfade trigger)
- `src/core/audio/queueService.js` (trigger preload on track change)

### Dependencies
- None new.

---

## 15. Enhanced Share/Deep Linking (P2)

### BloomeeTunes Implementation
- **`shared_url_resolver_service.dart`** (`lib/services/`, 167 lines):
  - `SharedUrlResolverService`: Resolves shared URLs (YouTube, Spotify, etc.) to track data
  - `resolveYoutubeVideo(url)`: Extracts video ID, queries all loaded content resolvers, returns `Track`
  - `_rankContentResolversForUrl(url)`: Priority-sorted resolver list
  - Handles invalid URLs with `SharedUrlResolveStatus` enum (success, invalidUrl, noResolver, failed)
  - Timeout per resolver (10 seconds)
- **`app_router.dart`**: GoRouter configuration with deep link handling
- **`url_checker.dart`**: Utility to validate URLs

### MoonPlayer Status
- **`shareService.js`** (`src/core/api/shareService.js`, 121 lines): Shares via Web Share API + clipboard fallback. Works for tracks and playlists.
- **`SongRedirectView.jsx`** (`src/views/pages/`): Handles `/song/:id` deep links.
- **Missing**: No incoming shared URL resolution. No URL scheme for playlists/albums/artists. No handling of external shared content (e.g., share from YouTube to MoonPlayer).

### Implementation Guide

**Step 1: Create SharedUrlResolver service**

File to create: `src/core/api/urlResolverService.js`

```js
class UrlResolverServiceImpl {
  async resolveUrl(url) {
    const type = this.detectUrlType(url);
    switch (type) {
      case 'youtube': return this.resolveYoutube(url);
      case 'spotify-track': return this.resolveSpotifyTrack(url);
      case 'spotify-playlist': return this.resolveSpotifyPlaylist(url);
      case 'moonplayer-track': return this.resolveMoonPlayerTrack(url);
      case 'moonplayer-playlist': return this.resolveMoonPlayerPlaylist(url);
      case 'moonplayer-album': return this.resolveMoonPlayerAlbum(url);
      default: return { status: 'unsupported' };
    }
  }
  
  detectUrlType(url) {
    // Match against known patterns
  }
  
  async resolveYoutube(url) {
    // Extract video ID
    // Use search to find matching track
  }
  
  async resolveSpotifyTrack(url) {
    // Extract Spotify ID
    // Search JioSaavn for matching track
  }
}
```

**Step 2: Handle incoming shares (PWA)**

In `src/App.jsx`, add:
```jsx
useEffect(() => {
  // PWA: navigator.shareTarget (if available)
  // Or handle via URL query params: ?shared_url=...
  if (navigator.shareTarget) {
    // Handle share target
  }
  
  const params = new URLSearchParams(window.location.search);
  const sharedUrl = params.get('shared_url');
  if (sharedUrl) {
    urlResolverService.resolveUrl(sharedUrl).then(result => {
      // Navigate to appropriate page
    });
  }
}, []);
```

**Step 3: Build proper URL scheme**

Support routes:
- `/song/:id` — already exists
- `/playlist/:id` — already exists
- `/album/:id` — to be created
- `/artist/:id` — to be created

Share URLs should use:
```js
_buildShareUrl(hash) {
  // /song/{id}
  // /playlist/{id}
  // /album/{id}
  // /artist/{id}
}
```

**Step 4: Register as share target (PWA)**

Update `manifest.json` (if exists) or create share target registration:
```json
{
  "share_target": {
    "action": "/?shared_url=",
    "method": "GET",
    "enctype": "application/x-www-form-urlencoded",
    "params": {
      "title": "title",
      "text": "text",
      "url": "shared_url"
    }
  }
}
```

### Files to Create
- `src/core/api/urlResolverService.js`

### Files to Modify
- `src/App.jsx` (handle incoming shared URLs)
- `src/core/api/shareService.js` (expand URL scheme)
- `public/manifest.json` (add share_target)
- `src/service-worker.js` (handle shared URL in service worker)

### Dependencies
- None new.

---

## Summary — Priority Matrix

| Priority | Feature | Effort | Impact | Dependencies |
|----------|---------|--------|--------|--------------|
| **P0** | Chart System | Medium | High | Chart API, Zustand, carousel library |
| **P0** | Album & Artist Views | Medium | High | MusicService expansion, react-router |
| **P1** | Enhanced Fullscreen Lyrics | Medium | High | Framer Motion, existing LyricsPanel |
| **P1** | Interactive Equalizer | Medium | Medium | Canvas API, AudioEngine extension |
| **P1** | Download Manager w/ Queue | Large | High | DownloadStore, Dexie, progress UI |
| **P1** | Enhanced Recommendations | Small | Medium | Modifying recommendationService |
| **P1** | Smart Track Replacement | Medium | Medium | Track matching algorithm |
| **P1** | Crossfade Implementation | Large | Medium | Dual-player engine rework |
| **P2** | Sleep Timer with UI | Small | Low | TimerView component, playerStore |
| **P2** | Changelog / What's New | Small | Low | ChangelogReader component |
| **P2** | Import/Export Playlists | Medium | Low | JSON serialization, file I/O |
| **P2** | Backup & Restore | Medium | Low | Full state serialization |
| **P2** | Local Music Support | Large | Low | File System Access API, ID3 parsing |
| **P2** | Discord Rich Presence | Small | Low | Discord RPC (Electron only) |
| **P2** | Enhanced Share/Deep Linking | Medium | Low | URL resolver, PWA manifest |

**Total estimated effort**: ~4-6 weeks for a single developer working full-time on P0 + P1 features.
