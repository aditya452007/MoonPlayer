# Premium Transformation Roadmap

## New Design Direction

**Target Aesthetic:** Warm, vibrant, tactile, album-driven  
**Reference Points:** Spotify 2026 (dynamic theming), Apple Music (glass depth), Tidal (premium minimalism)  
**Core Principle:** Album art drives the visual identity — color extraction for dynamic UI theming  

---

## Phase 1: Foundation (Weeks 1-2)

### 1.1 New Color Token System

Replace `index.css` tokens. New palette:

```css
/* — Backgrounds — Warm Charcoal Scale */
--bg-void: #09090B;
--bg-surface: #111113;
--bg-elevated: #18181B;
--bg-overlay: #1F1F23;
--bg-highlight: #27272A;
--bg-raised: #2D2D32;

/* — Text — Neutral Warm */
--text-primary: #EDEDEF;
--text-secondary: #A1A1AA;
--text-tertiary: #71717A;
--text-quaternary: #52525B;
--text-inverse: #09090B;
--text-on-accent: #FFFFFF;

/* — Accents — Amber + Rose + Violet */
--accent-primary: #F59E0B;
--accent-primary-hover: #D97706;
--accent-primary-active: #B45309;
--accent-secondary: #F43F5E;
--accent-secondary-hover: #E11D48;
--accent-tertiary: #8B5CF6;
--accent-ghost: #A1A1AA;

/* — Dynamic — Overridden by album art extraction */
--accent-dynamic: var(--accent-primary);
--accent-dynamic-hover: var(--accent-primary-hover);
--accent-dynamic-bg: rgba(245, 158, 11, 0.12);

/* — Gradients — Golden Hour */
--gradient-hero: linear-gradient(135deg, #F59E0B 0%, #F43F5E 100%);
--gradient-play: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
--gradient-surface: linear-gradient(180deg, #1A1A1E 0%, #09090B 100%);
--gradient-glass: linear-gradient(135deg, rgba(245, 158, 11, 0.06) 0%, transparent 50%);
```

### 1.2 New Spacing & Cover Tokens

