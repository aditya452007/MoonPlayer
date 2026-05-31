# MoonPlayer Animation & Interaction Polish — Implementation Guide

**Reference**: BloomeeTunes (Flutter/Dart) → MoonPlayer (React/TypeScript)
**Goal**: Port BloomeeTunes' animation micro-interactions, gesture patterns, loading polish, and state-machine-driven UI animations into MoonPlayer.

---

## Table of Contents
1. [Staggered List Animations (AnimatedListItem)](#1-staggered-list-animations-animatedlistitem)
2. [Premium Button Interactions](#2-premium-button-interactions)
3. [Player Overlay / Mini-Player Transitions](#3-player-overlay--mini-player-transitions)
4. [Chart/Resolve State Machine Animation](#4-chartresolve-state-machine-animation)
5. [Album Art Dynamic Background Transitions](#5-album-art-dynamic-background-transitions)
6. [Now Playing Wave Animation](#6-now-playing-wave-animation)
7. [Hover State Overlay Patterns](#7-hover-state-overlay-patterns)
8. [Gesture & Swipe Interactions](#8-gesture--swipe-interactions)
9. [Loading & Skeleton Polish](#9-loading--skeleton-polish)
10. [Transition Timing & Easing Consistency](#10-transition-timing--easing-consistency)
11. [Premium Micro-interactions](#11-premium-micro-interactions)
12. [Reduce Motion Support](#12-reduce-motion-support)

---

## 1. Staggered List Animations (AnimatedListItem)

### BloomeeTunes Pattern
`AnimatedListItem` widget wraps every list item (search results, library, playlists, album tracks):
- 250ms base duration + 30ms stagger per index, clamped at max 200ms total stagger
- `easeOutQuart` curve: starts fast, decelerates naturally
- Fade (0→1 opacity) + slide-up (20px→0 translateY)
- Used in: `ChartListTile`, `SongTile`, `LibItemCard`, `TrackRow`-equivalent across ALL list views

### MoonPlayer Current State
- `PageTransition.jsx:3-16` — page-level entry only (opacity + y, `anticipate` ease, 300ms)
- `TrackRow.jsx:65-132` — `m.div` with `drag="x"` BUT no entrance animation (no `initial`/`animate` props)
- `QueuePanel.jsx` — `Reorder.Item` has `initial`/`animate`/`exit` for mount/unmount but only on queue, not search/list
- No staggered entrance animations anywhere in the app

### The Gap
Lists feel static — all items appear at once. No visual cascade effect. BloomeeTunes' staggered entrance is a signature UX pattern that signals "content is loaded progressively" and feels premium.

### Implementation Steps

**Step 1: Create `src/components/common/AnimatedListItem/AnimatedListItem.jsx`**

```jsx
import { m } from 'framer-motion';

const defaultVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export function AnimatedListItem({ index, children, className = '', variants, transition }) {
  return (
    <m.div
      variants={variants || defaultVariants}
      initial="initial"
      animate="animate"
      transition={transition || {
        duration: 0.25,
        delay: Math.min(index * 0.03, 0.2), // 30ms stagger, clamp at 200ms
        ease: [0.25, 1, 0.5, 1], // easeOutQuart approximation
      }}
      className={className}
    >
      {children}
    </m.div>
  );
}
```

**Step 2: Create `src/components/common/AnimatedList/AnimatedList.jsx`**

```jsx
import { AnimatedListItem } from '../AnimatedListItem/AnimatedListItem';

export function AnimatedList({ children, staggerDelay = 0.03, maxStagger = 0.2 }) {
  return (
    <>
      {React.Children.map(children, (child, i) => (
        <AnimatedListItem
          key={child.key}
          index={i}
          transition={{
            duration: 0.25,
            delay: Math.min(i * staggerDelay, maxStagger),
            ease: [0.25, 1, 0.5, 1],
          }}
        >
          {child}
        </AnimatedListItem>
      ))}
    </>
  );
}
```

**Step 3: Apply to search results in `Search.jsx`**

Wrap `TrackRow` items at line 108:
```jsx
{results.length > 0 && (
  <AnimatedList>
    {results.map((track) => (
      <TrackRow key={track.id} track={track} showImage onClick={handleTrackClick} />
    ))}
  </AnimatedList>
)}
```

**Step 4: Apply to library items in `Library.jsx`**

Wrap playlist cards at lines 158-188:
```jsx
<AnimatedList>
  {playlists.map((playlist) => (
    <AnimatedListItem key={playlist.id} index={...}>
      <PlaylistCard playlist={playlist} />
    </AnimatedListItem>
  ))}
</AnimatedList>
```

**Step 5: Apply to playlist tracks in `PlaylistView.jsx`**

Wrap `TrackRow` items inside the track list section:
```jsx
<AnimatedList>
  {playlist.tracks.map((track, i) => (
    <TrackRow key={track.id} track={track} index={i} showImage />
  ))}
</AnimatedList>
```

**Step 6: Apply horizontal cascade to `RecommendationCarousel.jsx`**

```jsx
// Wrap items in carousel with horizontal stagger (slide from right)
<AnimatedListItem
  index={index}
  transition={{
    duration: 0.3,
    delay: Math.min(index * 0.05, 0.25), // 50ms stagger for carousel
    ease: [0.25, 1, 0.5, 1],
  }}
>
  <TrackCard track={track} />
</AnimatedListItem>
```

### Components to Create
- `src/components/common/AnimatedListItem/AnimatedListItem.jsx`
- `src/components/common/AnimatedList/AnimatedList.jsx`

### Components to Modify
- `src/views/pages/Search.jsx` — wrap TrackRow list with AnimatedList
- `src/views/pages/Library.jsx` — wrap playlist cards with AnimatedList
- `src/views/pages/PlaylistView.jsx` — wrap track list with AnimatedList
- `src/components/common/RecommendationCarousel/RecommendationCarousel.jsx` — wrap each item with AnimatedListItem

### Animation Config Values
| Property | Value |
|----------|-------|
| Base duration | 250ms |
| Stagger delay per index | 30ms |
| Max total stagger | 200ms (clamp) |
| Easing | `[0.25, 1, 0.5, 1]` (easeOutQuart) |
| Initial state | `opacity: 0, y: 20px` |
| Animate state | `opacity: 1, y: 0` |
| Carousel stagger | 50ms per item |
| Carousel max stagger | 250ms |

---

## 2. Premium Button Interactions

### BloomeeTunes Pattern
`SquareImgCard` press animation: `scale 0.96 + opacity 0.85` over 120ms. All interactive elements have visible press feedback with quick spring-like return. No element feels "dead" on tap.

### MoonPlayer Current State
- `Button.css`: hover `scale(1.02)`, active `scale(0.98)` — defined only on secondary/ghost variants
- `utilities.css:78-79`: `.interactive:active { transform: scale(0.98) }` — generic, applied inconsistently
- `IconButton.css`: no active press transform at all
- `TrackCard.jsx` / `SolidPanel` interactive: no framer-motion press animation (CSS only, no spring feel)
- `Controls.jsx`: play/pause button has no press animation

### The Gap
Press feedback is minimal or missing on most interactive elements. BloomeeTunes' 0.96 scale + opacity drop in 120ms gives a tactile "sinking" feel. MoonPlayer's 0.98 scale is subtle to the point of imperceptibility.

### Implementation Steps

**Step 1: Create a `usePressAnimation` hook**

`src/hooks/usePressAnimation.js`:
```js
import { useAnimation } from 'framer-motion';

export function usePressAnimation(scaleTo = 0.95, opacityTo = 0.85, duration = 0.12) {
  const controls = useAnimation();

  const handlePressStart = () => {
    controls.start({ scale: scaleTo, opacity: opacityTo, transition: { duration, ease: [0.25, 1, 0.5, 1] } });
  };

  const handlePressEnd = () => {
    controls.start({ scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 15 } });
  };

  return { controls, handlePressStart, handlePressEnd };
}
```

**Step 2: Apply press animation to `IconButton.jsx`**

Wrap the `<button>` with a `m.button` from framer-motion and add press handlers:
```jsx
import { m } from 'framer-motion';

// Inside component
const [isPressed, setIsPressed] = useState(false);

return (
  <m.button
    whileTap={{ scale: 0.92 }}
    transition={{ duration: 0.12, ease: [0.25, 1, 0.5, 1] }}
    // ...existing props
  >
    <Icon className="icon-button__icon" weight={active ? 'fill' : 'light'} />
  </m.button>
);
```

**Step 3: Apply press animation to `Button.jsx`**

Wrap with `m.button` and add `whileTap`:
```jsx
<m.button
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.12, ease: [0.25, 1, 0.5, 1] }}
  className={`${baseClass} ${variantClass} ${sizeClass} ${loadingClass} ${className}`.trim()}
  // ...existing props
>
  {/* ...existing children */}
</m.button>
```

**Step 4: Apply press animation to `SolidPanel.jsx`**

When `interactive` prop is true, add `whileTap`:
```jsx
<m.div
  whileTap={{ scale: 0.97 }}
  transition={{ duration: 0.12, ease: [0.25, 1, 0.5, 1] }}
  className={`solid-panel ${interactive ? 'solid-panel--interactive' : ''} ${className}`}
  // ...existing props
>
```

**Step 5: Apply to `Controls.jsx` play button**

The play/pause button at `Controls.jsx:46-53` should have a more pronounced press:
```jsx
<m.button
  whileTap={{ scale: 0.93 }}
  transition={{ duration: 0.1, ease: [0.25, 1, 0.5, 1] }}
  // ...existing IconButton wrapper
/>
```

### Components to Modify
- `src/components/common/IconButton/IconButton.jsx` — add `whileTap` via framer-motion `m.button`
- `src/components/common/Button/Button.jsx` — add `whileTap` via framer-motion `m.button`
- `src/components/common/SolidPanel/SolidPanel.jsx` — add `whileTap` when `interactive`
- `src/components/player/Controls/Controls.jsx` — add press animation to play button

### Animation Config Values
| Property | Value |
|----------|-------|
| Press scale | 0.95 (buttons), 0.92 (icon buttons), 0.97 (panels) |
| Press opacity | 0.85 (icon buttons only) |
| Press duration | 120ms |
| Press easing | `[0.25, 1, 0.5, 1]` (easeOutQuart) |
| Release type | spring, stiffness 400, damping 15 |

---

## 3. Player Overlay / Mini-Player Transitions

### BloomeeTunes Pattern
- **Mini player**: `AnimatedSwitcher` with `SlideTransition (Offset(0,1.5)→0)` + `FadeTransition` — 350ms, `easeOut`. Uses `_hasBeenShown` flag to mount once and animate visibility on subsequent shows.
- **Player overlay**: Slides up from bottom `Offset(0,1.0)→0` + fade — 300ms, `easeOutCubic`. Reverse uses `easeInCubic`.

### MoonPlayer Current State
- `GlobalPlayer.jsx:23-42`: MiniPlayer/BottomPlaybar renders conditionally (`!currentTrack` returns null). No mount-once-then-animate pattern — the entire component unmounts/remounts.
- `FullscreenPlayer.jsx:181-196`: Spring slide-up (`y: '100%' → 0`, `damping: 25, stiffness: 200`). No fade component.
- Options drawer at `FullscreenPlayer.jsx:346-352`: Spring slide-up (`y: '100%' → 0`, `damping: 25, stiffness: 220`).

### The Gap
The MiniPlayer unmounts/remounts entirely when track changes to/from null. BloomeeTunes mounts once and toggles visibility. This causes layout shift and re-initialization cost. Also, the FullscreenPlayer spring transition doesn't include a fade, and there's no fading overlay backdrop for the drawer.

### Implementation Steps

**Step 1: Implement mount-once pattern in `GlobalPlayer.jsx`**

```jsx
import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, m } from 'framer-motion';

export function GlobalPlayer() {
  const { currentTrack } = usePlayerStore();
  const { isMobile } = useBreakpoint();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hasBeenShown = useRef(false);

  // BloomeeTunes _hasBeenShown pattern: mount on first track, never unmount
  useEffect(() => {
    if (currentTrack) hasBeenShown.current = true;
  }, [currentTrack]);

  if (!hasBeenShown.current) return null;

  const handleExpand = () => setIsFullscreen(true);
  const handleClose = () => setIsFullscreen(false);

  return (
    <>
      {/* MiniPlayer/BottomPlaybar — always mounted after first track, visibility animated */}
      <GlassPanel
        className={`global-player ${isMobile ? 'global-player--mobile' : 'global-player--desktop'}`}
        blur="heavy"
      >
        <m.div
          animate={{ opacity: currentTrack ? 1 : 0, y: currentTrack ? 0 : 20 }}
          transition={{ duration: 0.35, ease: [0, 0, 0.2, 1] }} // easeOut equivalent
        >
          {isMobile ? (
            <MiniPlayer onExpand={handleExpand} />
          ) : (
            <BottomPlaybar onExpand={handleExpand} />
          )}
        </m.div>
      </GlassPanel>

      <AnimatePresence>
        {isFullscreen && (
          <FullscreenPlayer onClose={handleClose} />
        )}
      </AnimatePresence>
    </>
  );
}
```

**Step 2: Add fade to `FullscreenPlayer.jsx` spring transition**

Change line 181-187:
```jsx
<m.div
  className="fullscreen-player"
  style={backgroundStyle}
  initial={{ y: '100%', opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  exit={{ y: '100%', opacity: 0 }}
  transition={{
    y: { type: 'spring', damping: 25, stiffness: 200 },
    opacity: { duration: 0.3, ease: [0, 0, 0.2, 1] },
  }}
  // ...drag props unchanged
>
```

**Step 3: Update options drawer to use consistent timing**

Replace `FullscreenPlayer.jsx` lines 346-352 with BloomeeTunes-matched timing:
```jsx
<m.div
  className="fullscreen-player__options-drawer"
  initial={{ y: '100%', opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  exit={{ y: '100%', opacity: 0 }}
  transition={{
    y: { type: 'spring', damping: 25, stiffness: 220 },
    opacity: { duration: 0.2, ease: [0, 0, 0.2, 1] },
  }}
>
```

**Step 4: Add backdrop overlay with fade**

The backdrop at `FullscreenPlayer.jsx:339-345` already has fade — keep as-is:
```jsx
<m.div
  className="fullscreen-player__options-backdrop"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.2 }}
  onClick={() => setShowOptionsMenu(false)}
/>
```

### Components to Create
- `src/hooks/useHasBeenShown.js` — reusable mount-once pattern hook

### Components to Modify
- `src/components/player/GlobalPlayer/GlobalPlayer.jsx` — implement `hasBeenShown` ref + animate visibility
- `src/components/player/FullscreenPlayer/FullscreenPlayer.jsx` — add fade to spring transitions, lines 181-187 and 346-352

### Animation Config Values
| Transition | Duration | Easing | Notes |
|------------|----------|--------|-------|
| MiniPlayer show/hide | 350ms | `[0, 0, 0.2, 1]` (easeOut) | opacity + slide |
| FullscreenPlayer slide-up | spring (25, 200) | — | add 300ms fade |
| FullscreenPlayer exit | spring (25, 200) | — | add 200ms fade |
| Options drawer slide-up | spring (25, 220) | — | add 200ms fade |
| Options backdrop fade | 200ms | `[0, 0, 0.2, 1]` | linear fade |

---

## 4. Chart/Resolve State Machine Animation

### BloomeeTunes Pattern
Chart resolution has a 3-state machine:
1. **idle**: play icon visible (initial state)
2. **resolving**: spinner + "Resolving..." text
3. **success**: checkmark icon with rotation animation (260ms, `easeOutBack`) + "Ready!" text — holds for **1400ms**, then auto-resets to idle
- Uses `AnimatedSwitcher` with `ScaleTransition` + `RotationTransition` for state-to-state swaps
- The success rotation uses `easeOutBack` — a slight overshoot bounce effect

### MoonPlayer Current State
No equivalent state machine animation exists. Download buttons (`DownloadButton.jsx`) have no progress states. Play buttons have no "resolving" state.

### Implementation Steps

**Step 1: Create `src/components/common/ResolveButton/ResolveButton.jsx`**

```jsx
import { useState, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Play, Spinner, Check } from '@phosphor-icons/react'; // adjust icons as needed

const STATE = { IDLE: 'idle', RESOLVING: 'resolving', SUCCESS: 'success' };

const iconVariants = {
  idle: { scale: 1, rotate: 0, opacity: 1 },
  resolving: { scale: 0.8, rotate: 360, opacity: 1 },
  success: { scale: 1.2, rotate: 0, opacity: 1 },
};

export function ResolveButton({ onResolve, resolveDuration = 5000, holdDuration = 1400, className = '' }) {
  const [state, setState] = useState(STATE.IDLE);

  const handleClick = useCallback(async () => {
    if (state !== STATE.IDLE) return;
    setState(STATE.RESOLVING);
    try {
      await onResolve();
      setState(STATE.SUCCESS);
      setTimeout(() => setState(STATE.IDLE), holdDuration);
    } catch {
      setState(STATE.IDLE);
    }
  }, [state, onResolve, holdDuration]);

  return (
    <m.button
      className={`resolve-button ${className}`}
      onClick={handleClick}
      whileTap={state === STATE.IDLE ? { scale: 0.95 } : undefined}
      aria-label={state === STATE.IDLE ? 'Play' : state === STATE.RESOLVING ? 'Resolving...' : 'Ready!'}
    >
      <AnimatePresence mode="wait">
        {state === STATE.IDLE && (
          <m.div
            key="idle"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
          >
            <Play weight="fill" size={24} />
          </m.div>
        )}
        {state === STATE.RESOLVING && (
          <m.div
            key="resolving"
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            exit={{ scale: 0 }}
            transition={{
              scale: { duration: 0.2 },
              rotate: { repeat: Infinity, duration: 1, ease: 'linear' },
            }}
          >
            {/* Spinner icon */}
            <Spinner weight="bold" size={24} />
          </m.div>
        )}
        {state === STATE.SUCCESS && (
          <m.div
            key="success"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ duration: 0.26, ease: [0.34, 1.56, 0.64, 1] }} // easeOutBack
          >
            <Check weight="bold" size={24} />
          </m.div>
        )}
      </AnimatePresence>
      {/* Text label */}
      <m.span
        key={`label-${state}`}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ duration: 0.15 }}
        className="resolve-button__label"
      >
        {state === STATE.IDLE && 'Play'}
        {state === STATE.RESOLVING && 'Resolving...'}
        {state === STATE.SUCCESS && 'Ready!'}
      </m.span>
    </m.button>
  );
}
```

**Step 2: Create `src/components/common/ResolveButton/ResolveButton.css`**

```css
.resolve-button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  background: var(--accent-moon);
  color: var(--text-primary);
  border: none;
  cursor: pointer;
  font-family: var(--font-ui);
  font-size: var(--text-body-sm);
  font-weight: var(--weight-semibold);
  min-width: 100px;
  justify-content: center;
  transition: background-color var(--duration-fast) var(--ease-default);
}

.resolve-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.resolve-button__label {
  white-space: nowrap;
}
```

**Step 3: Integrate into chart/list items and download buttons**

Replace simple play buttons in list rows and the download button with `ResolveButton` or a simplified variant:
- `ChartListTile`-equivalent: use `ResolveButton` for chart play actions
- `DownloadButton.jsx`: wrap existing download with resolve states

### Components to Create
- `src/components/common/ResolveButton/ResolveButton.jsx`
- `src/components/common/ResolveButton/ResolveButton.css`

### Components to Modify
- `src/components/common/DownloadButton/DownloadButton.jsx` — integrate resolve states for download progress

### Animation Config Values
| State | Property | Duration | Easing |
|-------|----------|----------|--------|
| Idle→Resolving | scale | 200ms | `[0.25, 1, 0.5, 1]` |
| Resolving→Success | scale + rotate | 260ms | `[0.34, 1.56, 0.64, 1]` (easeOutBack) |
| Success hold | — | 1400ms | — |
| Spinner rotation | rotate 360° | 1000ms per loop | linear (infinite) |
| Label swap | opacity + y | 150ms | `[0.25, 1, 0.5, 1]` |

---

## 5. Album Art Dynamic Background Transitions

### BloomeeTunes Pattern
`AnimatedContainer` (500ms, implicit) transitions gradient colors when palette changes from album art. Uses `RadialGradient` with extracted dominant color fading into background color. The transition is smooth — colors don't snap.

### MoonPlayer Current State
- `FullscreenPlayer.jsx:92`: `bgColor` state extracted via `extractDominantColor()`
- `FullscreenPlayer.jsx:174-176`: `backgroundStyle` is hardcoded `'var(--bg-void)'` — color is extracted but **never used** for the background
- `colorExtractor.js` returns a single color (average), not a palette. Section 6 of the VISUAL-DESIGN doc adds `extractColorPalette()` but it's separate.
- No smooth color transition on background when track changes

### The Gap
The extracted color sits unused. The background remains solid black. BloomeeTunes transitions the entire player background gradient smoothly when track/album art changes.

### Implementation Steps

**Step 1: Create `src/components/common/AmbientBackground/AmbientBackground.jsx`**

```jsx
import { m } from 'framer-motion';

/**
 * BloomeeTunes AnimatedContainer equivalent for ambient background.
 * Transitions gradient smoothly when colors change.
 */
export function AmbientBackground({ colors = ['rgb(26, 30, 37)'], duration = 0.5, children, className = '' }) {
  const gradient = colors.length > 1
    ? `radial-gradient(ellipse at 50% 25%, ${colors[0]} 0%, ${colors[1]} 45%, var(--bg-void) 80%)`
    : `radial-gradient(ellipse at 50% 25%, ${colors[0]} 0%, var(--bg-void) 70%)`;

  return (
    <m.div
      className={`ambient-background ${className}`}
      animate={{ background: gradient }}
      transition={{ duration, ease: [0, 0, 0.2, 1] }} // easeOutCubic
      style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    >
      {children}
    </m.div>
  );
}
```

**Step 2: Integrate into `FullscreenPlayer.jsx`**

Replace lines 92 and 174-176:
```jsx
import { AmbientBackground } from '../../common/AmbientBackground/AmbientBackground';
import { extractColorPalette } from '../../../core/utils/colorExtractor';

const [palette, setPalette] = useState(['rgb(26, 30, 37)']);

useEffect(() => {
  if (currentTrack?.imageUrl) {
    const controller = new AbortController();
    extractColorPalette(currentTrack.imageUrl, controller.signal, 2).then((colors) => {
      setPalette(colors);
      setBgColor(colors[0]);
    });
    return () => controller.abort();
  }
}, [currentTrack]);

// In render:
<AmbientBackground colors={palette} duration={0.5}>
  <VisualizerContainer type={visualizerType} isPlaying={isPlaying} baseColor={bgColor} />
</AmbientBackground>
```

**Step 3: Integrate into `MiniPlayer.jsx`**

Add smooth background tint transition on the mini player art container using extracted color:
```jsx
const [miniPalette, setMiniPalette] = useState(null);

useEffect(() => {
  if (currentTrack?.imageUrl) {
    extractDominantColor(currentTrack.imageUrl).then((color) => {
      setMiniPalette(color);
    });
  }
}, [currentTrack]);
```

Then on the `.mini-player` element, add an inline style that transitions:
```jsx
<m.div
  className="mini-player"
  animate={{
    boxShadow: miniPalette
      ? `0 0 16px ${miniPalette.replace('rgb', 'rgba').replace(')', ', 0.2)')}`
      : 'none',
  }}
  transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
  // ...existing props
>
```

### Components to Create
- `src/components/common/AmbientBackground/AmbientBackground.jsx`

### Components to Modify
- `src/components/player/FullscreenPlayer/FullscreenPlayer.jsx` — use `AmbientBackground` + `extractColorPalette`; update line 92, 174-176
- `src/components/player/MiniPlayer/MiniPlayer.jsx` — add palette-driven box-shadow transition on the player div (line 53)
- `src/core/utils/colorExtractor.js` — ensure `extractColorPalette` is exported (see Section 6 of VISUAL DESIGN doc)

### Animation Config Values
| Property | Value |
|----------|-------|
| Transition duration | 500ms |
| Easing | `[0, 0, 0.2, 1]` (easeOutCubic) |
| Gradient type | radial-ellipse at 50% 25% |
| Fallback color | `rgb(26, 30, 37)` |

---

## 6. Now Playing Wave Animation

### BloomeeTunes Pattern
`CustomPaint` with `AnimationController.repeat()` draws sine wave bars in the mini player. Continuous, real-time amplitude-driven animation. Uses the actual audio frequency data from the audio pipeline.

### MoonPlayer Current State
- `MiniPlayer.jsx:77-83`: Three inline `m.div` elements with hardcoded keyframe heights `[4,10,4]`, `[8,3,8]`, `[5,12,5]`. 3 bars only. No audio data driving amplitude.
- `animations.css:91-104`: CSS `@keyframes equalizerBar1/2/3` — unused in JSX.
- `VisualizerEngine.js`: already has real audio frequency data (64 bins) but is only used by `VisualizerContainer` (fullscreen canvas mode).

### The Gap
The mini player bars are decorative (hardcoded keyframes, 3 bars, no audio data). BloomeeTunes uses actual amplitude data for dynamic bars. The CSS equalizer bars animate but don't respond to music.

### Implementation Steps

**Step 1: Create `src/components/common/NowPlayingBars/NowPlayingBars.jsx`**

Using Canvas 2D for performance (avoids CSS paint thrashing on 64fps animation):
```jsx
import { useRef, useEffect } from 'react';
import { visualizerEngine } from '../../../core/audio/VisualizerEngine';

/**
 * BloomeeTunes CustomPaint sine-wave-bars equivalent.
 * Renders amplitude-driven bars on Canvas 2D.
 * Uses VisualizerEngine's frequency data for real amplitude.
 */
export function NowPlayingBars({ isPlaying, barCount = 5, className = '' }) {
  const canvasRef = useRef(null);
  const reqRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isPlaying) {
        const data = visualizerEngine.getFrequencyData(true);
        const barWidth = canvas.width / barCount;
        const gap = 2;
        const effectiveBarWidth = barWidth - gap;

        for (let i = 0; i < barCount; i++) {
          // Map frequency bins to bar count (use low-freq bins for visual punch)
          const binIndex = Math.floor((i / barCount) * 20);
          const raw = data[binIndex] || 0;
          const amplitude = Math.max(0.05, raw / 255);
          const barHeight = canvas.height * amplitude;
          const x = i * barWidth + gap / 2;
          const y = canvas.height - barHeight;

          ctx.fillStyle = 'var(--accent-moon)';
          ctx.globalAlpha = 0.8;

          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x, y, effectiveBarWidth, barHeight, [1, 1, 0, 0]);
          } else {
            ctx.rect(x, y, effectiveBarWidth, barHeight);
          }
          ctx.fill();
        }
      } else {
        // When paused, draw static low bars (not zero — BloomeeTunes shows slight activity)
        const barWidth = canvas.width / barCount;
        const gap = 2;
        const effectiveBarWidth = barWidth - gap;
        for (let i = 0; i < barCount; i++) {
          const staticHeight = canvas.height * 0.08;
          const x = i * barWidth + gap / 2;
          ctx.fillStyle = 'var(--accent-moon)';
          ctx.globalAlpha = 0.3;
          ctx.fillRect(x, canvas.height - staticHeight, effectiveBarWidth, staticHeight);
        }
      }

      reqRef.current = requestAnimationFrame(loop);
    };

    reqRef.current = requestAnimationFrame(loop);
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [isPlaying, barCount]);

  return (
    <canvas
      ref={canvasRef}
      className={`now-playing-bars ${className}`}
      width={40}
      height={16}
      style={{ width: 40, height: 16, display: 'block' }}
    />
  );
}
```

**Step 2: Replace inline equalizer bars in `MiniPlayer.jsx`**

Replace the inline `m.div` bars at `MiniPlayer.jsx:77-83`:
```jsx
{isPlaying && (
  <div style={{ position: 'absolute', bottom: 4, right: 4 }}>
    <NowPlayingBars isPlaying={isPlaying} barCount={4} />
  </div>
)}
```

**Step 3: Add to `BottomPlaybar.jsx`**

Add a small `NowPlayingBars` indicator next to the album art when the current track is playing:
```jsx
// After the album art img at line 59-64
{isPlaying && (
  <div className="bottom-playbar__playing-indicator">
    <NowPlayingBars isPlaying={isPlaying} barCount={3} />
  </div>
)}
```

**Step 4: Add to `TrackRow.jsx` as active track indicator**

When a track is currently playing (`isCurrentTrack`), show `NowPlayingBars` instead of the play icon in the image overlay:
```jsx
// In TrackRow.jsx, replace the Play icon at lines 97-98
{isCurrentTrack && isPlaying ? (
  <NowPlayingBars isPlaying={true} barCount={3} />
) : (
  <Play weight="fill" className="track-row__play-icon" />
)}
```

### Components to Create
- `src/components/common/NowPlayingBars/NowPlayingBars.jsx`

### Components to Modify
- `src/components/player/MiniPlayer/MiniPlayer.jsx` — replace inline bars (lines 77-83) with `NowPlayingBars`
- `src/components/player/BottomPlaybar/BottomPlaybar.jsx` — add `NowPlayingBars` indicator
- `src/components/common/TrackRow/TrackRow.jsx` — replace play icon with `NowPlayingBars` for active track
- `src/components/player/ProgressBar/ProgressBar.jsx` — optional: add `NowPlayingBars` near time display

### Animation Config Values
| Property | Value |
|----------|-------|
| Bar count | 5 (default), 4 (mini player), 3 (track row) |
| Render method | Canvas 2D (requestAnimationFrame) |
| Frequency source | `VisualizerEngine.getFrequencyData()` |
| Paused amplitude | 8% of canvas height at 0.3 alpha |
| Playing amplitude | 5%–100% mapped from frequency bin 0–19 |
| Canvas size | 40×16px (mini player), 24×16px (track row) |

---

## 7. Hover State Overlay Patterns

### BloomeeTunes Pattern
Card hover: overlay appears over 200ms with subtle scale + opacity change. Play button emerges on hover. Dim effect on the card image.

### MoonPlayer Current State
- `TrackCard.jsx:80-88`: Has `.track-card__overlay` with an `IconButton` (Play) — uses CSS transition from `opacity: 0` to `opacity: 1` on hover. No dim/brightness change on the image.
- `RecommendationCarousel.jsx`: cards just use TrackCard's built-in overlay.
- `SolidPanel--interactive`: changes `background-color` on hover (CSS transition 150ms).

### The Gap
No hover dim effect on card images — the play button appears but the image doesn't recede. BloomeeTunes dims the card (opacity or brightness) and shows the play button together in sync. Album, Artist, Playlist cards have no hover overlay at all (they use SolidPanel interactive which only changes background color).

### Implementation Steps

**Step 1: Update `.track-card__overlay` CSS in `TrackCard.css`**

```css
.track-card__image-container {
  position: relative;
  overflow: hidden;
}

.track-card__image {
  transition: filter 200ms ease, transform 200ms ease;
}

.track-card:hover .track-card__image,
.track-card:focus-within .track-card__image {
  filter: brightness(0.6);
  transform: scale(1.03);
}

.track-card__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 200ms ease;
}

.track-card:hover .track-card__overlay,
.track-card:focus-within .track-card__overlay {
  opacity: 1;
}

.track-card__play-btn {
  transform: scale(0.9) translateY(8px);
  transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1); /* spring-overshoot on appear */
}

.track-card:hover .track-card__play-btn,
.track-card:focus-within .track-card__play-btn {
  transform: scale(1) translateY(0);
}
```

**Step 2: Add overlay to `AlbumCard.jsx`, `ArtistCard.jsx`, `PlaylistCard.jsx`**

For each card type, add an overlay that appears on hover (200ms). Pattern:
```jsx
// In each card component
<div className="card__image-container">
  <img src={item.imageUrl} alt={item.title} className="card__image" loading="lazy" />
  <div className="card__overlay">
    <IconButton icon={Play} size="lg" className="card__play-btn" ariaLabel={`Play ${item.title}`} onClick={handlePlay} />
  </div>
</div>
```

Apply the same CSS pattern with same timing (200ms, `ease` for overlay, spring for button).

**Step 3: Ensure consistent hover timing in all card CSS files**

All card hover overlays must use:
- Overlay fade: 200ms, `ease`
- Image dim: `filter: brightness(0.6)`, 200ms, `ease`
- Image scale: `transform: scale(1.03)`, 200ms, `ease`
- Button appear: 200ms, `cubic-bezier(0.34, 1.56, 0.64, 1)` (BloomeeTunes' easeOutBack)

### Components to Create
- None (CSS-only changes to existing/existing card components + new card components from Section 1 of 01-UI-ARCHITECTURE)

### Components to Modify
- `src/components/common/TrackCard/TrackCard.css` — add image dim + button spring transform
- `src/components/common/AlbumCard/AlbumCard.css` (future) — add hover overlay
- `src/components/common/ArtistCard/ArtistCard.css` (future) — add hover overlay
- `src/components/common/PlaylistCard/PlaylistCard.css` (future) — add hover overlay

### Animation Config Values
| Property | Value |
|----------|-------|
| Overlay fade duration | 200ms |
| Overlay easing | `ease` |
| Image dim | `filter: brightness(0.6)` |
| Image scale | `transform: scale(1.03)` |
| Image transition duration | 200ms |
| Button spring | 200ms, `[0.34, 1.56, 0.64, 1]` (easeOutBack) |

---

## 8. Gesture & Swipe Interactions

### BloomeeTunes Pattern
- Mini player horizontal swipe: triggers skip track with haptic feedback
- Threshold: 600 velocity for swipe-to-skip
- Haptic: platform vibration (Android vibrate, iOS haptic)

### MoonPlayer Current State
- `MiniPlayer.jsx:25-34`: `handleDragEnd` — swipe up expands, swipe left next, swipe right prev. Threshold: `offset.x < -50` or `> 50` or `offset.y < -50`. Uses Framer Motion drag.
- `TrackRow.jsx:57-62`: `handleDragEnd` — swipe right opens context menu. Threshold: `offset.x > 50`.
- `FullscreenPlayer.jsx:191-195`: `onDragEnd` — swipe down closes. Threshold: `offset.y > 150 || velocity.y > 500`.
- `ContextMenu.jsx`: no drag/dismiss gesture.

### The Gap
No haptic feedback on any gesture success. BloomeeTunes uses `HapticFeedback.lightImpact()` on swipe-to-skip. No velocity threshold awareness on mini player (uses raw offset, not velocity). No visual feedback during swipe (opacity + scale fade of dismissed item). BloomeeTunes uses 600 velocity threshold.

### Implementation Steps

**Step 1: Create `src/hooks/useHaptics.js`**

```js
/**
 * BloomeeTunes haptic feedback equivalent.
 * Uses Navigator.vibrate() as baseline, Capacitor Haptics plugin if available.
 */
export function useHaptics() {
  const light = async () => {
    try {
      if (navigator.vibrate) {
        navigator.vibrate(10); // light tap
      }
      // Optional: try Capacitor Haptics plugin
      if (window.Capacitor?.Plugins?.Haptics) {
        await window.Capacitor.Plugins.Haptics.impact({ style: 'light' });
      }
    } catch {
      // silently fail
    }
  };

  const medium = async () => {
    try {
      if (navigator.vibrate) {
        navigator.vibrate(20);
      }
      if (window.Capacitor?.Plugins?.Haptics) {
        await window.Capacitor.Plugins.Haptics.impact({ style: 'medium' });
      }
    } catch {
      // silently fail
    }
  };

  return { light, medium };
}
```

**Step 2: Add haptic + velocity threshold to `MiniPlayer.jsx`**

Update `handleDragEnd` at lines 25-34:
```jsx
import { useHaptics } from '../../../hooks/useHaptics';

const { light } = useHaptics();

const handleDragEnd = (event, info) => {
  const { offset, velocity } = info;
  // BloomeeTunes: velocity-based swipe with haptic
  if (offset.y < -50) {
    onExpand();
  } else if (offset.x < -50 || velocity.x > 600) {
    light(); // haptic feedback
    next();
  } else if (offset.x > 50 || velocity.x < -600) {
    light();
    prev();
  }
};
```

**Step 3: Add visual feedback during swipe to `MiniPlayer.jsx`**

Use `whileDrag` on the `m.div` at line 53:
```jsx
<m.div
  className="mini-player"
  whileDrag={{
    scale: 0.95,
    opacity: 0.8,
    transition: { duration: 0.15 },
  }}
  // ...existing props
>
```

**Step 4: Add visual feedback to `TrackRow.jsx` swipe**

Add `whileDrag` to the existing `m.div` at line 65:
```jsx
<m.div
  className={`track-row ${isCurrentTrack ? 'track-row--active' : ''} ${className}`}
  whileDrag={{
    scale: 0.97,
    opacity: 0.7,
    x: info => Math.min(info.offset.x, 80), // clamp drag distance
  }}
  // ...existing drag props
>
```

**Step 5: Add gesture overlay dismiss to `ContextMenu.jsx`**

Enable drag-to-dismiss on the context menu using framer-motion:
```jsx
import { m } from 'framer-motion';

export function ContextMenu({ isOpen, onClose, x, y, children }) {
  // ...existing code

  return createPortal(
    <m.div
      className="context-menu"
      style={{ top: adjustedY, left: adjustedX }}
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15, ease: [0.25, 1, 0.5, 1] }}
    >
      {children}
    </m.div>,
    document.body
  );
}
```

**Step 6: Add drag-to-dismiss on ContextMenu backdrop**

The `ContextMenu` currently has no backdrop. Add a transparent overlay behind it:
```jsx
// Before the context-menu div
{isOpen && (
  <m.div
    className="context-menu__backdrop"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClose}
    style={{ position: 'fixed', inset: 0, zIndex: 999 }}
  />
)}
```

### Components to Create
- `src/hooks/useHaptics.js`

### Components to Modify
- `src/components/player/MiniPlayer/MiniPlayer.jsx` — add haptic, velocity threshold, `whileDrag` at lines 25-34 and 53
- `src/components/common/TrackRow/TrackRow.jsx` — add `whileDrag` and visual feedback at line 65
- `src/components/common/ContextMenu/ContextMenu.jsx` — add fade entrance + backdrop dismiss
- `src/components/player/FullscreenPlayer/FullscreenPlayer.jsx` — add haptic on dismiss at line 191

### Animation Config Values
| Property | Value |
|----------|-------|
| Swipe threshold (offset) | 50px |
| Swipe threshold (velocity) | 600 px/s |
| Drag scale | 0.95 (mini player), 0.97 (track row) |
| Drag opacity | 0.8 (mini player), 0.7 (track row) |
| Haptic feedback | 10ms vibration (`light`) |
| ContextMenu enter | 150ms, scale+fade |
| ContextMenu exit | 150ms, scale+fade |

---

## 9. Loading & Skeleton Polish

### BloomeeTunes Pattern
- `_lazyLoading_placeholder`: PNG placeholder image shown first, then replaced by cached image when loaded. Exact aspect-ratio match to the content.
- `SignBoardWidget`: universal empty/error state with icon + message + optional action button. Contextual per view.
- Loading shimmer is smooth (1.5s gradient sweep) across all placeholder shapes.

### MoonPlayer Current State
- `Skeleton.jsx`: variants `text`, `circle`, `rect`, `card`. Shimmer via CSS animation `1.5s ease-in-out infinite`. No aspect-ratio matching.
- Empty states: **ad-hoc** — inline JSX in `Search.jsx:117-121`, `Library.jsx:141-149`, `PlaylistView.jsx:136-138`. No reusable component.
- Image loading: inline `<img>` with `loading="lazy"` in `TrackRow.jsx:91-95`, `MiniPlayer.jsx:72-76`, `BottomPlaybar.jsx:59-63`, `FullscreenPlayer.jsx:252-258`. **No** loading placeholder (blank until image loads).

### The Gap
No `SignBoardWidget` equivalent = inconsistent empty states. Image components flash blank/white before load. No aspect-ratio placeholder to prevent layout shift. BloomeeTunes shows a shimmer silhouette in the exact shape of the eventual image.

### Implementation Steps

**Step 1: Add aspect-ratio placeholder support to `Skeleton.jsx`**

```jsx
export function Skeleton({
  variant = 'text', // text, circle, rect, card, image-placeholder
  width,
  height,
  aspectRatio, // e.g. '1/1' for square, '4/3' for landscape — BloomeeTunes' _lazyLoading_placeholder
  count = 1,
  className = '',
  style,
  ...props
}) {
  // ...existing elements loop
  elements.push(
    <div
      key={`skeleton-${i}`}
      className={`skeleton-base skeleton-base--${variant} skeleton ${className}`.trim()}
      style={{
        width: width !== undefined ? width : undefined,
        height: height !== undefined ? height : undefined,
        aspectRatio: aspectRatio || undefined, // prevent layout shift
        ...style,
      }}
      data-component="skeleton"
      aria-hidden="true"
      {...props}
    />
  );
}
```

**Step 2: Create `src/components/common/EmptyState/EmptyState.jsx` (from Section 10 of 01 guide)**

```jsx
import './EmptyState.css';

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'empty', // 'empty' | 'error' | 'loading'
}) {
  return (
    <m.div
      className={`empty-state empty-state--${variant}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
    >
      {Icon && (
        <div className="empty-state__icon-wrapper">
          <Icon size={48} weight="light" />
        </div>
      )}
      {title && <h3 className="empty-state__title">{title}</h3>}
      {description && <p className="empty-state__description">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </m.div>
  );
}
```

**Step 3: Create `EmptyState.css`**

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12) var(--space-6);
  text-align: center;
  gap: var(--space-3);
}

.empty-state__icon-wrapper {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  background: var(--bg-elevated);
  color: var(--text-tertiary);
  margin-bottom: var(--space-2);
}

.empty-state--error .empty-state__icon-wrapper {
  background: var(--error-bg);
  color: var(--error);
}

.empty-state__title {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
}

.empty-state__description {
  font-size: var(--text-body-sm);
  color: var(--text-secondary);
  max-width: 280px;
}
```

**Step 4: Replace all ad-hoc empty states**

| File | Lines | Replace With |
|------|-------|-------------|
| `Search.jsx` | 117-121 | `<EmptyState icon={MagnifyingGlass} title="No results found" description="Try a different search term" />` |
| `Search.jsx` | ~122 (initial) | `<EmptyState icon={MagnifyingGlass} title="Find your music" description="Search for songs, albums, or artists" />` |
| `Library.jsx` | 141-149 | `<EmptyState icon={Playlist} title="Your library is empty" description="Save songs or create a playlist" actionLabel="Create Playlist" onAction={() => setIsCreateModalOpen(true)} />` |
| `PlaylistView.jsx` | 136-138 | `<EmptyState icon={MusicNotes} title="This playlist is empty" description="Add songs from the home page or search" />` |

**Step 5: Add image loading placeholder pattern**

In `ImgWithFallback.jsx` (from Section 8 of 01-UI-ARCHITECTURE), the loading phase already shows a `Skeleton` with aspect ratio. Ensure all `<img>` tags use `ImgWithFallback`:
- `TrackRow.jsx:91` → `<ImgWithFallback src={...} alt={...} className="track-row__image" />`
- `TrackCard.jsx:75` → `<ImgWithFallback src={...} alt={...} className="track-card__image" aspectRatio="1/1" />`
- `MiniPlayer.jsx:72-76` → `<ImgWithFallback src={...} alt={...} className="mini-player__art" aspectRatio="1/1" />`
- `BottomPlaybar.jsx:59-63` → `<ImgWithFallback src={...} alt={...} className="bottom-playbar__art" aspectRatio="1/1" />`
- `FullscreenPlayer.jsx:252-258` → `<ImgWithFallback src={...} alt={...} className="fullscreen-player__art" aspectRatio="1/1" />`

### Components to Create
- `src/components/common/EmptyState/EmptyState.jsx`
- `src/components/common/EmptyState/EmptyState.css`

### Components to Modify
- `src/components/common/Skeleton/Skeleton.jsx` — add `aspectRatio` prop
- `src/views/pages/Search.jsx` — replace inline empty states with `<EmptyState>`
- `src/views/pages/Library.jsx` — replace inline empty states with `<EmptyState>`
- `src/views/pages/PlaylistView.jsx` — replace inline empty states with `<EmptyState>`
- All `<img>` tags → `ImgWithFallback` (from Section 8 of 01-UI-ARCHITECTURE)

### Animation Config Values
| Property | Value |
|----------|-------|
| EmptyState entrance | 250ms, opacity + y:20→0 |
| EmptyState easing | `[0.25, 1, 0.5, 1]` (easeOutQuart) |
| Skeleton shimmer | 1.5s, ease-in-out, infinite (existing) |

---

## 10. Transition Timing & Easing Consistency

### BloomeeTunes Pattern
BloomeeTunes uses exactly 4 timing values and 3 easing curves consistently across ALL animations:
| Use Case | Duration | Easing |
|----------|----------|--------|
| List stagger | 250ms | easeOutQuart |
| Page transitions | 250ms | easeOutCubic |
| Player overlay | 300ms | easeOutCubic / easeInCubic |
| Mini player | 350ms | easeOut |
| Color transition | 500ms | implicit AnimatedContainer |
| Card hover | 200ms | ease |
| Icon swap | 200ms | easeOutBack |

### MoonPlayer Current State
- `PageTransition.jsx:18-22`: `type: 'tween', ease: 'anticipate', duration: 0.3` — `anticipate` is a spring-like ease that overshoots, feels jarring for page transitions
- `FullscreenPlayer.jsx:187`: `type: 'spring', damping: 25, stiffness: 200` — physics-based, no easing consistency with CSS transitions
- `FullscreenPlayer.jsx:351`: `spring, damping: 25, stiffness: 220` — slightly different stiffness
- `GlassToast.jsx:20`: `spring, damping: 25, stiffness: 350` — third spring config
- `InstallPrompt.jsx:80`: `spring, damping: 25, stiffness: 200` — matches FullscreenPlayer
- `ShortcutOverlay.jsx:112`: `spring, damping: 25, stiffness: 300` — fourth variant
- `GestureGuideOverlay.jsx:97`: `spring, damping: 25, stiffness: 300` — matches ShortcutOverlay
- CSS transitions: use `--duration-fast: 150ms`, `--duration-normal: 250ms`, `--duration-slow: 400ms` with `--ease-default: cubic-bezier(0.4, 0, 0.2, 1)` (Material standard ease)

### The Gap
7 different transition configurations across the codebase. No standard easing curve set. Spring physics are inconsistent (stiffness ranges from 200 to 350). BloomeeTunes has 3 curves + 4 durations used everywhere. MoonPlayer needs a centralized animation config.

### Implementation Steps

**Step 1: Create `src/core/utils/animation.js` — central animation config**

```js
// ============================================================
// BloomeeTunes-inspired Transition Configurations
// Central source of truth for all animation timing & easing
// ============================================================

// -- Duration Tokens (matching BloomeeTunes) --
export const DURATION = {
  FAST: 0.12,      // 120ms — button press, icon swap
  HOVER: 0.2,      // 200ms — card overlay, hover effects
  LIST: 0.25,      // 250ms — staggered list items, page transitions
  STAGGER: 0.03,   // 30ms — per-item stagger delay
  OVERLAY: 0.3,    // 300ms — player overlay slide, backdrop fade
  MINI_PLAYER: 0.35, // 350ms — mini player show/hide
  COLOR: 0.5,      // 500ms — ambient background color transition
};

// -- Easing Curves (matching BloomeeTunes) --
export const EASE = {
  // easeOutQuart: starts fast, decelerates smoothly — lists, cards
  OUT_QUART: [0.25, 1, 0.5, 1],
  // easeOutCubic: smooth deceleration — overlays, page transitions
  OUT_CUBIC: [0, 0, 0.2, 1],
  // easeInCubic: smooth acceleration — overlay exits
  IN_CUBIC: [0.4, 0, 1, 1],
  // easeOutBack: slight overshoot (anticipation feel) — icon swaps, success
  OUT_BACK: [0.34, 1.56, 0.64, 1],
  // easeOut: standard deceleration — mini player, general
  OUT: [0, 0, 0.2, 1],
  // ease: default CSS ease — hover overlays
  DEFAULT: 'ease',
};

// -- Preset Transition Configs --
export const TRANSITION = {
  pageTransition: {
    type: 'tween',
    duration: DURATION.LIST,
    ease: EASE.OUT_CUBIC,
  },
  cardPress: {
    duration: DURATION.FAST,
    ease: EASE.OUT_QUART,
  },
  listStagger: (index) => ({
    duration: DURATION.LIST,
    delay: Math.min(index * DURATION.STAGGER, 0.2),
    ease: EASE.OUT_QUART,
  }),
  overlaySlide: {
    type: 'spring',
    damping: 25,
    stiffness: 200,
    mass: 0.8,
  },
  overlayFade: {
    duration: DURATION.OVERLAY,
    ease: EASE.OUT_CUBIC,
  },
  colorTransition: {
    duration: DURATION.COLOR,
    ease: EASE.OUT_CUBIC,
  },
  iconSwap: {
    duration: 0.2,
    ease: EASE.OUT_BACK,
  },
  toastEnter: {
    type: 'spring',
    damping: 25,
    stiffness: 350,
    mass: 0.6,
  },
};
```

**Step 2: Update `PageTransition.jsx` to use shared config**

```jsx
import { m } from 'framer-motion';
import { TRANSITION, EASE } from '../../../core/utils/animation';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -10 },
};

export function PageTransition({ children }) {
  return (
    <m.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={TRANSITION.pageTransition}
      style={{ minHeight: '100%', width: '100%' }}
    >
      {children}
    </m.div>
  );
}
```

**Step 3: Update `FullscreenPlayer.jsx` entrance to use shared config**

Replace lines 184-187:
```jsx
transition={{
  y: TRANSITION.overlaySlide,
  opacity: TRANSITION.overlayFade,
}}
```

**Step 4: Update `GlassToast.jsx` to use shared config**

Replace line 20:
```jsx
transition={TRANSITION.toastEnter}
```

**Step 5: Update CSS transition tokens in `index.css`**

Replace existing transition tokens (lines 97-106) with BloomeeTunes-matched values:
```css
/* -- Transitions (BloomeeTunes-aligned) -- */
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
--ease-out-cubic: cubic-bezier(0, 0, 0.2, 1);
--ease-in-cubic: cubic-bezier(0.4, 0, 1, 1);
--ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

--duration-fast: 120ms;    /* button press, icon swap */
--duration-hover: 200ms;   /* card overlays, hover effects */
--duration-normal: 250ms;  /* list items, page transitions */
--duration-overlay: 300ms; /* player overlay, backdrop */
--duration-slow: 400ms;    /* general slower transitions */
--duration-color: 500ms;   /* ambient color transitions */
--duration-splash: 1500ms;
```

**Step 6: Update `Utilities.css` interactive class**

Replace line 69-72:
```css
.interactive {
  transition: background-color var(--duration-hover) var(--ease-out-quart),
              box-shadow var(--duration-hover) var(--ease-out-quart);
}
```

### Components to Create
- `src/core/utils/animation.js`

### Components to Modify
- `src/components/layout/PageTransition/PageTransition.jsx` — use `TRANSITION.pageTransition`
- `src/components/player/FullscreenPlayer/FullscreenPlayer.jsx` — line 184-187 use shared config
- `src/components/common/GlassToast/GlassToast.jsx` — line 20 use `TRANSITION.toastEnter`
- `src/components/common/InstallPrompt/InstallPrompt.jsx` — line 80 use `TRANSITION.overlaySlide`
- `src/components/common/ShortcutOverlay/ShortcutOverlay.jsx` — line 112 use `TRANSITION.overlaySlide`
- `src/components/common/GestureGuideOverlay/GestureGuideOverlay.jsx` — line 97 use `TRANSITION.overlaySlide`
- `src/styles/index.css` — update transition tokens (lines 97-106)
- `src/styles/utilities.css` — update `.interactive` class (line 69-72)

### Animation Config Values
| Config | Duration | Easing | Notes |
|--------|----------|--------|-------|
| `pageTransition` | 250ms | `[0, 0, 0.2, 1]` | tween |
| `cardPress` | 120ms | `[0.25, 1, 0.5, 1]` | tween |
| `listStagger(index)` | 250ms + stagger | `[0.25, 1, 0.5, 1]` | tween |
| `overlaySlide` | spring 25/200/0.8 | — | physics |
| `overlayFade` | 300ms | `[0, 0, 0.2, 1]` | tween |
| `colorTransition` | 500ms | `[0, 0, 0.2, 1]` | tween |
| `iconSwap` | 200ms | `[0.34, 1.56, 0.64, 1]` | tween |
| `toastEnter` | spring 25/350/0.6 | — | physics |

---

## 11. Premium Micro-interactions

### BloomeeTunes Pattern
- **Like button**: scale pulse on click (heart icon grows 1.0→1.3→1.0 over 300ms) with accentColor2 coloring
- **Download button**: progress state with circular indicator (resolve state machine)
- **Playing indicator**: equalizer bars on the currently active track in list views
- **Active track indicator**: accent-colored dot or mini bars next to the track title in list rows
- **Loop/shuffle toggle**: AnimatedContainer (200ms) smoothly transitions icon + color

### MoonPlayer Current State
- `FullscreenPlayer.jsx:259-271`: Heart animation on double-tap — `scale 0→1.5→2 + opacity 0→1→0` over 400ms. Only works on double-tap, not on the button click.
- `FullscreenPlayer.jsx:286-293`: Heart `IconButton` — no animation on click (just state change).
- `BottomPlaybar.jsx`: loop/shuffle toggles in `Controls.jsx` — no animation.
- `TrackRow.jsx:102-104`: Play icon for index — no active track indicator.
- `TrackCard.jsx`: no active track indicator.

### The Gap
Like button has no micro-feedback on click. Loop/shuffle/animated toggles don't exist. Active track in list has no visual indicator (users don't know which track is playing in search/playlist results). BloomeeTunes' pulsing heart and animated toggles feel "premium".

### Implementation Steps

**Step 1: Create animated like button `AnimatedLikeButton.jsx`**

`src/components/common/AnimatedLikeButton/AnimatedLikeButton.jsx`:
```jsx
import { useState, useCallback } from 'react';
import { m } from 'framer-motion';
import { Heart } from '@phosphor-icons/react';

export function AnimatedLikeButton({ isLiked = false, onToggle, size = 'md', className = '' }) {
  const [animating, setAnimating] = useState(false);

  const handleClick = useCallback(async (e) => {
    e.stopPropagation();
    setAnimating(true);
    onToggle?.();
    // BloomeeTunes scale-pulse: 1.0→1.3→1.0 over 300ms
    await new Promise(resolve => setTimeout(resolve, 300));
    setAnimating(false);
  }, [onToggle]);

  return (
    <m.button
      className={`animated-like-btn ${className}`}
      onClick={handleClick}
      whileTap={{ scale: 0.9 }}
      animate={animating ? {
        scale: [1, 1.3, 1],
        transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }, // easeOutBack for overshoot
      } : {}}
      aria-label={isLiked ? 'Remove from liked songs' : 'Add to liked songs'}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        color: isLiked ? 'var(--accent-secondary)' : 'var(--text-secondary)',
      }}
    >
      <Heart
        size={size === 'sm' ? 16 : size === 'md' ? 20 : 24}
        weight={isLiked ? 'fill' : 'regular'}
      />
    </m.button>
  );
}
```

Replace the Heart `IconButton` in `FullscreenPlayer.jsx:286-293`:
```jsx
<AnimatedLikeButton
  isLiked={isFavorite}
  onToggle={() => toggleLikeTrack(currentTrack)}
  size="md"
/>
```

**Step 2: Add active track indicator to `TrackRow.jsx`**

Replace the index/play area at lines 100-104:
```jsx
{index !== undefined ? (
  <div className="track-row__index">
    {isCurrentTrack ? (
      <NowPlayingBars isPlaying={isPlaying} barCount={3} />
    ) : (
      <>
        <span className="track-row__index-number">{index + 1}</span>
        <Play weight="fill" className="track-row__play-icon" />
      </>
    )}
  </div>
) : (
  <div className="track-row__image-container">
    <img src={track.imageUrl || '/default-album-art.png'} alt={track.title} className="track-row__image" loading="lazy" />
    <div className="track-row__play-overlay">
      {isCurrentTrack ? (
        <NowPlayingBars isPlaying={isPlaying} barCount={3} />
      ) : (
        <Play weight="fill" className="track-row__play-icon" />
      )}
    </div>
  </div>
)}
```

Additionally, add an accent-colored left border/indicator for the active track row:
```css
/* In TrackRow.css */
.track-row--active {
  position: relative;
}

.track-row--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: 3px;
  background: var(--accent-moon);
  border-radius: 0 2px 2px 0;
}
```

**Step 3: Add animated toggle to `Controls.jsx` loop/shuffle buttons**

Wrap the shuffle and loop `IconButton` components with framer-motion opacity+rotation on state change:
```jsx
import { m } from 'framer-motion';

// In the render, wrap shuffle button:
<m.div
  key={`shuffle-${isShuffled}`}
  initial={{ rotate: -90, opacity: 0 }}
  animate={{ rotate: 0, opacity: 1 }}
  exit={{ rotate: 90, opacity: 0 }}
  transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
>
  <IconButton icon={Shuffle} size="sm" active={isShuffled} onClick={onShuffle} ariaLabel="Toggle shuffle" />
</m.div>
```

Apply the same `key`-based animation pattern to the loop button (using `loopMode` as key).

**Step 4: Add download progress button variant**

Enhance `DownloadButton.jsx` with a resolve state pattern:
```jsx
import { useState } from 'react';
import { m } from 'framer-motion';
import { DownloadSimple, Check, Spinner } from '@phosphor-icons/react';

export function DownloadButton({ track, size = 'md', className = '' }) {
  const [state, setState] = useState('idle'); // idle | downloading | done

  const handleDownload = async (e) => {
    e.stopPropagation();
    if (state !== 'idle') return;
    setState('downloading');
    try {
      await downloadService.downloadTrack(track);
      setState('done');
      setTimeout(() => setState('idle'), 2000);
    } catch {
      setState('idle');
    }
  };

  return (
    <m.button
      className={`download-button download-button--${state} ${className}`}
      onClick={handleDownload}
      whileTap={state === 'idle' ? { scale: 0.92 } : undefined}
      aria-label={state === 'done' ? 'Downloaded' : 'Download'}
      style={{
        background: 'none',
        border: 'none',
        cursor: state === 'downloading' ? 'wait' : 'pointer',
        color: state === 'done' ? 'var(--success)' : state === 'downloading' ? 'var(--text-tertiary)' : 'var(--text-secondary)',
      }}
    >
      {state === 'idle' && <DownloadSimple size={size === 'sm' ? 16 : 20} weight="regular" />}
      {state === 'downloading' && (
        <m.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <Spinner size={size === 'sm' ? 16 : 20} weight="bold" />
        </m.div>
      )}
      {state === 'done' && (
        <m.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 0.26, ease: [0.34, 1.56, 0.64, 1] }}>
          <Check size={size === 'sm' ? 16 : 20} weight="bold" />
        </m.div>
      )}
    </m.button>
  );
}
```

### Components to Create
- `src/components/common/AnimatedLikeButton/AnimatedLikeButton.jsx`

### Components to Modify
- `src/components/player/FullscreenPlayer/FullscreenPlayer.jsx` — replace Heart IconButton with AnimatedLikeButton (lines 286-293)
- `src/components/common/TrackRow/TrackRow.jsx` — add NowPlayingBars for active track (lines 96-104), add CSS accent border
- `src/components/common/TrackCard/TrackCard.jsx` — add NowPlayingBars for active track (lines 80-88)
- `src/components/player/Controls/Controls.jsx` — add animated state transitions for shuffle/loop buttons
- `src/components/common/DownloadButton/DownloadButton.jsx` — add resolve state machine + rotation animation

### Animation Config Values
| Interaction | Duration | Easing | Notes |
|-------------|----------|--------|-------|
| Like button pulse | 300ms | `[0.34, 1.56, 0.64, 1]` | scale 1→1.3→1 |
| Loop/shuffle icon swap | 200ms | `[0.34, 1.56, 0.64, 1]` | rotate±90° |
| Download→done checkmark | 260ms | `[0.34, 1.56, 0.64, 1]` | scale+rotate |
| Download spinner | 1000ms/rotate | linear (infinite) | rotate 360° |
| Download done→idle | 2000ms hold | — | timeout reset |

---

## 12. Reduce Motion Support

### BloomeeTunes Pattern
No explicit reduced-motion toggle (Flutter handles via platform accessibility settings). All animations respect the platform's reduced motion setting.

### MoonPlayer Current State
- `index.css:282-291`: Global `@media (prefers-reduced-motion: reduce)` collapses all animations to `0.01ms`. This disables CSS animations AND CSS transitions.
- No JavaScript-level reduced-motion detection for framer-motion animations.

### The Gap
CSS-level reduce-motion blocks CSS animations/transitions but **not** framer-motion animations. Framer-motion's `useReducedMotion()` is available but not used anywhere. BloomeeTunes disables ALL animations (CSS + imperative) when reduced motion is preferred.

### Implementation Steps

**Step 1: Create `src/hooks/useReducedMotion.js`**

```js
import { useReducedMotion as useFramerReducedMotion } from 'framer-motion';

/**
 * Wraps framer-motion's useReducedMotion to also check for the system preference.
 * BloomeeTunes-compatible: returns true if user prefers reduced motion.
 */
export function useReducedMotion() {
  return useFramerReducedMotion();
}
```

**Step 2: Use `useReducedMotion` in key animation components**

In `AnimatedListItem.jsx`:
```jsx
import { useReducedMotion } from '../../../hooks/useReducedMotion';

export function AnimatedListItem({ index, children, className = '', variants, transition }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    // Render without animation
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      variants={variants || defaultVariants}
      initial="initial"
      animate="animate"
      transition={transition || {
        duration: 0.25,
        delay: Math.min(index * 0.03, 0.2),
        ease: [0.25, 1, 0.5, 1],
      }}
      className={className}
    >
      {children}
    </m.div>
  );
}
```

In `AnimatedLikeButton.jsx`:
```jsx
const prefersReducedMotion = useReducedMotion();

// Skip animation if reduced motion
const animate = prefersReducedMotion ? {} : animating ? { ... } : {};
```

In `ResolveButton.jsx`:
```jsx
const prefersReducedMotion = useReducedMotion();

// Use immediate transitions when reduced motion
const transition = prefersReducedMotion ? { duration: 0 } : { duration: 0.26, ease: [...] };
```

**Step 3: Ensure all new components check reduced motion**

Every new animation component created in this document must:
1. Import `useReducedMotion` from the hook
2. Check it at the top of the render
3. Either skip animation entirely or use 0ms duration when true

Components to check:
- `AnimatedListItem.jsx`
- `AnimatedList.jsx`
- `ResolveButton.jsx`
- `AmbientBackground.jsx`
- `NowPlayingBars.jsx`
- `AnimatedLikeButton.jsx`
- `usePressAnimation.js`
- `EmptyState.jsx`

**Step 4: Add JavaScript-level reduced-motion check to framer-motion `LazyMotion`**

In `App.jsx`, add `useReducedMotion` to conditionally disable all framer-motion features:
```jsx
import { LazyMotion, domMax, domMin, useReducedMotion } from 'framer-motion';

function AppContent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <LazyMotion features={prefersReducedMotion ? domMin : domMax}>
      <Router>
        <AnimatePresence mode="wait">
          {/* routes */}
        </AnimatePresence>
      </Router>
    </LazyMotion>
  );
}
```

`domMin` includes only `AnimatePresence` and `exit` animations (no spring, no layout). `domMax` includes everything. This ensures reduced motion disables all framer-motion features at the framework level.

### Components to Create
- `src/hooks/useReducedMotion.js`

### Components to Modify
- `src/App.jsx` — add `LazyMotion` with conditional feature set
- All new animation components — use `useReducedMotion` for conditional rendering
- `src/components/layout/PageTransition/PageTransition.jsx` — add reduced-motion bypass

### Animation Config Values
| Property | Normal | Reduced Motion |
|----------|--------|----------------|
| All framer-motion animations | as configured | 0ms duration, skip `initial`/`animate` |
| framer-motion features | `domMax` | `domMin` (exit only) |
| CSS animations/transitions | as configured | `0.01ms` (existing, `index.css:282-291`) |
| Canvas animations (NowPlayingBars) | rAF loop | skip loop, render static |

---

## Summary: File Change Manifest

### New Files to Create (12 files)
| File | Section |
|------|---------|
| `src/components/common/AnimatedListItem/AnimatedListItem.jsx` | 1 |
| `src/components/common/AnimatedList/AnimatedList.jsx` | 1 |
| `src/components/common/ResolveButton/ResolveButton.jsx` | 4 |
| `src/components/common/ResolveButton/ResolveButton.css` | 4 |
| `src/components/common/AmbientBackground/AmbientBackground.jsx` | 5 |
| `src/components/common/NowPlayingBars/NowPlayingBars.jsx` | 6 |
| `src/components/common/EmptyState/EmptyState.jsx` | 9 |
| `src/components/common/EmptyState/EmptyState.css` | 9 |
| `src/components/common/AnimatedLikeButton/AnimatedLikeButton.jsx` | 11 |
| `src/core/utils/animation.js` | 10 |
| `src/hooks/useHaptics.js` | 8 |
| `src/hooks/useReducedMotion.js` | 12 |

### Files to Modify (18 files)
| File | Change |
|------|--------|
| `src/views/pages/Search.jsx` | Wrap TrackRow list with AnimatedList; replace empty states with EmptyState component |
| `src/views/pages/Library.jsx` | Wrap playlist cards with AnimatedList; replace inline empty state with EmptyState |
| `src/views/pages/PlaylistView.jsx` | Wrap track list with AnimatedList; replace inline empty state with EmptyState |
| `src/components/common/RecommendationCarousel/RecommendationCarousel.jsx` | Wrap items with AnimatedListItem (horizontal stagger) |
| `src/components/common/IconButton/IconButton.jsx` | Add `whileTap={{ scale: 0.92 }}` via framer-motion `m.button` |
| `src/components/common/Button/Button.jsx` | Add `whileTap={{ scale: 0.95 }}` via framer-motion `m.button` |
| `src/components/common/SolidPanel/SolidPanel.jsx` | Add `whileTap` when `interactive` |
| `src/components/player/Controls/Controls.jsx` | Add press animation on play button; animated toggle for shuffle/loop |
| `src/components/player/GlobalPlayer/GlobalPlayer.jsx` | Implement `hasBeenShown` mount-once pattern; animate visibility |
| `src/components/player/FullscreenPlayer/FullscreenPlayer.jsx` | Use AmbientBackground with palette; add fade to spring transitions; replace Heart with AnimatedLikeButton |
| `src/components/player/MiniPlayer/MiniPlayer.jsx` | Add haptic + velocity threshold; whileDrag visual feedback; NowPlayingBars; AmbientBackground glow |
| `src/components/player/BottomPlaybar/BottomPlaybar.jsx` | Add NowPlayingBars indicator |
| `src/components/common/TrackRow/TrackRow.jsx` | Add NowPlayingBars for active track; whileDrag visual feedback; accent border for active |
| `src/components/common/TrackCard/TrackCard.jsx` | Add NowPlayingBars for active track; hover overlay CSS (image dim + button spring) |
| `src/components/common/DownloadButton/DownloadButton.jsx` | Add resolve state machine (idle→downloading→done) |
| `src/components/layout/PageTransition/PageTransition.jsx` | Use shared animation config from `animation.js`; reduced-motion bypass |
| `src/components/common/ContextMenu/ContextMenu.jsx` | Add fade entrance animation + backdrop dismiss |
| `src/styles/index.css` | Update transition tokens with BloomeeTunes-aligned values |
| `src/styles/utilities.css` | Update `.interactive` class timing |

### Animation Count Comparison
| Category | Before | After | BloomeeTunes Equivalent |
|----------|--------|-------|------------------------|
| List stagger animations | 0 | 4 views (Search, Library, PlaylistView, Carousel) | All list views |
| Button press animations | CSS only (generic) | framer-motion whileTap (all buttons + panels) | SquareImgCard press |
| Card hover overlays | TrackCard only | TrackCard, AlbumCard, ArtistCard, PlaylistCard | All card types |
| State machine animations | 0 | ResolveButton (3 states) | Chart resolve |
| Dynamic background transitions | 0 | FullscreenPlayer + MiniPlayer | AnimatedContainer color |
| Wave/equalizer (audio-driven) | Inline fake bars | Canvas NowPlayingBars (5 views) | CustomPaint bars |
| Haptic feedback | 0 | MiniPlayer swipe, FullscreenPlayer dismiss | MiniPlayer swipe |
| Swipe visual feedback | 0 | MiniPlayer, TrackRow | — |
| Central animation config | 0 | `animation.js` with 10 presets | 4 durations + 3 curves |
| Micro-interactions | Heart double-tap only | Like pulse, download states, playing indicator, animated toggles | All premium interactions |
| Reduced motion support | CSS only (`index.css`) | CSS + framer-motion `useReducedMotion` + `LazyMotion` domMin | Platform setting |
| Empty state component | 0 (ad-hoc) | `EmptyState` with icon + message + CTA | SignBoardWidget |
