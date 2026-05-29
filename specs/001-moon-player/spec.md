# Feature Specification: MoonPlayer Music Streaming App

**Feature Branch**: `001-moon-player`

**Created**: 2026-05-28

**Status**: FINAL

**Input**: User description: "Create MoonPlayer JioSaavn Music Application based on architectural decisions"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Personalized Onboarding & Recommendation Dashboard (Priority: P1)

As a first-time user opening MoonPlayer, I want to skip or enter a username, then select my preferred languages and favorite artists so that my home dashboard immediately populates with customized carousels.

**Why this priority**: Core value driver. Immediate personalization based on a hybrid recommendation engine guarantees strong first impressions.

**Independent Test**: Clear local storage and IndexedDB. Launch the app. A splash screen with a crescent moon should appear, followed by a username input, and a combined language + artist picker. Select preferences. Verify the Home view renders "Because you listened to..." and "Popular in..." carousels powered by API seed data and local ranking.

**Acceptance Scenarios**:
1. **Given** a new user launches the app, **When** the splash screen finishes (1.5s), **Then** display the username and preferences picker.
2. **Given** preferences are saved, **When** the Home screen mounts, **Then** fetch recommendation seed data (`/api/artists/{id}/songs`, `/api/search/songs?query={language}`) and apply local logic to render carousels.

---

### User Story 2 - Search, Streaming, & Quality Selection (Priority: P1)

As an active user, I want to search for music and stream high-quality audio directly from the CDN without downloading audio files to my local database, so that the app remains fast and lightweight.

**Why this priority**: Core audio utility. Streaming directly with quality control is the foundation of the player.

**Independent Test**: Search for a track. Verify a subtle shimmer animation appears on the search bar if rate limits queue the request. Click a track. Verify the stream plays at the selected quality (e.g., 320kbps). Disconnect the internet; verify the current buffer finishes and a toast appears, but no offline playback of uncached audio is attempted.

**Acceptance Scenarios**:
1. **Given** the user searches, **When** the Token Bucket limiter queues requests, **Then** display a subtle shimmer on the search bar instead of a blocking dialogue.
2. **Given** a track is clicked, **When** the `MusicService` resolves the stream link, **Then** cache the stream URL and metadata in Dexie.js (TTL 30 days) but **never** cache the audio blob.

---

### User Story 3 - Auto-Queue & Playlist Management (Priority: P1)

As a listener, I want the queue to seamlessly add similar songs once my track starts, and I want to organize my favorites into local playlists.

**Why this priority**: Continuous playback and user library retention.

**Independent Test**: Start a single track. Open the Queue panel (`Q` on desktop). Verify 10 similar tracks (same artist/album) were automatically appended. Drag and drop tracks to reorder them. Add the current track to a newly created playlist.

**Acceptance Scenarios**:
1. **Given** a track begins playback, **When** the queue is empty or nearly empty, **Then** automatically fetch and append 10 similar songs. Lazy load 10 more when 3 tracks remain.
2. **Given** the user creates playlists, **When** adding tracks, **Then** store up to 50 playlists (max 100 tracks each) in IndexedDB, auto-generating mosaic covers from track artwork.

---

### User Story 4 - VibeTune Visualizer & Player Controls (Priority: P2)

As a visual user, I want to see dynamic visualizers (VibeTune) and synchronized lyrics in the fullscreen player, while utilizing sleep timers and crossfade for smooth listening.

**Why this priority**: Defines the premium "glassmorphic" aesthetic and rich media experience.

**Independent Test**: Maximize the player (`F` on desktop). Verify full glassmorphism (blurred album art). Open lyrics (`L`) and verify line-by-line synced scrolling. Check settings to change VibeTune from "Waveform" to "Aurora" and observe GSAP timeline changes driven by the Web Audio API.

**Acceptance Scenarios**:
1. **Given** the player is active, **When** VibeTune is enabled, **Then** render the selected visualization using audio frequency data from the AnalyserNode.
2. **Given** the user configures playback, **When** a track ends, **Then** apply a fixed 3-second crossfade to the next track.
3. **Given** a sleep timer is set (e.g., 15 mins), **When** the timer expires, **Then** gracefully fade out and pause playback.

---

### User Story 5 - Celestial Pet System (Priority: P2)

As a user, I want a persistent celestial pet character floating on my screen that reacts to my music and greets me by name.

**Why this priority**: Enhances emotional connection and differentiates the UI.

**Independent Test**: Enable the Pet in settings. Drag the pet to the corner. Restart the app. Verify the pet appears in the saved position, says "Hi [username]!", and starts dancing matching the tempo when a song plays.