```css
/* — Covers */
--cover-xs: 48px;
--cover-sm: 120px;
--cover-md: 180px;
--cover-lg: 240px;
--cover-xl: 300px;
--cover-2xl: 360px;
--cover-full: min(80vh, 500px);

/* — Shadows — Expanded */
--shadow-xs: 0 1px 2px rgba(0,0,0,0.3);
--shadow-sm: 0 2px 4px rgba(0,0,0,0.3);
--shadow-md: 0 4px 12px rgba(0,0,0,0.4);
--shadow-lg: 0 8px 24px rgba(0,0,0,0.5);
--shadow-xl: 0 12px 40px rgba(0,0,0,0.6);
--shadow-2xl: 0 20px 60px rgba(0,0,0,0.7);
--shadow-glow: 0 0 24px rgba(245, 158, 11, 0.15);
--shadow-cover: 0 8px 32px rgba(0,0,0,0.5);

/* — Leading / Line Height */
--leading-none: 1;
--leading-tight: 1.15;
--leading-snug: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

### 1.3 Light Theme

```css
[data-theme="light"] {
  --bg-void: #FAFAFA;
  --bg-surface: #F4F4F5;
  --bg-elevated: #E4E4E7;
  --bg-overlay: #D4D4D8;
  --bg-highlight: #A1A1AA;
  --text-primary: #18181B;
  --text-secondary: #52525B;
  --text-tertiary: #71717A;
}
```

### 1.4 Noise/Grain Texture

```css
/* Add to all elevated surfaces */
--grain: url("data:image/svg+xml,..."); /* base64 noise SVG */
```

---

## Phase 2: Layout & Navigation (Weeks 3-4)

### 2.1 Fix Critical Navigation Gaps
- Add Settings gear icon to TopBar right side (visible on all breakpoints)
- Fix `getPageTitle()` with dynamic entity names for all routes
- Show page title + breadcrumb on sub-route back views

### 2.2 Responsive Refinement
- Add collapsed sidebar variant for tablet (481-800px)
- Implement LRU tab caching with max 3 entries
- Fix empty media queries in ShellLayout.css

### 2.3 Sidebar Redesign
- Add collapse toggle button (user-controlled)
- Add tooltips to collapsed icons
- Update deprecated NavLink pattern

---

## Phase 3: Player Transformation (Weeks 5-6)

### 3.1 Rotating Album Art

```css
@keyframes vinyl-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.album-art--playing {
  animation: vinyl-spin 20s linear infinite;
  animation-play-state: running;
}
.album-art--paused {
  animation-play-state: paused;
}
```

### 3.2 Fullscreen Player Overhaul
- Add gradient overlay on album art (top/dark → transparent)
- Auto-hide controls after 3s in ALL modes (not just lyrics)
- Add "Go to Album" / "Go to Artist" quick links
- Add share button
- Add "Add to Playlist" action
- Add volume slider on mobile fullscreen
- Make album art larger: `min(80vh, 500px)` on desktop

### 3.3 Fix Lyrics Fragmentation
- Move LyricsView inside ShellLayout OR
- Make it an overlay on top of FullscreenPlayer instead of a separate route
- Add mini playback controls to lyrics view

### 3.4 Enhanced Player Bar
- Add skip-back-15 / skip-forward-15 buttons
- Add "Add to Favorites" heart on now-playing bar
- Show queue position indicator ("2 of 15")
- Animate waveform on the seek bar

### 3.5 Queue Panel Enhancements
- Show currently playing track at top (greyed out)
- Add album name, duration to queue items
- Add drag-to-reorder affordance
- Add "Save queue as playlist" button
- Add queue count badge

---

## Phase 4: Unified Components (Weeks 7-8)

### 4.1 Create Shared Modal Component
- Replace Library + PlaylistView custom modals
- Support: overlay, backdrop blur, enter/exit animations, portal rendering

### 4.2 Merge TrackRow + SongRow
- `SongRow` gains duration display, NowPlayingBars
- `TrackRow` becomes the single source of truth

### 4.3 Extract Long-Press Hook
- `useContextMenu` hook replaces duplicated code in TrackCard + TrackRow

### 4.4 Unified Backdrop Component
- Extend `<BlurredBackground>` to handle all backdrop variants
- Replace raw div implementations in AlbumView, ArtistView, ChartView

### 4.5 Card Design Blueprint
- Harmonize padding, border-radius, hover effects across all card types
- Add glass/transparency variant
- Use consistent `aspect-ratio: 1/1` for all image containers

### 4.6 EmptyState Component Expansion
- Add `"warning"`, `"success"`, `"info"` variants
- Replace all raw empty states (LocalMusicView, ArtistView, Offline, SongRedirectView)

### 4.7 Button Component Enhancement
- Add `danger` variant (remove `!important` overrides)
- Add `shape` prop (pill, square, circle)

---

## Phase 5: Motion & Animation (Weeks 9-10)

### 5.1 Fix Exit Animations
- Wrap `<Routes>` in `<AnimatePresence>`
- Enable exit animations for route transitions

### 5.2 Enhanced Page Transitions
- Add shared element transitions for album→player
- Add scale/blur to page transitions
- Add staggered list reveals to remaining list views

### 5.3 Performance Optimization
- Replace `transition: all` with targeted properties
- Add `will-change` hints to animated elements
- Fix equalizer bars: `height` → `transform: scaleY()`
- Fix `moonGlow`: `box-shadow` → `filter: drop-shadow()`

### 5.4 New Microinteractions
- Add ripple effect on buttons and cards
- Add `whileHover` spring animations
- Animate focus rings with transition
- Add swipe gesture visual feedback
- Add queue item entrance animation

### 5.5 Premium Motion Signatures
- Vinyl rotation on album art (20s, linear, infinite)
- Waveform progress bar animation
- Gradient morphing on ambient background
- Staggered reveal for search results

---

## Phase 6: Polish (Week 11-12)

### 6.1 Settings Page Expansion
- Add Appearance section: Dark/Light/System toggle
- Add Accent Color picker with swatches
- Add Density toggle (compact/comfortable)
- Add Cover Art Size preference
- Add Reduced Motion toggle

### 6.2 Visual Polish
- Add noise/grain texture overlay to elevated surfaces
- Implement blur-up image loading (skeleton → blur → full)
- Add `ImgWithFallback` to DetailHeader
- Design proper Offline page with EmptyState

### 6.3 Code Quality
- Move all inline styles to CSS files
- Replace hardcoded colors with CSS variables
- Import from `animation.js` constants instead of hardcoding values
- Remove dead code (`usePressAnimation.js`, equalizer CSS keyframes)
- Remove duplicate gradient tokens
- Remove issue-reference comments from CSS

---

## New Grid & Layout System

```css
/* — Grid Presets */
--grid-compact: repeat(auto-fill, minmax(140px, 1fr));
--grid-default: repeat(auto-fill, minmax(160px, 1fr));
--grid-expanded: repeat(auto-fill, minmax(200px, 1fr));

