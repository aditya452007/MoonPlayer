# MoonPlayer -- Progress Tracker

> **Updated**: 2026-05-30
> **Current Phase**: Phase 20 (EQ + Sleep Timer)
> **Status**: [IN PROGRESS] Phase 20

---

## Documentation Phase

### Governance Infrastructure (.dev/)
- [x] `DECISIONS_DIGEST.md` -- Master decisions document
- [x] `AGENT_SOP.md` -- Agent operating procedure
- [x] `UI_CODING_RULES.md` -- CSS and component coding standards
- [x] `DEVELOPMENT_PHASES.md` -- Sequential build phases
- [x] `PROGRESS.md` -- This file
- [x] `PROJECT_INFO.md` -- Project metadata
- [x] `ALLOWED_FORBIDDEN.md` -- Agent guardrails

### Context Files (context/)
- [x] `essentials.md` -- Architecture, folder structure, dependencies
- [x] `ui_design_glass.md` -- Design tokens, glassmorphism, animations
- [x] `ui_component_architecture.md` -- Component hierarchy, specs
- [x] `user_flows.md` -- User journeys, use cases, state machines
- [x] `system_flows.md` -- System architecture, data flow diagrams
- [x] `api_reference.md` -- API endpoints, error handling
- [x] `api_abstraction.md` -- Service layer, entities, adapters
- [x] `api_call_orchestration.md` -- Request lifecycle, orchestration
- [x] `decisions_log.md` -- Architecture Decision Records
- [x] `features_desktop.md` -- Desktop layout, keyboard shortcuts
- [x] `features_mobile.md` -- Mobile layout, gestures, notifications
- [x] `platform_perspectives.md` -- Web vs Android comparison
- [x] `performance_security_testing.md` -- Performance, security, testing
- [x] `rate_limiting_resilience.md` -- Rate limiting, cache, resilience
- [x] `critique_missing_pumps.md` -- Failure modes, mitigations
- [x] `pet_system.md` -- Pet feature specification
- [x] `recommendation_engine.md` -- Recommendation logic
- [x] `notification_system.md` -- Notification system

### Spec
- [x] `specs/001-moon-player/spec.md` -- User stories, FRs, entities

---

## Development Phases

### Phase 0: Project Initialization
- [x] Initialize Vite + React project
- [x] Set up folder structure
- [x] Install core dependencies (react-router-dom, zustand, dexie, @phosphor-icons/react)
- [x] Configure HashRouter with placeholder routes
- [x] Set up ESLint + Prettier
- [x] Create index.css with design tokens (all CSS custom properties)
- [x] Import Google Fonts (Space Grotesk, Inter, JetBrains Mono)
- [x] Create animations.css and utilities.css
- [x] Create utility functions (debounce, formatTime)
- [x] Configure Vite with path aliases
- [x] Create .env with API base URL
- [x] Verify dev server runs

### Phase 1: Design System
- [x] GlassPanel component
- [x] SolidPanel component
- [x] Button component (primary, secondary, ghost)
- [x] IconButton component
- [x] Skeleton/shimmer loading states
- [x] Verify all tokens render correctly

### Phase 2: Layout System
- [x] useBreakpoint hook
- [x] Sidebar component (Desktop)
- [x] BottomNavigation component (Mobile)
- [x] TopBar component
- [x] PageTransition wrapper (Framer Motion)
- [x] AppShell integration

### Phase 3: State & Storage Layer
- [x] Define Dexie.js schema (`src/core/db/schema.js`)
- [x] Setup `preferenceStore.js` (Zustand)
- [x] Setup `playerStore.js` (Zustand)
- [x] Setup `libraryStore.js` (Zustand)
- [x] Setup `toastStore.js` (Zustand)

### Phase 4: Music Engine & Service Integration
- [x] Define abstract `MusicService` interface
- [x] Implement `JioSaavnService` (unofficial API wrapper)
- [x] Implement `AudioPlayer` core (Howler.js or Native Audio)

### Phase 5: Global Player UI
- [x] Global Floating Player bar
- [x] Playback controls (play/pause, next, prev, shuffle, loop)
- [x] Progress bar with seek functionality

### Phase 6: Core Views
- [x] Implement Dashboard (Home) with Trending / Recommendations
- [x] Implement Search view (Debounced input, Results grid)
- [x] Implement Library view (Playlists grid)

---

### Phase 7: Player UI
- [x] Create `MiniPlayer` component (floating, mobile)
- [x] Create `BottomPlaybar` component (desktop, 80px fixed)
- [x] Create `FullscreenPlayer` component (album art, controls, lyrics, VibeTune)
- [x] Implement swipe up/down (fullscreen toggle) with Framer Motion
- [x] Implement album art dominant color extraction
- [x] Apply glassmorphism to mini-player and fullscreen player
---

### Phase 8: Queue Management
- [x] Create `QueuePanel` component (collapsible on desktop, slide-up on mobile)
- [x] Implement drag-and-drop reorder with Framer Motion
- [x] Implement all queue actions (play next, move to bottom, remove, clear, shuffle)
- [x] Implement auto-queue: fetch 10 similar songs when queue nears empty

### Phase 9: Library & Playlists
- [x] Create `PlaylistView` component with playlist track listing
- [x] Create context menus (`ContextMenu` and `TrackContextMenu`) for track actions (Add to Playlist, Play Next, Like)
- [x] Implement playlist CRUD logic in `libraryStore.js`
- [x] Implement "Recently Played" state tracking and logging
- [x] Integrate navigation between Library and Playlist views

