# MoonPlayer -- Development Phases

> **Strategy**: Sequential, linear, dependency-ordered.
> **Rule**: Complete Phase N before starting Phase N+1. No skipping.
> **Tracking**: Each phase's status is tracked in `PROGRESS.md`.

---

## Phase 0: Project Initialization
**Goal**: Working Vite + React shell with routing and folder structure.

- Initialize Vite + React project
- Set up folder structure per `context/essentials.md`
- Install core dependencies (React Router, Zustand, Dexie.js)
- Configure HashRouter with placeholder routes
- Set up ESLint + Prettier
- Create `index.css` with ALL CSS custom properties (design tokens)
- Import Google Fonts (Space Grotesk, Inter)
- Verify dev server runs (`npm run dev`)

**Exit Criteria**: Empty app shell with routing, all design tokens in CSS, dev server running.

---

## Phase 1: Design System
**Goal**: Complete design token system and reusable base components.

- Implement full color palette as CSS custom properties
- Implement typography scale
- Implement spacing, radius, shadow, z-index tokens
- Create `GlassPanel` component (glassmorphism surface)
- Create `SolidPanel` component (standard card surface)
- Create `Button` component (primary, secondary, ghost variants)
- Create `IconButton` component
- Create skeleton/shimmer loading states
- Verify all tokens render correctly across breakpoints

**Exit Criteria**: Design system components render correctly. Visual inspection passes.

---

## Phase 2: Layout System
**Goal**: Three responsive layouts working with navigation.

- Create `useBreakpoint` hook (mobile/tablet/desktop detection)
- Create `MobileView` layout (single pane + bottom tabs)
- Create `TabletView` layout (sidebar + content pane)
- Create `DesktopView` layout (3-column: sidebar + content + queue panel)
- Create `Sidebar` component (navigation links)
- Create `BottomTabs` component (mobile navigation)
- Implement layout switch in `App.jsx`
- Verify responsive behavior at all breakpoints

**Exit Criteria**: Three distinct layouts render at correct breakpoints. Navigation works.

---

## Phase 3: Splash + Onboarding
**Goal**: Complete first-time user and returning user flows.

- Create crescent moon logo (SVG)
- Create `SplashScreen` component (1.5s animation: logo slides up + "MoonPlayer" text)
- Create `UsernameInput` component (default "guest", skip = "guest")
- Create combined `LanguageArtistPicker` component
- Create `onboardingStore` (Zustand) for onboarding state
- Implement first-time flow: Splash -> Username -> Lang+Artist -> Home
- Implement returning user flow: Quick splash (0.5s) -> Home
- Store preferences in Dexie.js (username, languages, artists)
- Logo shrinks into header bar after splash

**Exit Criteria**: Both flows work end-to-end. Preferences persist across refreshes.

---

## Phase 4: Service Layer + API Integration
**Goal**: `MusicService` abstraction with all API endpoints.

- Create `MusicService` class with all methods (search, getSong, getArtist, getAlbum, getPlaylist, getArtistSongs, getLyrics, getStreamUrl)
- Create data adapters (TrackAdapter, ArtistAdapter, AlbumAdapter, PlaylistAdapter)
- Implement HTML entity decoding (SSR-safe, no DOM)
- Implement quality-aware stream URL resolution
- Create `apiCache` module (Dexie.js with TTL rules)
- Implement Token Bucket rate limiter
- Implement request queue (max 3 concurrent, 10-queue FIFO)
- Create search debounce utility (300ms)
- Verify all API calls work against live JioSaavn API

**Exit Criteria**: `MusicService.search("test")` returns normalized data. Rate limiting works.

---

## Phase 5: Search + Results
**Goal**: Working search with results display.

- Create `SearchBar` component with debounced input
- Create `SearchResults` component (songs, albums, artists tabs)
- Create `TrackCard` component (album art, title, artist, duration, actions)
- Create `ArtistCard` component
- Create `AlbumCard` component
- Implement search flow: type -> debounce -> MusicService.search() -> display results
- Implement rate limit shimmer on search bar
- Implement skeleton loading states during search
- Handle empty results and error states

