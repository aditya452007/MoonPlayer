# Animation & Motion Audit

## Overall Assessment: 5/10

The codebase has extensive and well-structured Framer Motion usage, but suffers from empty exit animations, layout-triggering CSS, missing microinteractions, and no premium motion signatures.

---

## 1. CSS Keyframe Animations

**File:** `src/styles/animations.css`

### Current Inventory (7 keyframes)

| Name | Lines | Properties | Performance |
|------|-------|------------|-------------|
| `shimmer` | 7-14 | `background-position` | Compositor-good |
| `pulse` | 17-23 | `opacity` | Compositor-good |
| `fadeIn` | 27-33 | `opacity` | Compositor-good |
| `fadeOut` | 36-43 | `opacity` | Compositor-good |
| `slideUp` | 46-55 | `opacity`, `translateY` | Compositor-good |
| `slideDown` | 58-66 | `opacity`, `translateY` | Compositor-good |
| `scaleIn` | 69-77 | `opacity`, `scale` | Compositor-good |
| `spin` | 81-87 | `rotate` | Compositor-good |
| `equalizerBar1/2/3` | 91-103 | **`height`** | **Layout-triggering!** |
| `moonGlow` | 107-113 | `box-shadow` | Paint-triggering |

### Critical Issues
- **Equalizer bars animate `height`** (layout trigger) — use `transform: scaleY()` instead
- **`moonGlow` animates `box-shadow`** (paint trigger) — use `filter: drop-shadow()` or `opacity` on a glow pseudo-element
- **No custom easing in keyframes** — all default to `ease-in-out`
- **Equalizer keyframes are dead code** — `NowPlayingBars` uses canvas instead

---

## 2. Framer Motion Usage

### Distribution (30+ components)
- `m.div` / `m.button` — 30 files
- `AnimatePresence` — 15 files (49 usages)
- `LazyMotion` / `domMax` / `domMin` — `App.jsx:179` only
- `useAnimation` — `usePressAnimation.js:1` (DEAD CODE — never imported)
- `Reorder` — Library, QueuePanel
- `useMotionValue` — PetContainer only

### REDUNDANCY: CSS + Framer Motion Fight Each Other

```jsx
// SolidPanel.jsx:24 — framer-motion whileTap
whileTap={{ scale: 0.97 }}

// SolidPanel.css:38 — CSS :active
.solid-panel--interactive:active { transform: scale(0.98); }
```

Same pattern in Button.jsx (0.95 vs 0.98) and IconButton.jsx (0.92 vs 0.92 — this one matches).

**Fix:** Choose one source of truth. Use Framer Motion for interactive, CSS for passive states.

### Dead Code: `usePressAnimation.js`
19 lines, never imported anywhere. Either integrate into Button/IconButton or remove.

### Animation Timing Constants
`src/core/utils/animation.js` — well-organized but 15+ components hardcode values instead of importing from here.

---

## 3. Microinteractions

### What Exists
| Interaction | Coverage | Notes |
|-------------|----------|-------|
| Press/tap scale | Good | Button, IconButton, SolidPanel, Controls, etc. |
| Hover background | Good | TrackCard, SongRow, SolidPanel, etc. |
| Hover image scale | Partial | TrackCard only |
| Drag-to-dismiss | Good | MiniPlayer, FullscreenPlayer |
| Drag reorder | Good | QueuePanel, Library |
| Like animation | Good | AnimatedLikeButton (scale keyframes) |
| Toast entry | Good | Spring with layout animation |

### What's Missing
- **Ripple effect** on buttons/cards (standard Material Design)
- **`whileHover`** — no spring-enhanced hover (CSS-only)
- **Focus ring animations** — instant outline, no transition
- **Progress/volume bar animations** — basic `width` transition only
- **Staggered list reveals** — `AnimatedList` used in only 6/12+ list views
- **Swipe gesture feedback** — haptic only, no visual follow-through

### Transition Anti-Pattern: `transition: all`
- `SmartReplaceDialog.css:59` — `transition: all var(--duration-fast)`
- `FullscreenPlayer.css:215,241,407,432` — 4 instances of `transition: all`
- `ChartCarousel.css:36,97,175` — 3 instances

Forces the browser to diff every animatable property on every frame.

---

## 4. Easing Functions — Grade: B+

### CSS Easing Tokens (index.css:189-203)
```
--ease-out-quart:  cubic-bezier(0.25, 1, 0.5, 1)
--ease-out-cubic:  cubic-bezier(0, 0, 0.2, 1)
--ease-out-back:   cubic-bezier(0.34, 1.56, 0.64, 1)
--ease-default:    cubic-bezier(0.4, 0, 0.2, 1)
--ease-spring:     cubic-bezier(0.34, 1.56, 0.64, 1)  // same as out-back!
```

### Issues
- `--ease-spring` and `--ease-out-back` are identical curves
- `EASE.DEFAULT` in JS (`animation.js:22`) is `'ease'` (browser default) — inconsistent with CSS `--ease-default`
- Only 3 places use true framer-motion spring physics (damping/stiffness/mass)

---

## 5. Page Transitions — Grade: C

### Problem: Exit Animations NEVER Play
`src/components/layout/PageTransition/PageTransition.jsx` defines an `exit` variant:
```js
out: { opacity: 0, y: -10 }
```
But neither `PageTransition` nor `<Routes>` wraps in `<AnimatePresence>`. Navigation instantly unmounts the old page while fading in the new one — jarring jump effect.

### Only opacity + y offset
No scale, no blur, no shared layout, no crossfade. Extremely basic.

---

## 6. Reduced Motion — Grade: A

**Best-in-class implementation.** Four layers:
1. CSS `@media (prefers-reduced-motion: reduce)` — `index.css:441-450`
2. Framer Motion code-splitting — `App.jsx:179` (`domMin` vs `domMax`)
3. Per-component conditional rendering — 4 consistent patterns
4. Infinite animation loop avoidance — `NowPlayingBars.jsx:27` skips real-time rendering

---

## 7. Performance Issues

### Paint-Triggering CSS Transitions
- `TrackCard.css:7` — background-color, box-shadow
- `SolidPanel.css:19-22` — background-color, border-color, box-shadow
- `Button.css:10` — background-color, border-color, box-shadow
- `FullscreenPlayer.css:215,241,407,432` — transition: all

### Missing `will-change` Hints
Zero `will-change` properties anywhere in the codebase.

### Animation Concurrency Issues
TrackCard hover animates: background-color (paint) + transform (compositor) + box-shadow (paint) + filter (paint) + opacity (compositor) = 5 properties simultaneously.

---

## 8. Missing Premium Motion Features

| Feature | Where | Why |
|---------|-------|-----|
| **Cover art rotation** | FullscreenPlayer, MiniPlayer, BottomPlaybar | #1 missing premium visual |
| **Waveform progress bar** | SeekBar component | Animated frequency on seek bar |
| **Staggered list reveals** | All list views (6/12+ missing) | Makes content feel alive |
| **Shared element transitions** | Route transitions, album→track | Hero animation between card and player |
| **Swipe gesture animations** | TrackRow, SongRow | Animated swipe-to-queue |
| **Volume bar animation** | Slider | Animated fill, spring release |
| **Queue item entrance** | QueuePanel | Slide-in when track added |
| **Page exit animation** | All routes | Exit never fires (no AnimatePresence) |
| **Ripple effect** | Button, IconButton | Standard tactile feedback |
| **Ambient particle system** | FullscreenPlayer | Dust/stars during playback |
