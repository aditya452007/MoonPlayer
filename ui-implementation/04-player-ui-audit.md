# Player UI Audit — Music Player & Playback

## Overall: 4/10

The player has a surprisingly robust feature set (color extraction, visualizers, lyrics sync, queue management, sleep timer, crossfade, equalizer) but the visual presentation and UX consistency are critically lacking.

---

## 1. Global Player / Now Playing Bar

**Files:** `GlobalPlayer.jsx`, `BottomPlaybar.jsx`, `MiniPlayer.jsx`

### Desktop BottomPlaybar

**Layout:** Fixed bottom, 3-column: track info (30%) | controls + progress (flex-1, max 600px) | volume + queue (30%).

**Issues:**
| Issue | Location | Severity |
|-------|----------|----------|
| Album art 56x56px — tiny, no rotation | `BottomPlaybar.css:24-25` | High |
| No "Add to Favorites" heart | Missing | Medium |
| Color extraction runs every mount, no cache | `BottomPlaybar.jsx:39-53` | Medium |
| Very wide layout wastes space on ultrawide | `BottomPlaybar.css:14` | Low |
| No playback speed indicator | Missing | Low |

### Mobile MiniPlayer

**Layout:** Fixed above bottom nav (`bottom: calc(80px + env(safe-area-inset-bottom))`). Horizontal flex: 48x48 art + info + play/pause + next.

**Issues:**
| Issue | Location | Severity |
|-------|----------|----------|
| **No "previous" button** — only play/pause and next | `MiniPlayer.jsx:122-137` | **High** |
| No visual affordance that swipe gestures work | Missing | Medium |
| Glow uses expensive `box-shadow` | `MiniPlayer.jsx:90-93` | Low |

**Positives:** Drag-down opens fullscreen, horizontal swipe for prev/next, "Next up" chip when paused.

---

## 2. Fullscreen Player Overlay

**Files:** `FullscreenPlayer.jsx` (835 lines), `FullscreenPlayer.css` (473 lines), `PlayerOverlayWrapper.jsx`

### Structure
1. `<AmbientBackground>` — dynamic radial gradient from album art
2. `<FullscreenHeader>` — close button, now playing title, lyrics search, options
3. `<FullscreenArtwork>` — large album art or lyrics panel
4. `<FullscreenNowPlaying>` — title, artist, favorite heart, lyrics toggle
5. `<FullscreenControlsSection>` — gradient progress bar + controls + volume
6. `<FullscreenOptionsDrawer>` — playback speed + sleep timer

### CRITICAL ISSUE: Static Album Art
`FullscreenPlayer.jsx:324-329` — album art is a flat `<img>` with no animation, no rotation, no 3D effect, no parallax. This is the #1 visual element missing for premium feel.

**Fix:** Add CSS `@keyframes spin { 100% { transform: rotate(360deg); } }` with `animation-play-state: paused/running` based on playback.

### Other Major Issues
| Issue | Location | Severity |
|-------|----------|----------|
| Art lacks depth/gloss/3D card effect | `FullscreenPlayer.css:41-48` | High |
| Single-column stack on mobile — art only ~40% screen | `FullscreenPlayer.css:30-39` | Medium |
| No gradient overlay on album art (like Spotify) | Missing | Medium |
| Controls auto-hide only in lyrics mode | `FullscreenPlayer.jsx:629` | Medium |
| No "go to album/artist" quick link | Missing | Medium |
| No share button | Missing | Medium |
| No add-to-playlist button | Missing | Medium |
| No equalizer access from fullscreen | Missing | Medium |
| Lyrics search icon too small, undiscoverable | `FullscreenPlayer.jsx:108-113` | Medium |

### Positives
- Dynamic color extraction from album art
- Smooth animated transitions (framer-motion)
- Lyrics overlay with proper scrolling
- Drag-down to dismiss
- Preloading next track for crossfade
- Visualizer integration behind album art
- Animated heart on double-tap
- Playback speed + sleep timer