**Exit Criteria**: Search returns results. Rate limiting shimmer visible when spamming.

---

## Phase 6: Audio Engine + Playback
**Goal**: Core playback with HTML5 Audio.

- Create `audioEngine` singleton (HTML5 Audio wrapper)
- Create `playerStore` (Zustand: queue, currentIndex, isPlaying, volume, progress, repeatMode, shuffleMode)
- Implement play/pause/skip/previous/seek
- Implement volume control + mute
- Implement loop modes (Off/One/Queue)
- Implement shuffle mode
- Implement crossfade (3s between tracks)
- Implement playback speed control (0.5x - 2x)
- Implement stream URL refresh on 403 (max 3 retries)
- Implement auto-skip on error + toast notification
- Implement continue-buffered-audio on network loss

**Exit Criteria**: Can search, select, and play a song. Skip/loop/volume work.

---

## Phase 7: Player UI
**Goal**: Mini-player, fullscreen player, and playbar.

- Create `MiniPlayer` component (floating, mobile) with mini equalizer bars
- Create `BottomPlaybar` component (desktop, 80px fixed)
- Create `FullscreenPlayer` component (album art, controls, lyrics, VibeTune)
- Implement swipe up (mini -> fullscreen) with Framer Motion
- Implement swipe down (fullscreen -> mini)
- Implement progress bar with seek
- Implement album art dominant color extraction
- Apply glassmorphism to mini-player and fullscreen player

**Exit Criteria**: Full playback UI works on all three layouts.

---

## Phase 8: Queue Management
**Goal**: Full queue system with auto-queue.

- Create `QueuePanel` component (collapsible on desktop, slide-up on mobile)
- Implement drag-and-drop reorder (desktop)
- Implement swipe-to-reorder (mobile)
- Implement all queue actions (play next, move to bottom, remove, clear, shuffle)
- Implement "Add entire album/playlist to queue"
- Implement "Save queue as playlist"
- Implement auto-queue: fetch 10 similar songs when user plays a track
- Implement lazy-load: fetch 10 more when 3 remaining
- Implement auto-play recommendations when queue empty

**Exit Criteria**: Queue populates automatically. All manipulation gestures work.

---

## Phase 9: Library + Playlists
**Goal**: Complete library management system.

- Create `libraryStore` (Zustand + Dexie.js persistence)
- Create auto-created "Liked Songs" playlist (heart icon integration)
- Create auto-created "Recently Played" playlist (last 20 songs, session-based)
- Create `LibraryView` component (playlist grid)
- Create `PlaylistView` component (track list within playlist)
- Implement playlist CRUD (create, rename, delete, reorder)
- Implement auto-generated cover images (mosaic from first 4 album arts)
- Implement all add-to-playlist patterns (long-press, swipe, three-dot menu)
- Implement JioSaavn playlist import (paste URL)
- Enforce limits: max 50 playlists, max 100 songs per playlist

**Exit Criteria**: Can create playlists, add songs, reorder. Import works.

---

## Phase 10: Recommendation Engine
**Goal**: Hybrid recommendation system.

- Create `recommendationService` (hybrid API + local logic)
- Implement session history tracking (in-memory, last 20 tracks)
- Implement seed data fetching (artist songs + language search)
- Implement local ranking logic (weighted by history, likes, preferences)
- Create `RecommendationCarousel` component for home page
- Implement "Because you listened to [Artist]" carousels
- Implement empty state filler recommendations
- Implement mini-player "Next up" suggestion chip
- Implement refresh on app open + pull-to-refresh

**Exit Criteria**: Home page shows personalized carousels. Auto-queue uses recommendations.

---

## Phase 11: Lyrics
**Goal**: Synchronized scrolling lyrics.

