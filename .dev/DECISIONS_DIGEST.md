# MoonPlayer -- Architectural Decisions Digest

> **Status**: FINAL (All questions resolved)
> **Source**: `new.md` Q&A (15 sections, 50+ questions answered)
> **Date**: 2026-05-28

This document is the **single source of truth** for every architectural decision. All context files, specs, and development work MUST align with these decisions. No assumptions -- every item here was explicitly answered by the project owner.

---

## 1. Design Identity

### Colors (Moon Theme)
All values MUST be CSS custom properties in `:root`. Zero hardcoded color values anywhere.

| Token | Hex | Usage |
|:---|:---|:---|
| `--bg-void` | `#0B0D10` | Primary background (moonlit night sky) |
| `--bg-surface` | `#12151A` | Card/panel backgrounds (shadowed lunar landscape) |
| `--bg-elevated` | `#1A1E25` | Elevated surfaces, hover states |
| `--bg-overlay` | `#222730` | Modal overlays, dropdowns |
| `--text-primary` | `#D4E0ED` | Primary text (moonlight silver-white) |
| `--text-secondary` | `#8B9DC3` | Secondary text, labels (muted lunar blue-grey) |
| `--text-tertiary` | `#5A6580` | Placeholder text, disabled states |
| `--accent-moon` | `#6BA3D6` | Interactive elements: buttons, active states, progress bars |
| `--accent-glow` | `#E8C87A` | Warm highlights: badges, pet, special elements (crescent gold) |
| `--border-subtle` | `rgba(212, 224, 237, 0.06)` | Subtle moonlight borders |
| `--border-default` | `rgba(212, 224, 237, 0.10)` | Default borders |
| `--border-focus` | `rgba(107, 163, 214, 0.40)` | Focus rings |
| `--glass-bg` | `rgba(18, 21, 26, 0.60)` | Glassmorphism panel background |
| `--glass-border` | `rgba(212, 224, 237, 0.08)` | Glassmorphism border |
| `--error` | `#E5484D` | Error states |
| `--success` | `#46A758` | Success states |
| `--warning` | `#F5A623` | Warning states |

**Design philosophy**: The moon floating in a dark universe. Pure calm. White illumination. No neon. No purple/indigo gradients. Premium, restrained, celestial.

### No Light Mode
Dark-only application. No theme toggle.

### Typography
| Role | Font | Weight Range |
|:---|:---|:---|
| Headings (h1-h6) | Space Grotesk | 500-700 |
| Body / UI text | Inter | 400-600 |
| Monospace (code/data) | JetBrains Mono | 400 |

All font families and sizes as CSS custom properties.

### Icons
Phosphor Icons (Light weight). Tree-shakeable ES module imports.

### Glassmorphism Scope
| Surface | Treatment |
|:---|:---|
| Fullscreen player | Full glassmorphism (blur album art behind panels) |
| Sidebar (desktop) | Glass with `backdrop-filter: blur(12px)` |
| Mini-player | Glass with subtle blur |
| All other surfaces | Solid dark cards with moonlight borders (no backdrop-filter) |

### Glow Effects
Subtle `box-shadow` moonlight glow on focused/active elements. No heavy neon glows.

---

## 2. Animation Stack

**Hybrid approach** -- use the best tool for each job:

| Engine | Use For | Bundle |
|:---|:---|:---|
| **Framer Motion** | Page transitions, route animations, `AnimatePresence` exit animations, gesture-driven interactions (swipe, drag), layout animations | ~30KB lazy |
| **CSS Keyframes/Transitions** | Hover effects, glows, loading states, shimmers, micro-animations, pulse effects | 0KB |
| **GSAP** | VibeTune visualizer timeline sequences, complex coordinated animations, scrubbing | ~25KB lazy |

All animation duration and easing values as CSS custom properties.

---

## 3. Onboarding

### First-Time User (BOTH web and mobile -- identical flow)
```
Splash Screen (1.5s) --> Username Input --> Combined Language+Artist Picker --> Home
```

- **Splash**: Crescent moon logo centered, "MoonPlayer" text below. Logo slides upward, shrinks into header bar as permanent logo.
- **Username**: Text input, default "guest", skippable (sets "guest"). Stored in Dexie.js.
- **Combined Picker**: Single screen with language selection + artist selection. User picks preferred languages and favorite artists.
- **Home**: Populated with recommendation carousels based on chosen artists/languages.

### Returning User (BOTH web and mobile)
```
Quick Splash (0.5s logo flash) --> Home directly
```

