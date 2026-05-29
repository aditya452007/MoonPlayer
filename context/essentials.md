# MoonPlayer -- Core System Architecture & Data Flow

> Status: FINAL
> Date: 2026-05-28

This document defines the core architecture, folder structure, and data flow of MoonPlayer.

---

## 1. System Architecture (Three-Tier)

MoonPlayer uses a strict three-tier architecture to separate concerns:

1. **View Layer (React / UI)**
   - Responsible strictly for rendering data and capturing user intent.
   - NO direct API calls. NO complex data transformations.
   - Communicates exclusively with the State Layer.

2. **State Layer (Zustand)**
   - Manages application state, queue, currently playing track, and user preferences.
   - Orchestrates actions by calling the Infrastructure Layer.

3. **Infrastructure / Service Layer (MusicService & Dexie.js)**
   - The ONLY layer aware of JioSaavn API structures.
   - Handles network requests, Token Bucket rate limiting, HTML entity decoding.
   - Adapts raw API JSON into normalized internal entities (`Track`, `Artist`, `Album`).
   - Handles caching to Dexie.js.

---

## 2. Folder Structure

The project MUST strictly adhere to this directory tree:

```
src/
  core/
    api/
      client.js             # Fetch wrapper with timeouts
      endpoints.js          # URL builders
      musicService.js       # The singleton service abstraction
      adapters/             # Data normalization (htmlDecoder, trackAdapter, etc.)
    db/
      schema.js             # Dexie.js database schema
      cacheManager.js       # TTL and storage management
    audio/
      audioEngine.js        # HTML5 Audio wrapper
      visualizerEngine.js   # Web Audio API (AnalyserNode)
    network/
      rateLimiter.js        # Token Bucket logic
      networkMonitor.js     # Online/offline state tracking
    utils/
      debounce.js           # Generic debounce
      formatTime.js         # Seconds to M:SS formatter

  store/
    playerStore.js          # Playback, queue, volume
    libraryStore.js         # Playlists, liked songs
    onboardingStore.js      # First-time user flow state
    preferenceStore.js      # User settings (quality, languages, etc.)
    toastStore.js           # Notification queue

  views/
    MobileView/             # < 768px layout
    TabletView/             # 768px - 1024px layout
    DesktopView/            # > 1024px layout
    pages/                  # Route components (Home, Search, Settings)

  components/
    common/                 # Reusable UI (Button, GlassPanel, Sidebar, etc.)
    player/                 # MiniPlayer, FullscreenPlayer, LyricsPanel
    search/                 # SearchBar, SearchResults, TrackCard
    library/                # Playlist grid, track lists
    dashboard/              # Splash, Onboarding pickers, Recommendation carousels

  hooks/
    useBreakpoint.js        # Responsive layout detector
    useAudioControls.js     # Bindings for player UI

  styles/
    index.css               # Design tokens (:root) and reset
    animations.css          # CSS keyframes
    utilities.css           # Utility classes (.sr-only, .truncate)

  assets/                   # SVGs, static images
  __tests__/                # Vitest unit and integration tests
```

---

## 3. Data Flow Diagram

**Scenario: User searches for a song and plays it**

1. `SearchBar.jsx` captures input and debounces.
2. `SearchBar` calls `MusicService.searchSongs(query)`.
3. `MusicService` checks `rateLimiter`. If full, it waits.
4. `MusicService` calls JioSaavn `/api/search/songs`.
5. `MusicService` passes raw JSON to `TrackAdapter`.
6. `TrackAdapter` decodes HTML, extracts IDs, and formats URLs.
7. `MusicService` returns normalized `Track[]` to UI.
8. User clicks a Track. Component calls `playerStore.play(track)`.
9. `playerStore` calls `MusicService.getTrackDetails(id)` to JIT-resolve the stream URL.
10. `playerStore` passes stream URL to `audioEngine.js`.
11. `audioEngine` begins playback; `visualizerEngine` begins reading frequency data.