- Create `LyricsPanel` component
- Implement dual-source lyrics fetching (JioSaavn API + LRCLIB fallback)
- Implement LRC parsing (line-level timestamps)
- Implement synchronized scrolling (highlight current line)
- Implement plain text fallback (no timestamps)
- Create lyrics display in fullscreen player
- Create lyrics toggle in desktop view

**Exit Criteria**: Lyrics scroll in sync with playback. Fallback to plain text works.

---

## Phase 12: VibeTune Visualizer
**Goal**: Multiple visualization types with audio reactivity.

- Create `VisualizerEngine` (Web Audio API AnalyserNode for frequency/amplitude)
- Create `WaveformVisualizer` component (equalizer bars)
- Create `ParticleVisualizer` component (particle system)
- Create `FluidVisualizer` component (morphing blobs)
- Create `RadialVisualizer` component (concentric rings)
- Create `AuroraVisualizer` component (flowing color bands)
- Create `VisualizerSelector` for settings
- Implement dominant color extraction for visualization colors
- Implement mini equalizer bars (3-4 bars) for mini-player
- Implement disable option for battery savings
- Use GSAP for timeline-based sequences

**Exit Criteria**: All 5 visualizer types work. User can switch in settings. Colors from album art.

---

## Phase 13: Pet System
**Goal**: Interactive floating pet character.

- Research and set up Rive runtime (or custom sprite system)
- Create astronaut character with all animation states
- Create space animal character with all animation states
- Create `PetContainer` component (floating, draggable, position-remembering)
- Implement all behaviors: idle, dancing, sleeping, tempo-reactive, greeting, action-reactive, clickable, mood-based
- Implement pet text toasts ("Hi [username]!", etc.)
- Implement settings: pet on/off, character selection
- Implement platform-specific sizing (smaller on mobile)

**Exit Criteria**: Pet floats, animates, reacts to music. Can be toggled and repositioned.

---

## Phase 14: Notification System
**Goal**: Dual notification system (system + in-app).

- Create custom `GlassToast` component (glassmorphic in-app toast)
- Create `toastStore` (Zustand) for managing toast queue
- Implement slide-in animation (Framer Motion) for toasts
- Implement auto-dismiss (3-4 seconds)
- Integrate toast triggers for all events (song change, playlist actions, errors)
- Set up Capacitor Local Notifications plugin (for Android)
- Implement Media Session API for lockscreen controls
- Implement animated album art in system notification

**Exit Criteria**: In-app toasts work. System notifications show on Android.

---

## Phase 15: Download System
**Goal**: Save songs to device storage.

- Create `DownloadButton` component
- Create `downloadService` (resolves download URL, triggers download)
- Implement web download (standard browser download via anchor tag)
- Implement Android download (Capacitor Filesystem plugin -> Downloads folder)
- Add download option to context menus
- Create download progress in-app toast
- Create download complete notification

**Exit Criteria**: Songs download to device. Progress shown. Notification on complete.

---

## Phase 16: Sharing + Deep Links
**Goal**: Share songs/playlists via deep links.

- Define URL scheme: `moonplayer://song/{id}`, `moonplayer://playlist/{id}`
- Create `ShareDialog` component
- Implement Web Share API integration
- Implement deep link handler in App.jsx (parse incoming links)
- Implement web fallback (play song in web version)
- Create shareable link generation
- Implement playlist link sharing

**Exit Criteria**: Can share a song link. Opening link on web plays the song.

---

## Phase 17: Settings Page
**Goal**: Comprehensive settings UI.

- Create `SettingsView` component
- Create `preferenceStore` (Zustand + Dexie.js)
- Implement all settings sections:
  - Streaming quality picker
  - Username edit
  - Language preferences edit
  - Artist preferences edit
  - Pet on/off + character selection
  - VibeTune on/off + visualizer type
  - Crossfade display
  - Equalizer preset selector
  - Sleep timer
  - Playback speed
  - Notification preferences
  - Cache management (size display + clear button)
  - Data saver mode toggle
  - Gesture guide replay
  - About / Credits / Version