/* — Responsive Page Max Widths */
--page-max-mobile: 100%;
--page-max-tablet: 720px;
--page-max-desktop: 1000px;
--page-max-wide: 1200px;

/* — Detail Page Layout */
--detail-sidebar-width: 320px;
--detail-content-min: 0;
--detail-gap: var(--space-8);
```

---

## New Typography System

### Keep Current Pairing
- **Display:** Space Grotesk (500, 600, 700) ✓
- **Body:** Inter (400, 500, 600) ✓
- **Mono:** JetBrains Mono (400) ✓

### Add Missing Weights
- Inter: 300, 700, 800
- Space Grotesk: 400

### New Type Roles
```css
--text-hero: 3.5rem;     /* 56px — fullscreen hero */
--text-display: 2.75rem; /* 44px — page hero titles */
--text-headline: 2rem;   /* 32px — section headlines */
--text-title-1: 1.5rem;  /* 24px */
--text-title-2: 1.25rem; /* 20px */
--text-title-3: 1.125rem;/* 18px */
--text-body: 1rem;       /* 16px */
--text-body-sm: 0.875rem;/* 14px */
--text-label: 0.8125rem; /* 13px */
--text-caption: 0.75rem; /* 12px */
--text-micro: 0.625rem;  /* 10px */

/* — Dynamic hero size by string length */
/* < 21 chars: --text-hero (56px) */
/* 21-50 chars: --text-display (44px) */
/* 51-90 chars: --text-headline (32px) */
/* > 90 chars: rewrite shorter */
```

---

## New Component Architecture

```
src/
  components/
    common/
      Modal/           ← NEW: shared modal (replaces 2 duplicates)
      Card/            ← REFACTOR: unified card blueprint
      Button/          ← ENHANCE: add danger variant, shape prop
      EmptyState/      ← EXPAND: 4 more variants
      BlurredBackground/ ← CENTRALIZE: all backdrop variants
    
    player/
      NowPlayingBar/   ← REFACTOR: merge MiniPlayer + BottomPlaybar
      FullscreenPlayer/ ← REFACTOR: add rotation, auto-hide, quick links
      LyricsOverlay/   ← NEW: replace standalone LyricsView
    
    layout/
      ShellLayout/     ← REFACTOR: LRU caching, tooltips
      Sidebar/         ← REFACTOR: user-controlled collapse
      TopBar/          ← REFACTOR: dynamic titles, settings gear

  hooks/
    useContextMenu.js  ← NEW: extracted from TrackCard + TrackRow
    useNowPlaying.js   ← NEW: shared play-queue logic

  styles/
    tokens.css         ← NEW: extracted from index.css
    themes/
      dark.css         ← NEW: dark theme tokens
      light.css        ← NEW: light theme tokens
    animations.css     ← REFACTOR: fix performance, add premium animations
    grain.css          ← NEW: noise texture
```

---

## Design Principles (from Hallmark Audit)

1. **Album art first** — cover art drives color, mood, and layout
2. **One accent, used sparingly** — pick amber/rose and stick with it
3. **Motion with purpose** — every animation has meaning (play = rotate, transition = slide)
4. **Depth through layers** — 5+ elevation tiers, grain texture, glass only over imagery
5. **Controls always accessible** — never leave users stranded without playback controls
6. **Consistent cards** — one blueprint, all card types follow it
7. **Dark AND light** — system-aware theming is non-negotiable in 2026
8. **No inline styles** — every visual decision lives in CSS