### Username Usage
- Home page greeting: "Good evening, [username]"
- Profile section display
- Pet interaction: "Hi [username]!", "What do you want to listen today, [username]?"
- Changeable in Settings
- Default: "guest"

---

## 4. Audio Engine & Playback

### Streaming
- **Streaming only** -- no audio blob caching in IndexedDB
- Cache the API response (stream URLs, metadata) -- NOT the audio data
- When looping: replay from the same cached URL, do not re-call API for same song
- Quality cascade from API: 320 > 192 > 160 > 96 > 48 > 12 kbps

### Quality Selection
- Manual picker in Settings: High (320kbps), Medium (192kbps), Low (96kbps), Auto
- Default: highest available
- User preference passed to `MusicService.getStreamUrl(songId, preferredQuality)`

### Loop Modes
- **Off**: Queue plays once and stops (then auto-play recommendations)
- **One**: Repeat current song indefinitely (from cached URL)
- **Queue**: When queue ends, restart from beginning

### Error Handling
- On song load failure: auto-skip to next song + error toast
- On network loss mid-playback: continue buffered audio, then show offline message toast
- Max 3 retries for ALL error types (uniform)
- Global React error boundary for crashes -> "Something went wrong, tap to reload"

### Additional Audio Features
- **Sleep Timer**: Preset options (15, 30, 45, 60 min, end of current song)
- **Playback Speed**: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x
- **Crossfade**: Fixed 3 seconds between tracks
- **Equalizer**: Preset-only (Normal, Bass Boost, Vocal, Treble, Rock, Pop) via Web Audio API BiquadFilterNodes
- **Lyrics**: Line-level synchronized scrolling (no karaoke/word-level)

---

## 5. Queue System

### Auto-Queue
- When user plays a song: auto-queue 10 similar songs immediately
- "Similar" = same artist or same album (API-dependent)
- Lazy-load 10 more when 3 songs remaining in queue
- When queue is completely empty: auto-play recommendations seamlessly

### Queue Manipulation (all of these)
- Drag-and-drop reorder (desktop)
- Swipe-to-reorder (mobile)
- "Play Next" action
- "Move to Bottom" action
- Remove single track
- Clear entire queue
- Save queue as playlist
- Shuffle queue
- Add entire album/playlist to queue
- NO queue priority feature

---

## 6. VibeTune (Visualizer)

- **Combination visualizer**: Multiple types available:
  - Waveform/equalizer bars
  - Particle system (reacts to frequency/amplitude)
  - Fluid/liquid animation (morphing blobs)
  - Radial pulse (concentric rings from album art)
  - Aurora/Northern lights (flowing color bands)
- User selects preferred type in Settings
- **Visible on ALL screens**:
  - Fullscreen player: full visualization
  - Mini-player: tiny equalizer bars (3-4 bars)
  - System notification: animated album art (GIF/animated WebP with subtle pulse/glow)
- Colors extracted from album art (dominant color extraction library)
- Can be disabled in Settings for battery savings
- Uses Web Audio API AnalyserNode for frequency/amplitude data
- GSAP for timeline-based animation sequences

---

## 7. Recommendation Engine

### Architecture
- **Hybrid**: API seed data + local logic ranking
- NO ML model, simple weighted logic

### API Calls for Seed Data
- `/api/artists/{id}/songs` -- more songs by same artist
- `/api/search/songs?query={language}` -- songs in same language
- `/api/albums/{id}` -- other songs from same album

### Local Ranking Logic
- Input signals: session play history (in-memory, last 20 tracks), liked songs, artist preferences, language preferences
- Weight and randomize for variety

### Placement
- Home page carousels: "Because you listened to [Artist]", "Popular in [Language]"
- Auto-queue: silently append to queue
- Empty state filler: when library is empty
- Mini-player suggestion: small "Next up" chip

### Refresh Strategy
- Automatic refresh on every app open
- Manual pull-to-refresh available anytime
- Cache: session-based TTL (cleared on app close)

---

## 8. Pet System

### Characters
- **Astronaut**: Small space-suited character (matches moon/space theme)
- **Cute animal in space gear**: Cat/dog/rabbit in astronaut helmet
- **Expandable**: Architecture supports adding more characters later