### Phase 10: Recommendation Engine
- [x] Create `recommendationService` (hybrid API + local logic)
- [x] Implement session history tracking (in-memory, last 20 tracks)
- [x] Implement seed data fetching (artist songs + language search)
- [x] Implement local ranking logic (weighted by history, likes, preferences)
- [x] Create `RecommendationCarousel` component for home page
- [x] Implement "Because you listened to [Artist]" carousels
- [x] Implement empty state filler recommendations
- [x] Implement mini-player "Next up" suggestion chip
- [x] Implement refresh on app open + pull-to-refresh

### Phase 11: Lyrics
- [x] Create `LyricsPanel` component
- [x] Implement dual-source lyrics fetching (JioSaavn API + LRCLIB fallback)
- [x] Implement LRC parsing (line-level timestamps)
- [x] Implement synchronized scrolling (highlight current line)
- [x] Implement plain text fallback (no timestamps)
- [x] Create lyrics display in fullscreen player
- [x] Create lyrics toggle in desktop view

### Phase 12: VibeTune Visualizer
- [x] Create `VisualizerEngine` (Web Audio API AnalyserNode for frequency/amplitude)
- [x] Create `WaveformVisualizer` component (equalizer bars)
- [x] Create `AuroraVisualizer` component (flowing color bands)
- [x] Create `VisualizerSelector` for settings
- [x] Implement mini equalizer bars (3-4 bars) for mini-player
- [x] Implement disable option for battery savings
- [x] Fallback to simulated audio reactive data for blocked CORS streams

### Phase 13: Pet System
- [x] Create CSS/SVG animated astronaut character
- [x] Create CSS/SVG animated space cat character
- [x] Create `PetContainer` component (floating, draggable)
- [x] Implement behaviors: idle, dancing, sleeping
- [x] Implement random and reactive speech bubbles
- [x] Add global persistence and settings toggle

### Phase 14: Notification System
- [x] Create custom `GlassToast` component (glassmorphic in-app toast)
- [x] Create `toastStore` (Zustand) for managing toast queue
- [x] Implement slide-in animation (Framer Motion) for toasts
- [x] Implement auto-dismiss (3-4 seconds)
- [x] Integrate toast triggers for all events (queue actions, etc.)
- [x] Implement Media Session API for lockscreen controls

### Phase 15: Download System
- [x] Create `DownloadButton` component
- [x] Create `downloadService` (resolves download URL, triggers download)
- [x] Implement web download (standard browser download via anchor tag)
- [x] Add download option to context menus
- [x] Create download progress in-app toast
- [x] Create download complete notification

### Phase 16: Sharing + Deep Links
- [x] Define URL scheme: `moonplayer://song/{id}`, `moonplayer://playlist/{id}` (via `shareService.js`)
- [x] Create `ShareDialog` component (using Web Share API via `shareService`)
- [x] Implement Web Share API integration
- [x] Implement deep link handler in App.jsx (via `SongRedirectView`)
- [x] Implement web fallback (play song in web version)
- [x] Create shareable link generation
- [x] Implement playlist link sharing

### Phase 17: Settings Page
- [x] Create `SettingsView` component
- [x] Create `preferenceStore` (Zustand + Dexie.js)
- [x] Implement all settings sections:
  - [x] Streaming quality picker
  - [x] Username edit
  - [x] Language preferences edit
  - [x] Artist preferences edit
  - [x] Pet on/off + character selection
  - [x] VibeTune on/off + visualizer type
  - [x] Crossfade display
  - [x] Equalizer preset selector
  - [x] Sleep timer
  - [x] Playback speed
  - [x] Notification preferences
  - [x] Cache management (size display + clear button)
  - [x] Data saver mode toggle
  - [x] Gesture guide replay
  - [x] About / Credits / Version
- [x] Implement data saver mode behavior (reduce image quality, disable VibeTune, cap audio 96kbps)

### Phase 18: Keyboard Shortcuts + Gestures
- [x] Implement all keyboard shortcuts (20+ shortcuts from DECISIONS_DIGEST.md)
- [x] Create keyboard shortcut overlay (? key to show)
- [x] Implement all mobile gestures (fixed, non-customizable)
- [x] Create gesture guide component (first-time overlay)
- [x] Implement double-tap album art to like

### Phase 19: PWA + Capacitor
- [x] Create `manifest.json` (via `vite-plugin-pwa`)
- [x] Create service worker (asset caching only)
- [x] Implement install prompt UX (`InstallPrompt.jsx`)
- [x] Set up Capacitor project (`npx cap init`)
- [x] Configure Android project (`npx cap add android`)
- [x] Add background audio permissions (`AndroidManifest.xml`)
- [x] Implement auto-update check (`UpdateService.js`)

## Notes & Decisions Log

| Date | Note |
|:---|:---|
| 2026-05-28 | Project documentation phase started. All architectural decisions resolved via Q&A in new.md. |
| 2026-05-29 | Phase 0 completed. Vite + React initialized, design tokens set, dev server verified. |
| 2026-05-29 | NOTE: Vite `--overwrite` flag deleted uncommitted .dev/ and context/ files. Restored from agent context. Some context files need to be re-created by the user. |