- Implement data saver mode behavior (reduce image quality, disable VibeTune, cap audio 96kbps)

**Exit Criteria**: All settings functional and persistent.

---

## Phase 18: Keyboard Shortcuts + Gestures
**Goal**: All keyboard and gesture interactions.

- Implement all keyboard shortcuts (20+ shortcuts from DECISIONS_DIGEST.md)
- Create keyboard shortcut overlay (? key to show)
- Implement all mobile gestures (fixed, non-customizable)
- Create gesture guide component (first-time overlay)
- Implement double-tap album art to like

**Exit Criteria**: All shortcuts work. Gesture guide displays for new users.

---

## Phase 19: PWA + Capacitor
**Goal**: Installable web app + Android APK.

- Create `manifest.json` (PWA metadata, icons, theme color)
- Create service worker (asset caching only, no audio caching)
- Implement install prompt UX
- Set up Capacitor project (`npx cap init`)
- Configure Android project (Capacitor)
- Implement foreground service for background audio
- Implement audio focus handling (Android)
- Implement WAKE_LOCK
- Implement auto-update check (compare version against GitHub Releases)
- Build APK

**Exit Criteria**: Web app installable. APK builds and installs on Android 10+.

---

## Phase 20: Equalizer + Sleep Timer (Audio Features)
**Goal**: Finalize audio enhancement features.

- Implement Web Audio API BiquadFilterNode chain for EQ
- Create EQ preset profiles (Normal, Bass Boost, Vocal, Treble, Rock, Pop)
- Create EQ UI in settings
- Implement sleep timer countdown
- Create sleep timer UI (in player controls)
- Verify crossfade works correctly with all other audio features

**Exit Criteria**: EQ presets audibly change sound. Sleep timer stops playback on time.

---

## Phase 21: Testing
**Goal**: Comprehensive test coverage.

- Write unit tests: audio engine, queue logic, recommendation logic, stores, services, utilities
- Write integration tests: search flow, queue population, playlist CRUD, settings persistence
- Write E2E tests: onboarding, full playback lifecycle, library management
- Run all tests, fix failures
- Performance audit (Lighthouse)
- Accessibility audit

**Exit Criteria**: All tests pass. Lighthouse performance > 80.

---

## Phase 22: Polish + Performance
**Goal**: Production-ready quality.

- Performance optimization: lazy loading, code splitting, image optimization
- Animation smoothness audit (60fps target)
- Memory leak audit (audio, animations, event listeners)
- Error boundary coverage verification
- Cross-browser testing (Chrome, Firefox, Safari)
- Android WebView testing (Chrome 90+)
- Final visual QA on all three layouts
- Bundle analysis and optimization

**Exit Criteria**: Production build works. No visual regressions. Smooth on all devices.

---

## Phase Summary

| Phase | Name | Estimated Complexity |
|:---|:---|:---|
| 0 | Project Initialization | Low |
| 1 | Design System | Medium |
| 2 | Layout System | Medium |
| 3 | Splash + Onboarding | Medium |
| 4 | Service Layer + API | High |
| 5 | Search + Results | Medium |
| 6 | Audio Engine + Playback | High |
| 7 | Player UI | High |
| 8 | Queue Management | High |
| 9 | Library + Playlists | High |
| 10 | Recommendation Engine | Medium |
| 11 | Lyrics | Medium |
| 12 | VibeTune Visualizer | High |
| 13 | Pet System | High |
| 14 | Notification System | Medium |
| 15 | Download System | Low |
| 16 | Sharing + Deep Links | Medium |
| 17 | Settings Page | Medium |
| 18 | Keyboard + Gestures | Low |
| 19 | PWA + Capacitor | High |
| 20 | EQ + Sleep Timer | Medium |
| 21 | Testing | High |
| 22 | Polish + Performance | Medium |