### Technology
- **Rive** (`rive-react`) runtime for animations, OR custom sprite implementation
- Reference: [parastore simulation](https://github.com/intellicia-public/parastore/tree/main/frontend/src/views/simulation)

### Platform Scope
- ALL platforms: desktop, tablet, mobile (smaller on mobile)

### Positioning
- Floating with drag (user can reposition anywhere)
- Remembers position across sessions
- Toggle on/off in Settings (when off: removed from DOM entirely, not just hidden)

### Behaviors (ALL of these)
- Idle animation (breathing, blinking, subtle movement)
- Dancing/vibing when music plays
- Sleeping when app idle for extended time
- React to music tempo (faster on upbeat, slower on ballads)
- Greeting with username ("Hi [username]!")
- React to user actions (wave on like, celebrate on playlist create)
- Clickable: tap for random song suggestion or fun toast
- Different moods based on genre (happy for pop, chill for lo-fi, energetic for EDM)
- Customizable appearance in Settings (pick character type)

### Text Toasts from Pet
- "Hi [username]!"
- "What do you want to listen today, [username]?"
- "Great taste!" (when liking a popular song)
- "Let's vibe!" (when music starts playing)

---

## 9. Notification System

### Dual System
| Layer | Technology | Scope |
|:---|:---|:---|
| System notifications | Capacitor Local Notifications + Media Session API | Background/lockscreen |
| In-app toasts | Custom glassmorphic React components | Foreground events |

### System Notification
- Rich media notification with animated album art (GIF/animated WebP with subtle pulse/glow)
- Playback controls (play/pause, skip, previous)
- Progress indicator

### System Notification Events
- Music playing (interactive media notification)
- Queue running low (2 songs remaining)
- Download complete
- App update available
- Rate limit reached

### In-App Toast Events
- Song changes
- Playlist action confirmations ("Song added to [playlist]")
- Download progress
- Error messages
- Pet messages

### In-App Toast Design
- Glassmorphic: `backdrop-filter: blur()` with moonlight border
- Slide-in animation (Framer Motion)
- Auto-dismiss after 3-4 seconds
- Album art thumbnail on music-related toasts

---

## 10. Library & Playlists

### Auto-Created Playlists
- **"Liked Songs"**: Cannot be deleted. Heart icon on any song adds it here.
- **"Recently Played"**: Last 20 songs. Auto-populated from session play history.

### Playlist Limits
- Max 50 playlists per user
- Max 100 songs per playlist
- Songs can exist in multiple playlists simultaneously
- No nested playlists (no folders)
- Playlists reorderable in library view

### Playlist Features
- Auto-generated cover images (mosaic from first 4 song album arts)
- JioSaavn playlist import (paste URL -> fetch via `/playlists/{id}` -> save locally). Fallback to manual add if import fails.

### Interaction Patterns (ALL of these)
- Long-press (mobile) / Right-click (desktop): context menu with "Add to Playlist", "Play Next", "Add to Queue", "Like", "Share", "Download"
- Swipe action on track card: reveals quick actions
- Three-dot (more) button: opens bottom sheet (mobile) or dropdown (desktop)

---

## 11. Download

- **YES**: Allow downloading songs to device storage (phone Downloads folder / desktop folder)
- Uses `downloadUrl` array from API response (pick quality matching user preference)
- NOT in-app DB / IndexedDB -- saves to native filesystem
- On Android: Capacitor Filesystem plugin
- On web: standard browser download
- Download button visible on track cards and context menus
- This is a FILE DOWNLOAD feature, not in-app caching

---

## 12. Sharing

- **Deep links**: `moonplayer://song/{id}`, `moonplayer://playlist/{id}`
- **Web fallback**: Opens MoonPlayer web version and plays the song
- Playlists shareable too
- Shared links importable (open in web version)
- Native share sheet via Web Share API / Capacitor Share plugin

---

## 13. Caching & Storage

### Database
- **Dexie.js** for IndexedDB (NOT localForage)

### What Gets Cached
- Song metadata (title, artist, album, duration, URLs): TTL 30 days
- Artist metadata: TTL 7 days
- Playlist data: TTL 7 days
- Search results: session-only
- Recommendation pool: session-only (refreshed on app open)
- Lyrics: TTL 30 days
- User preferences (username, quality, language, artists): persistent
- Stream URLs: cached with metadata (NOT audio blobs)

### What Does NOT Get Cached
- Audio data / audio blobs (NO offline audio)
- No audio file storage in IndexedDB

### Eviction Strategy
- **LRU** (Least Recently Used) for metadata cache
- When storage fills up, delete oldest-accessed items first

---

## 14. Layouts (Three-Layout Responsive)

| Breakpoint | Layout | Key Features |
|:---|:---|:---|
| `< 768px` | **Mobile** | Single pane, bottom tabs (4), floating mini-player, swipe gestures |
| `768px - 1024px` | **Tablet** | Sidebar + single column content, bottom tabs removed, mini-player |
| `> 1024px` | **Desktop** | 3-column (250px sidebar + fluid content + 320px collapsible queue), bottom playbar (80px) |

---

## 15. Platform & Distribution

### Web
- **Lightweight PWA**: manifest.json, service worker for asset caching only. No offline music playback. Installable on desktop/mobile Chrome.

### Android
- **APK via GitHub Releases** (not in repo itself)
- Auto-update check on launch (prompt user to download new APK)
- Minimum Android 10 (API 29)
- NO Google Play Store
- CapacitorJS wrapper

### Performance
- **No hard bundle budget** -- quality of app matters more
- Optimize for perceived performance: fast first paint, lazy load everything else
- Code-split: Framer Motion, pet/Rive, VibeTune visualizer all lazy-loaded on demand

---

## 16. API Architecture

### Service Layer (CRITICAL)
- **Full service abstraction**: Components call `MusicService.search(query)`, never see JioSaavn directly
- Service layer is the ONLY place that knows about the external API
- Designed to be swappable: if JioSaavn API dies, only the service layer implementation changes
- Components never import or reference anything JioSaavn-specific

### Rate Limiting
- Token Bucket: 20 burst, 2/sec refill, 10-queue FIFO
- User feedback: **subtle shimmer** animation on search bar (NOT overlay/dialog/blocking)
- Requests queue silently behind the shimmer

### HTML Decoding
- All HTML entities decoded in adapter layer
- No `dangerouslySetInnerHTML` anywhere
- SSR-safe decoding (no DOM dependency)

---

## 17. Settings Page (Comprehensive)

All of these settings exist:
- Streaming quality picker (High/Medium/Low/Auto)
- Username edit
- Language preferences edit
- Artist preferences edit
- Pet on/off + pet character selection
- VibeTune on/off + visualizer type selection
- Crossfade duration display (3s fixed)
- Equalizer presets
- Sleep timer
- Playback speed
- Notification preferences
- Cache management (view size, clear cache)
- Data saver mode (reduces image quality, disables VibeTune, reduces API calls, caps audio to 96kbps)
- Gesture guide / tutorial replay
- About / Credits / Version info

NOT included: export data, import data, reset app

---

## 18. Playback History

- **Session-only in memory** (not persisted to IndexedDB)
- Last 20 tracks in current session
- Used as input for recommendation engine ranking
- Cleared on app close
- NO visible History section/tab in the UI
- "Recently Played" auto-playlist is populated from this during the session

---

## 19. Keyboard Shortcuts (ALL of these)

| Shortcut | Action |
|:---|:---|
| `Space` | Play/Pause |
| `Arrow Right` | Skip forward 10s |
| `Arrow Left` | Skip backward 10s |
| `Arrow Up` | Volume up |
| `Arrow Down` | Volume down |
| `M` | Mute toggle |
| `F` | Toggle fullscreen player |
| `L` | Toggle lyrics panel |
| `R` | Cycle repeat mode |
| `Ctrl+L` | Focus search / Go to Library |
| `Ctrl+N` | Create new playlist |
| `Ctrl+S` | Save/like current song |
| `1-9` | Jump to percentage (1=10%, 5=50%, etc.) |
| `+/-` | Volume up/down (alternative) |
| `Q` | Toggle queue panel |
| `P` | Toggle pet visibility |
| `S` | Toggle shuffle |
| `N` | Next track |
| `Shift+N` | Previous track |

---

## 20. Gestures (Mobile -- Fixed, Not Customizable)

| Gesture | Action |
|:---|:---|
| Swipe Up (mini-player) | Expand to fullscreen player |
| Swipe Down (fullscreen) | Collapse to mini-player |
| Swipe Left (mini-player) | Next track |
| Swipe Right (mini-player) | Previous track |
| Long-press (track card) | Context menu |
| Double-tap (album art) | Like/unlike song |
| Swipe Right (track in list) | Quick actions drawer |

---

## 21. Future Considerations (NOT for v1)

- No social features
- No cross-device sync
- No backend/server
- No light mode
- No A-B loop
- No karaoke word-level lyrics
- No gesture customization
- No queue priority
- No playlist nesting
- No data export/import