**Acceptance Scenarios**:
1. **Given** the pet is active, **When** the music tempo changes, **Then** adjust the Rive animation speed accordingly.
2. **Given** the app is idle, **When** a long duration passes, **Then** transition the pet to a sleeping animation state.

---

### User Story 6 - Notifications & Direct File Download (Priority: P2)

As a cross-platform user, I want background OS notifications with playback controls, and the ability to download MP3 files directly to my device storage.

**Why this priority**: Fulfills platform-specific expectations (Android media sessions, physical file ownership).

**Independent Test**: On Android, start a track, lock the screen. Verify the lockscreen displays animated album art and playback controls. Unlock the phone, click "Download" on a track. Verify the file saves to the native device Downloads folder (not IndexedDB) and an in-app glassmorphic toast confirms success.

**Acceptance Scenarios**:
1. **Given** music is playing in the background, **When** the native Android Media Session is active, **Then** display track metadata, controls, and animated art via Capacitor Local Notifications.
2. **Given** a download is triggered, **When** the `downloadUrl` is fetched, **Then** write the file to the native OS filesystem.

---

### Edge Cases

- **Rate Limit Saturation**: If the Token Bucket limit is severely exhausted, delay background recommendation fetches and throttle queue loads, showing a subtle system toast.
- **Stream Link Expiry (HTTP 403)**: If a cached CDN URL expires, silently catch the 403, request a fresh stream URL from the Service Layer, and seamlessly resume playback.
- **No Internet**: Display an in-app toast, disable search/streaming. (Note: Since audio is not cached, playback halts).
- **Data Saver Mode**: When enabled, force 96kbps streams, disable VibeTune, lower image quality, and minimize recommendation API calls.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST implement a strict **Service Layer Abstraction** (`MusicService`), preventing any UI component from importing JioSaavn-specific API logic directly.
- **FR-002**: The system MUST implement a Token Bucket rate limiter (20 burst, 2/sec refill, 10 queue) using a subtle search bar shimmer for feedback.
- **FR-003**: The system MUST cache metadata, lyrics, and stream URLs in **Dexie.js** using LRU eviction, but MUST NOT cache audio blobs or enable offline playback from the database.
- **FR-004**: The system MUST allow downloading tracks as physical files to the native device filesystem via standard web downloads or Capacitor Filesystem plugins.
- **FR-005**: The system MUST render a hybrid recommendation engine, fetching seed data from APIs and ranking it locally based on session history and saved preferences.
- **FR-006**: The system MUST execute the Pet System state machine, reacting to `playerStore` tempo/playback states and rendering via Rive or canvas sprites.
- **FR-007**: The system MUST provide VibeTune combination visualizers (GSAP/CSS) reading frequency data from Web Audio API `AnalyserNode`.
- **FR-008**: The system MUST present a dual notification architecture: Capacitor OS background media controls, and Framer Motion glassmorphic foreground in-app toasts.
- **FR-009**: The system MUST ensure all HTML entities from the API are safely decoded in the adapter layer without using `dangerouslySetInnerHTML`.
- **FR-010**: The system MUST implement fixed 3-second crossfades, EQ presets, and playback speed controls within the AudioContext.

### Key Entities

- **UserPreferences**: Local config in Dexie.js. `username`, `quality` (High/Med/Low/Auto), `languages`, `artists`, `petEnabled`, `vibeTuneEnabled`.
- **Track**: Normalized data model. `id`, `title`, `artists`, `albumId`, `duration`, `streamUrls` (Quality map), `downloadUrls`, `imageUrl`, `hasLyrics`.
- **Playlist**: Local user collection. `id`, `name`, `tracks`, `dateUpdated`, `coverImage` (Auto-generated mosaic).
- **SessionHistory**: In-memory ephemeral queue of the last 20 played tracks, used exclusively for the recommendation engine.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Application adheres strictly to the dark-only Moon theme using CSS custom properties with absolutely zero hardcoded colors.
- **SC-002**: Auto-queue seamlessly fetches and loads 10 similar tracks with zero user intervention before the current track finishes.
- **SC-003**: The architecture allows full integration of VibeTune and Pet Systems as lazy-loaded chunks, avoiding initial bundle bloat.
- **SC-004**: Music streaming gracefully downgrades or recovers from HTTP 403 CDN errors within 500ms transparently to the user.

---

## Assumptions

- **CapacitorJS Plugins**: Capacitor FileSystem, Local Notifications, and Share plugins function correctly for target Android 10+ devices.
- **CSS Backdrop Blur**: `backdrop-filter: blur(12px)` is supported on target WebViews (fallback standard opacity otherwise).
- **Web Audio API**: Real-time frequency analysis and BiquadFilterNodes (for EQ) are non-blocking on mobile processors.