---

## 3. Queue Panel

**Files:** `QueuePanel.jsx`, `QueuePanel.css`

### Layout
- Desktop: 320px right sidebar, slides in from right
- Mobile: bottom sheet covering 80vh

### Issues
| Issue | Location | Severity |
|-------|----------|----------|
| No "Currently Playing" indicator at top | `QueuePanel.jsx:79` | High |
| Desktop sidebar has no backdrop overlay | `QueuePanel.css:17` | Medium |
| Mobile bottom sheet fixed at 80vh — no resize | `QueuePanel.css:26` | Medium |
| Doesn't show current track (greyed out) at top | Missing | High |
| Track items plain — no album name, duration, index | `QueuePanel.jsx:30-74` | Medium |
| No "save queue as playlist" feature | Missing | Low |

---

## 4. Lyrics Experience — CRITICAL FRAGMENTATION

### Problem: TWO Completely Separate Lyrics Entry Points

1. **In-fullscreen lyrics panel** — toggle within FullscreenPlayer (has controls)
2. **Standalone `/lyrics` page** — `LyricsView.jsx` rendered OUTSIDE ShellLayout

**`App.jsx:130`** — `<Route path={LYRICS_VIEW} ... />` is NOT inside ShellLayout. GlobalPlayer is absent. **User cannot control playback from lyrics view.**

### Issues
| Issue | Location | Severity |
|-------|----------|----------|
| **No playback controls on LyricsView** | `LyricsView.jsx` entire file | **CRITICAL** |
| **No persistent player bar** (outside ShellLayout) | `App.jsx:130` | **CRITICAL** |
| No back button that properly returns | `LyricsView.jsx:65` | High |
| Lyric offset sync hardcoded to 0 | `LyricsView.jsx:79` | Medium |
| No "lyrics not available" fallback CTA | `LyricsPanel.jsx:63-68` | Low |

**Fix:** Move LyricsView inside ShellLayout OR overlay it on top of the fullscreen player (remove the separate route).

---

## 5. Playback Controls

**Files:** `Controls.jsx`, `Controls.css`

### Current Controls
- Shuffle (with active state)
- Previous (SkipBack)
- Play/Pause (large, xl, inverted colors)
- Next (SkipForward)
- Loop (3 states: none → all → one)

### Missing Controls
| Control | Importance | Reason |
|---------|------------|--------|
| **Skip back 15s / Skip forward 15s** | High | Essential for podcasts, long tracks |
| **Play from beginning** (hold previous) | Medium | No restart shortcut |
| **Add to Favorites (heart)** | Medium | Only in fullscreen overlay |
| **Queue position indicator** (e.g., "2 of 15") | Medium | Missing context |

---

## 6. Missing Premium Player Features

| Feature | Status | Notes |
|---------|--------|-------|
| **Rotating album art** | MISSING | Static everywhere |
| **Dynamic UI theming from album art** | PARTIAL | Only gradient progress bar + ambient bg |
| **Auto-hide controls (all modes)** | PARTIAL | Only lyrics mode |
| **Volume slider on mobile fullscreen** | MISSING | Desktop only |
| **Crossfade configuration UI** | PARTIAL | Exists in code, not exposed |
| **Share track** | MISSING | No share button anywhere |
| **Go to Album / Artist** from player | MISSING | No quick links |
| **Playlist management from player** | MISSING | No "Add to Playlist" |
| **Queue persistence** | PARTIAL | Zustand persist middleware |
| **Karaoke-style word highlighting** | MISSING | Line-level only |
| **Visualizer visible around album art** | PARTIAL | Behind art, barely visible |
| **Sleep timer: end of album/playlist** | PARTIAL | Only "end of track" |
| **Queue count badge** on queue icon | MISSING | No indicator |
| **Progress bar thumbnail preview** | MISSING | Not implemented |
