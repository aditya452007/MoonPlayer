# CSS & Styling Analysis — MoonPlayer

> Generated: 2026-05-30 | Total CSS files analyzed: 36

---

## Table of Contents
1. [Undefined CSS Custom Properties (Broken Design Tokens)](#1-undefined-css-custom-properties-broken-design-tokens)
2. [Z-index Management (Magic Numbers)](#2-z-index-management-magic-numbers)
3. [Naming Convention Inconsistencies](#3-naming-convention-inconsistencies)
4. [Specificity & Selector Issues](#4-specificity--selector-issues)
5. [Performance Issues](#5-performance-issues)
6. [Accessibility Issues](#6-accessibility-issues)
7. [Responsive Design & Breakpoint Inconsistencies](#7-responsive-design--breakpoint-inconsistencies)
8. [Code Duplication](#8-code-duplication)
9. [Animation & Transition Issues](#9-animation--transition-issues)
10. [Browser Compatibility Issues](#10-browser-compatibility-issues)
11. [Structure & Layout Issues](#11-structure--layout-issues)
12. [Maintainability Issues](#12-maintainability-issues)
13. [Hardcoded Values Summary](#13-hardcoded-values-summary)

---

## 1. Undefined CSS Custom Properties (Broken Design Tokens)

The design system in `index.css` defines `--space-*` and `--text-*` tokens. Several files reference non-existent token names.

### 1.1 `--spacing-*` / `--font-size-*` (wrong prefix)

- **Category**: CSS Architecture Issues / Maintainability
- **File**: `src/components/common/GestureGuideOverlay/GestureGuideOverlay.css`
- **Lines**: 8, 31, 35, 36, 41, 47, 49, 53, 61, 63, 83, 88, 93, 94
- **Severity**: **HIGH**
- **Issue**: Uses `var(--spacing-md)`, `var(--spacing-lg)`, `var(--spacing-xl)`, `var(--spacing-sm)`, `var(--font-size-2xl)`, `var(--font-size-md)`, `var(--font-size-sm)` — none of these tokens exist in the design system.
- **Suggestion**: Replace with `var(--space-*)` and `var(--text-*)` equivalents. Example: `--spacing-md` → `--space-4`, `--font-size-md` → `--text-base`.

- **File**: `src/components/common/ShortcutOverlay/ShortcutOverlay.css`
- **Lines**: 8, 36, 37, 42, 47, 54, 60, 69, 75, 76, 81
- **Severity**: **HIGH**
- **Issue**: Same as above — uses `var(--spacing-md)`, `var(--spacing-lg)`, `var(--spacing-sm)`, `var(--font-size-xl)`, `var(--font-size-sm)`.
- **Suggestion**: Replace with design system tokens.

- **File**: `src/components/common/InstallPrompt/InstallPrompt.css`
- **Lines**: 3, 6, 12, 21, 31, 37, 44, 50
- **Severity**: **HIGH**
- **Issue**: Uses `var(--spacing-md)`, `var(--spacing-xl)`, `var(--spacing-sm)`, `var(--font-size-md)`, `var(--font-size-sm)`.
- **Suggestion**: Replace with design system tokens.

### 1.2 `--bg-highlight` (undefined)

- **Category**: CSS Architecture Issues
- **File**: `src/views/pages/Settings.css` — Line 49
- **File**: `src/views/pages/PlaylistView.css` — Line 23
- **File**: `src/components/common/ContextMenu/ContextMenu.css` — Line 45
- **Severity**: **HIGH**
- **Issue**: `var(--bg-highlight)` is referenced but never defined in `index.css` or any other file.
- **Suggestion**: Add `--bg-highlight` to `:root` in `index.css` (likely `#1A1E25` which matches `--bg-elevated`) or replace with `var(--bg-elevated)`.

### 1.3 `--primary` / `--primary-light` (undefined)

- **Category**: CSS Architecture Issues
- **File**: `src/views/pages/PlaylistView.css` — Lines 65–66, 81
- **Severity**: **HIGH**
- **Issue**: Play button uses `var(--primary)` and hover uses `var(--primary-light, var(--primary))`. Neither token exists.
- **Suggestion**: Replace with `var(--accent-moon)` and `var(--text-primary)` respectively, or define primary color tokens.

### 1.4 `--font-display` (undefined)

- **Category**: CSS Architecture Issues
- **File**: `src/components/layout/Sidebar/Sidebar.css` — Line 30
- **File**: `src/components/layout/TopBar/TopBar.css` — Line 21
- **Severity**: **HIGH**
- **Issue**: `var(--font-display)` is referenced but not defined in `:root`.
- **Suggestion**: Replace with `var(--font-heading)` ('Space Grotesk') or define `--font-display` token.

### 1.5 `--ease-bounce` (undefined)

- **Category**: CSS Architecture Issues
- **File**: `src/components/player/Controls/Controls.css` — Line 9
- **Severity**: **MEDIUM**
- **Issue**: `var(--ease-bounce)` not defined. The spring-like easing in the design system is `--ease-spring`.
- **Suggestion**: Replace with `var(--ease-spring)`.

### 1.6 `--accent-primary` (undefined)

- **Category**: CSS Architecture Issues
- **File**: `src/views/pages/SongRedirectView.css` — Line 22
- **Severity**: **HIGH**
- **Issue**: `var(--accent-primary)` not defined. The correct moon accent token is `--accent-moon`.
- **Suggestion**: Replace with `var(--accent-moon)`.

### 1.7 `--shadow-xl` (undefined)

- **Category**: CSS Architecture Issues
- **File**: `src/components/common/GestureGuideOverlay/GestureGuideOverlay.css` — Line 25
- **Severity**: **MEDIUM**
- **Issue**: `var(--shadow-xl)` not defined. Largest shadow token is `--shadow-lg`.
- **Suggestion**: Use `var(--shadow-lg)` or add a `--shadow-xl` token.

---

## 2. Z-index Management (Magic Numbers)

The design system defines a z-index scale in `index.css` (lines 78–88), but many files ignore it.

### 2.1 Hardcoded `z-index: 9999`

- **Category**: Z-index Management
- **File**: `src/components/pet/PetContainer/PetContainer.css` — Line 3
- **Severity**: **HIGH**
- **Issue**: Magic number `9999`. The design token `--z-pet: 550` exists.
- **Suggestion**: Replace with `var(--z-pet)`.

### 2.2 Hardcoded `z-index: 2000`

- **Category**: Z-index Management
- **File**: `src/components/common/InstallPrompt/InstallPrompt.css` — Line 8
- **Severity**: **HIGH**
- **Issue**: Magic number `2000`. Should use `--z-toast: 500` or add a higher token.
- **Suggestion**: Replace with `var(--z-toast)`.

### 2.3 Hardcoded `z-index: 1100`

- **Category**: Z-index Management
- **File**: `src/components/common/GestureGuideOverlay/GestureGuideOverlay.css` — Line 4
- **Severity**: **HIGH**
- **Issue**: Magic number `1100`. The overlay/shortcut should use a z-index token.
- **Suggestion**: Replace with `var(--z-splash)` (700) or add a `--z-overlay` token (700+ range).

### 2.4 Hardcoded `z-index: 1000`

- **Category**: Z-index Management
- **File**: `src/components/common/ShortcutOverlay/ShortcutOverlay.css` — Line 4
- **Severity**: **HIGH**
- **Issue**: Magic number `1000`. Same as above.
- **Suggestion**: Use a design token.

### 2.5 Hardcoded `z-index: 50`

- **Category**: Z-index Management
- **File**: `src/components/layout/BottomNavigation/BottomNavigation.css` — Line 15
- **Severity**: **MEDIUM**
- **Issue**: `z-index: 50` — no design token maps to 50.
- **Suggestion**: Add a `--z-bottomNav` token or reuse `--z-sticky: 200`.

### 2.6 Hardcoded `z-index: 10`

- **Category**: Z-index Management
- **File**: `src/components/layout/Sidebar/Sidebar.css` — Line 11
- **File**: `src/components/layout/TopBar/TopBar.css` — Line 8
- **File**: `src/components/player/MiniPlayer/MiniPlayer.css` — Line 22
- **Severity**: **MEDIUM**
- **Issue**: These should use `--z-sidebar` (300), `--z-sticky` (200), and no z-index for mini-player chip respectively.
- **Suggestion**: Replace with appropriate design tokens.

---

## 3. Naming Convention Inconsistencies

### 3.1 Mixed BEM implementations

- **Category**: Naming Convention
- **Files with BEM** (`block__element--modifier`):
  - `Search.css` — ✅ `search-page__header`
  - `TrackCard.css` — ✅ `track-card__title`
  - `TrackRow.css` — ✅ `track-row--active`
  - `Settings.css` — ✅ `settings-section__header`
  - Most page and common component files

- **Files without BEM** (flat single-dash):
  - `GestureGuideOverlay.css` — `gesture-guide-wrapper`, `gesture-guide-backdrop`, `gesture-guide-modal`
  - `ShortcutOverlay.css` — `shortcut-overlay-wrapper`, `shortcut-overlay-backdrop`, `shortcut-overlay-modal`
  - `InstallPrompt.css` — `install-prompt__content` (partial BEM, but also flat `install-prompt`)
  - `PetContainer.css` — `pet-container`, `pet-speech-bubble`

- **Severity**: **MEDIUM**
- **Issue**: Two different naming conventions exist. Overlay/modal components use flat naming while page and component files use proper BEM.
- **Suggestion**: Convert overlay files to BEM: `.gesture-guide__wrapper`, `.gesture-guide__backdrop`, `.gesture-guide__modal`.

### 3.2 Element selectors mixed with classes

- **Category**: Specificity / Naming Convention
- **File**: `GestureGuideOverlay.css` — Line 38: `.gesture-guide-content h2`
- **File**: `GestureGuideOverlay.css` — Line 44: `.gesture-guide-content p`
- **File**: `ShortcutOverlay.css` — Line 40: `.shortcut-overlay-header h2`
- **File**: `InstallPrompt.css` — Line 29: `.install-prompt__text h4`
- **File**: `InstallPrompt.css` — Line 35: `.install-prompt__text p`
- **Severity**: **LOW**
- **Issue**: Mixing element selectors with classes increases specificity unnecessarily.
- **Suggestion**: Use dedicated class names (e.g., `.gesture-guide__heading`, `.gesture-guide__description`).

---

## 4. Specificity & Selector Issues

### 4.1 `!important` usage

- **Category**: Specificity Issues
- **File**: `src/components/common/InstallPrompt/InstallPrompt.css` — Line 5
  - `transform: translateX(-50%) !important;`
  - Comment says "Override Framer Motion X" — relying on `!important` for framework interop is fragile.
- **File**: `src/components/common/Skeleton/Skeleton.css` — Line 36
  - `width: 80% !important;`
  - Comment says "Ensure last line in a text block isn't full width for organic look"
- **Severity**: **MEDIUM**
- **Issue**: `!important` breaks the natural cascade and makes overrides difficult.
- **Suggestion**: For InstallPrompt, use `style` prop or a higher-specificity selector. For Skeleton, use a modifier class instead of `!important`.

### 4.2 Deeply nested selectors

- **Category**: Specificity Issues
- **File**: `src/components/common/TrackRow/TrackRow.css` — Line 85
  - `.track-row:hover .track-row__index .track-row__play-icon` — 3 class selectors + pseudo
- **File**: `src/components/common/IconButton/IconButton.css` — Lines 65–66, 79
  - `.icon-button:hover:not(:disabled)`, `.icon-button--active:hover:not(:disabled)`
- **Severity**: **LOW**
- **Issue**: While functional, these selectors are more specific than necessary.
- **Suggestion**: Simplify to `.track-row:hover .track-row__play-icon` (the intermediate `.track-row__index` is redundant if you use direct classes).

### 4.3 Element + class selectors

- **Category**: Specificity Issues
- **File**: `src/components/common/InstallPrompt/InstallPrompt.css` — Line 59
  - `.install-prompt__actions button:first-child`
- **Severity**: **LOW**
- **Suggestion**: Use `.install-prompt__action-btn--primary` class instead.

---

## 5. Performance Issues

### 5.1 `transition: all`

- **Category**: Performance Issues
- **File**: `src/components/common/IconButton/IconButton.css` — Line 8
  - `transition: all var(--duration-fast) var(--ease-default);`
- **File**: `src/components/common/Button/Button.css` — Line 9
  - `transition: all var(--duration-fast) var(--ease-default);`
- **File**: `src/components/layout/Sidebar/Sidebar.css` — Line 57
  - `transition: all var(--duration-fast) var(--ease-default);`
- **File**: `src/components/player/LyricsPanel/LyricsPanel.css` — Line 37
  - `transition: all 0.3s ease-out;`
- **Severity**: **MEDIUM**
- **Issue**: `transition: all` triggers repaints on any property change, not just animatable ones. This can cause jank.
- **Suggestion**: List specific properties: `transition: background-color var(--duration-fast) var(--ease-default), transform var(--duration-fast) var(--ease-default);`

### 5.2 Layout-triggering animations

- **Category**: Performance Issues
- **File**: `src/components/common/TrackCard/TrackCard.css` — Line 34
  - `.track-card:hover .track-card__image { transform: scale(1.05); }` — OK (composite)
- **File**: `src/views/pages/Library.css` — Line 43
  - `.playlist-card:hover { transform: translateY(-4px); ... }` — OK (composite)
- **File**: `src/components/player/ProgressBar/ProgressBar.css` — Lines 31–57
  - Position absolute elements that update via CSS custom property — causes layout recalculation on every progress update.
- **File**: `src/components/player/VolumeControl/VolumeControl.css` — Lines 19–53
  - Same pattern as ProgressBar.
- **Severity**: **MEDIUM**
- **Issue**: Progress/volume bars use absolute positioning with `var(--progress-width)` updates. When JS updates the custom property, the browser must recalculate layout for the absolutely positioned children.
- **Suggestion**: Use `transform: translateX(...)` on the fill and thumb elements instead of changing `left`/`width` properties, or use `clip-path`.

### 5.3 `backdrop-filter` performance on modals

- **Category**: Performance Issues
- **Files**: `GestureGuideOverlay.css`, `ShortcutOverlay.css`, `GlassPanel.css`, `GlassToast.css`, `ContextMenu.css`
- **Severity**: **LOW**
- **Issue**: Multiple layered `backdrop-filter` effects. On low-end mobile devices, nested backdrop-filter elements can cause severe jank.
- **Suggestion**: Consider reducing `backdrop-filter` blur radius on mobile or disabling it via `@media (prefers-reduced-motion)`.

---

## 6. Accessibility Issues

### 6.1 Hardcoded pixel font sizes (not rem)

- **Category**: Accessibility Issues
- **File**: `src/components/player/ProgressBar/ProgressBar.css` — Line 9
  - `font-size: 11px;`
- **File**: `src/components/layout/BottomNavigation/BottomNavigation.css` — Line 39
  - `font-size: 10px;`
- **Severity**: **HIGH**
- **Issue**: Hardcoded `px` values prevent text scaling when users change browser font-size settings. This is a WCAG 2.0 SC 1.4.4 failure (Resize text).
- **Suggestion**: Use `rem` values: `0.6875rem` for 11px, `0.625rem` for 10px, or use design tokens `var(--text-xs)` (0.75rem).

### 6.2 Missing `focus-visible` styles

- **Category**: Accessibility Issues
- **Files**: Many interactive elements lack visible focus indicators.
- **File**: `src/components/common/TrackRow/TrackRow.css` — `.track-row:focus-visible` exists (line 13) ✅
- **File**: `src/components/common/BottomNavigation/BottomNavigation.css` — `.bottom-nav__tab` has no `:focus-visible` ❌
- **File**: `src/components/common/GestureGuideOverlay/GestureGuideOverlay.css` — dismiss button has no visible focus ❌
- **File**: `src/components/common/ShortcutOverlay/ShortcutOverlay.css` — close button has no visible focus ❌
- **File**: `src/components/player/LyricsPanel/LyricsPanel.css` — `.lyrics-panel__line` has no `:focus-visible` ❌
- **Severity**: **HIGH**
- **Issue**: Keyboard users cannot see which element is focused.
- **Suggestion**: Add `:focus-visible` styles to all interactive elements. Use `outline: 2px solid var(--border-focus)` consistently.

### 6.3 Missing ARIA attributes in custom controls

- **Category**: Accessibility Issues
- **File**: `src/components/player/VolumeControl/VolumeControl.css` — Custom range slider
- **File**: `src/components/player/ProgressBar/ProgressBar.css` — Custom progress bar
- **Severity**: **HIGH**
- **Issue**: Custom range/volume controls are purely visual classes. No ARIA roles (`slider`, `progressbar`), `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, or `aria-label` are defined here (though they may be set in JSX — verify at the component level).
- **Suggestion**: Verify JSX includes proper ARIA attributes. If missing, add `role="slider"`, `aria-label="Volume"`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-valuenow={volume}`.

### 6.4 Color contrast concerns

- **Category**: Accessibility Issues
- **File**: `src/styles/index.css`
  - `--text-tertiary: #5A6580` on `--bg-void: #0B0D10`
  - Approximate contrast ratio: ~3.5:1 (borderline for WCAG AA small text)
- **File**: Many files use `--text-secondary: #8B9DC3` on `--bg-void: #0B0D10`
  - Approximate contrast ratio: ~5.2:1 (passes AA for normal text, fails for small text at 4.5:1 minimum — but 5.2 passes)
- **Severity**: **LOW** (borderline)
- **Issue**: `--text-tertiary` may fail WCAG AA for small text.
- **Suggestion**: Lighten `--text-tertiary` to at least `#6B7A99` for better contrast.

### 6.5 `prefers-reduced-motion` coverage

- **Category**: Accessibility Issues
- **File**: `src/styles/index.css` — Lines 253–261
- **Severity**: **LOW**
- **Issue**: The global `prefers-reduced-motion` rule covers all animations/transitions via `!important`. This is a good safety net, but individual component animations should also be considered for reduced motion-specific alternatives rather than just disabling.
- **Suggestion**: For animations like `equalizerBar*`, `moonGlow`, and `shimmer`, consider providing static alternatives or disabling them under `prefers-reduced-motion`.

---

## 7. Responsive Design & Breakpoint Inconsistencies

### 7.1 Inconsistent breakpoint values

- **Category**: Responsive Design Issues
- **Breakpoints used in project**:
  | File | Breakpoint |
  |------|-----------|
  | `Home.css` | `480px` |
  | `InstallPrompt.css` | `600px` |
  | `QueuePanel.css` | `767px` |
  | `PlaylistView.css` | `768px` |
  | `FullscreenPlayer.css` | `768px` |
  | `AppShell.css` | `768px` |
  | `TopBar.css` | `768px` |
  | `LyricsPanel.css` | `768px` |
  | `RecommendationCarousel.css` | `768px` |
  | `Library.css` | — (none) |
  | `Search.css` | — (none) |
  | `Settings.css` | — (none) |
  | `SongRedirectView.css` | — (none) |
  | `TrackCard.css` | — (none) |
  | `TrackRow.css` | — (none) |
  | `SolidPanel.css` | — (none) |
  | `GlassPanel.css` | — (none) |
  | `Sidebar.css` | — (none) |
  | `BottomNavigation.css` | — (none) |
  | `MiniPlayer.css` | — (none) |
  | `GlobalPlayer.css` | — (none) |
  | `Controls.css` | — (none) |
  | `VolumeControl.css` | — (none) |
  | `ProgressBar.css` | — (none) |
  | `BottomPlaybar.css` | — (none) |
  | `LyricsPanel.css` | `768px` |
  | `PetContainer.css` | — (none) |

- **Severity**: **MEDIUM**
- **Issue**: 4 different breakpoint values (480px, 600px, 767px, 768px). No single source of truth. 767px vs 768px creates a 1px gap where neither applies.
- **Suggestion**: Define breakpoint tokens in `index.css` as custom properties or document in comments. Use `--bp-mobile: 480px`, `--bp-tablet: 768px`, `--bp-desktop: 1024px`.

### 7.2 Missing responsive handling

- **Category**: Responsive Design Issues
- **File**: `src/views/pages/Library.css` — Grid has `minmax(200px, 1fr)` with no mobile override. On 320px screens, items collapse to single column but cards may overflow.
- **File**: `src/components/player/BottomPlaybar/BottomPlaybar.css` — Lines 14, 79 use `min-width: 200px` for left/right sections. On mobile < 400px, these will overflow.
- **File**: `src/views/pages/Search.css` — No responsive adjustments. On small screens, the 48px left padding on input (line 28) combined with `var(--space-4)` right padding may cause overflow.
- **Severity**: **MEDIUM**
- **Suggestion**: Add mobile-first media queries. For BottomPlaybar, reduce `min-width` on mobile.

---

## 8. Code Duplication

### 8.1 ProgressBar / VolumeControl identical pattern

- **Category**: Code Duplication
- **File 1**: `src/components/player/ProgressBar/ProgressBar.css`
- **File 2**: `src/components/player/VolumeControl/VolumeControl.css`
- **Lines**: Nearly all lines in both files
- **Severity**: **MEDIUM**
- **Issue**: Both share the same structural pattern: track → fill → thumb with identical CSS (height 4px, same hover/active transforms, same color logic). ~90% of code is identical.
- **Suggestion**: Create a shared `.range-track` / `.range-fill` / `.range-thumb` pattern in a shared CSS file or use a CSS preprocessor mixin.

### 8.2 Skeleton patterns recreated in Search.css

- **Category**: Code Duplication
- **File**: `src/views/pages/Search.css` — Lines 74–91
- **Duplicate of**: `src/components/common/Skeleton/Skeleton.css`
- **Severity**: **LOW**
- **Issue**: Search page defines its own skeleton layout classes (`.search-page__skeleton-item`, `.__skeleton-rect`, `.__skeleton-text-group`) rather than composing from the shared Skeleton component.
- **Suggestion**: Use the existing Skeleton component or shared `.skeleton-base` classes.

### 8.3 `backdrop-filter` repeated across files

- **Category**: Code Duplication
- **Files**: `ContextMenu.css` (line 12), `GlassToast.css` (line 6), `GlassPanel.css` (line 3), `GestureGuideOverlay.css` (line 15), `ShortcutOverlay.css` (line 15), `PetContainer.css` (line 14)
- **Severity**: **LOW**
- **Issue**: `backdrop-filter: blur(...)` + `-webkit-backdrop-filter: blur(...)` repeated in every glass component.
- **Suggestion**: Create a `.glass` utility class in `utilities.css` with the backdrop-filter and glass-bg/glass-border tokens.

### 8.4 `@keyframes spin` redefined

- **Category**: Code Duplication
- **File**: `src/views/pages/SongRedirectView.css` — Lines 25–31
- **Already exists in**: `src/styles/animations.css` — Lines 81–88
- **Severity**: **MEDIUM**
- **Issue**: `@keyframes spin` duplicated. The global one in `animations.css` already exists.
- **Suggestion**: Remove the local `@keyframes spin` from `SongRedirectView.css` and use the shared `spin` animation from `animations.css`.

### 8.5 `@keyframes contextMenuFadeIn` vs `scaleIn`

- **Category**: Code Duplication
- **File**: `src/components/common/ContextMenu/ContextMenu.css` — Lines 17–26
- **Similar to**: `src/styles/animations.css` — `@keyframes scaleIn` (lines 69–78)
- **Severity**: **LOW**
- **Issue**: `contextMenuFadeIn` is nearly identical to the existing `scaleIn` keyframe (both fade + scale(0.95) → opacity 1 + scale(1)).
- **Suggestion**: Use `scaleIn` from `animations.css` instead.

---

## 9. Animation & Transition Issues

### 9.1 Hardcoded transition duration

- **Category**: Animation/Transition Issues
- **File**: `src/components/player/LyricsPanel/LyricsPanel.css` — Line 37
  - `transition: all 0.3s ease-out;`
- **Severity**: **LOW**
- **Issue**: `0.3s` should be `var(--duration-slow)` for consistency with the design system.
- **Suggestion**: Replace with `transition: color var(--duration-slow) var(--ease-out), transform var(--duration-slow) var(--ease-out);`

### 9.2 Missing `will-change` hints

- **Category**: Performance / Animation
- **Files**:
  - `TrackCard.css` — hover transform scale(1.05) on image
  - `PlaylistView.css` — play button hover scale(1.05)
  - `FullscreenPlayer.css` — controls have `transform: scale(1.2)`
- **Severity**: **LOW**
- **Issue**: Elements animated on hover with `transform` may benefit from `will-change: transform` to promote to compositor layer.
- **Suggestion**: Add `will-change: transform` to elements that animate on hover, but be careful not to overuse (can cause memory issues).

### 9.3 `scroll-snap-type: x mandatory`

- **Category**: Animation / UX
- **File**: `src/components/common/RecommendationCarousel/RecommendationCarousel.css` — Line 25
- **Severity**: **LOW**
- **Issue**: `x mandatory` forces snapping on every scroll position change. On low-end devices this can feel janky and may interfere with smooth scrolling.
- **Suggestion**: Consider `x proximity` instead of `x mandatory` for a less aggressive snap behavior.

---

## 10. Browser Compatibility Issues

### 10.1 CSS Nesting in `.css` files (native nesting not supported for pseudo-elements)

- **Category**: Browser Compatibility Issues
- **File**: `src/components/player/LyricsPanel/LyricsPanel.css` — Lines 11–17
  ```css
  &::-webkit-scrollbar { ... }
  &::-webkit-scrollbar-thumb { ... }
  ```
- **File**: `src/components/common/RecommendationCarousel/RecommendationCarousel.css` — Lines 29–35
  ```css
  &::-webkit-scrollbar { display: none; }
  ```
- **Severity**: **HIGH**
- **Issue**: The `&` nesting syntax is a Sass/SCSS/Less feature. In native CSS, `&::-webkit-scrollbar` is NOT valid and will break in all browsers. Native CSS nesting (2023+) only supports `&` for compound selectors, NOT for pseudo-elements like `::-webkit-scrollbar`.
- **Suggestion**: Either:
  - Move to a build step (Sass), or
  - Write flat CSS: `.recommendation-carousel__scroll-area::-webkit-scrollbar` and `.lyrics-panel::-webkit-scrollbar`

### 10.2 `env(safe-area-inset-*)` without fallback

- **Category**: Browser Compatibility Issues
- **File**: `src/components/layout/TopBar/TopBar.css` — Lines 10–11
  - `padding-top: env(safe-area-inset-top, 0px);`
  - `height: calc(64px + env(safe-area-inset-top, 0px));`
- **File**: `src/components/layout/AppShell/AppShell.css` — Line 40
  - `padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 160px);`
- **File**: `src/components/layout/BottomNavigation/BottomNavigation.css` — Lines 6, 10
  - `height: calc(80px + env(safe-area-inset-bottom, 0px));`
  - `padding-bottom: env(safe-area-inset-bottom, 0px);`
- **Severity**: **LOW**
- **Issue**: `env()` is supported in modern browsers (iOS Safari 11.2+, Chrome 69+), but older browsers may not support it. The fallback value `0px` is provided, which is safe.
- **Suggestion**: Consider adding `constant()` as fallback for older iOS Safari versions: `padding-top: constant(safe-area-inset-top, 0px);`.

### 10.3 Unprefixed `backdrop-filter` fallback only in one file

- **Category**: Browser Compatibility Issues
- **File**: `src/components/common/GlassPanel/GlassPanel.css` — Lines 30–33 (has `@supports not` fallback)
- **Files missing fallback**: `ContextMenu.css`, `GlassToast.css`, `GestureGuideOverlay.css`, `ShortcutOverlay.css`, `PetContainer.css`
- **Severity**: **MEDIUM**
- **Issue**: Only `GlassPanel.css` provides a `@supports not (backdrop-filter)` fallback for browsers that don't support backdrop-filter (Firefox < 103, some mobile browsers). Other glass components will render invisible if backdrop-filter is unsupported.
- **Suggestion**: Add `@supports not (backdrop-filter: blur(...))` fallback with a solid background color for all glass components.

### 10.4 `-webkit-tap-highlight-color`

- **Category**: Browser Compatibility
- **File**: `src/components/layout/BottomNavigation/BottomNavigation.css` — Line 30
  - `-webkit-tap-highlight-color: transparent;`
- **Severity**: **LOW**
- **Issue**: Non-standard property. Acceptable for mobile UX, but should ensure focus styles are visible as an alternative.
- **Suggestion**: Add `:focus-visible` styles to tabs.

---

## 11. Structure & Layout Issues

### 11.1 No CSS reset for `fieldset`, `figure`, `hr`, `table`, etc.

- **Category**: Structure Issues
- **File**: `src/styles/index.css`
- **Severity**: **LOW**
- **Issue**: The reset covers `*` box-sizing, lists, buttons, inputs, images. But `<fieldset>`, `<figure>`, `<hr>`, `<table>`, `<blockquote>` lack defaults.
- **Suggestion**: Add additional resets for common HTML elements to prevent unexpected margins/padding.

### 11.2 `padding: 50vh 0` in LyricsPanel

- **Category**: Structure Issues
- **File**: `src/components/player/LyricsPanel/LyricsPanel.css` — Line 7
  - `padding: 50vh 0;`
- **Severity**: **MEDIUM**
- **Issue**: Using `50vh` padding to center lyrics may cause issues on screens with dynamic toolbar (mobile) where viewport height changes. The `<empty>` state compensates with `margin-top: -50vh` (line 27), which can break if content changes.
- **Suggestion**: Use CSS `scroll-snap-type: y mandatory` on each lyric line for precise centering, or use JS-based scroll management.

### 11.3 Height declared twice in TopBar

- **Category**: Structure Issues
- **File**: `src/components/layout/TopBar/TopBar.css` — Lines 5, 11
  ```css
  height: 64px;
  height: calc(64px + env(safe-area-inset-top, 0px));
  ```
- **Severity**: **LOW**
- **Issue**: `height` declared twice — first as a raw value (line 5), then overridden with the safe area calculation (line 11). The first declaration is redundant.
- **Suggestion**: Remove the standalone `height: 64px` on line 5.

### 11.4 Overflow on small viewports

- **Category**: Structure Issues
- **File**: `src/components/player/BottomPlaybar/BottomPlaybar.css`
  - Left/right sections use `width: 30%; min-width: 200px` — on viewports < 667px, these will overflow the playbar.
- **Severity**: **MEDIUM**
- **Suggestion**: Use `flex: 1` or `max-width: 30%` instead of fixed `min-width` on mobile.

### 11.5 `.queue-panel` overrides sidebar width token

- **Category**: Structure Issues
- **File**: `src/components/player/QueuePanel/QueuePanel.css` — Line 6
  - `width: 320px;` (hardcoded)
- **File**: `src/styles/index.css` — Line 109
  - `--queue-width: 320px;` (token exists)
- **Severity**: **MEDIUM**
- **Issue**: A token `--queue-width` is defined but not used.
- **Suggestion**: Replace `width: 320px` with `width: var(--queue-width)`.

---

## 12. Maintainability Issues

### 12.1 Missing comments for complex patterns

- **Category**: Maintainability Issues
- **Files lacking comments**: `VolumeControl.css`, `ProgressBar.css` (no explanation of custom property contract with JS), `LyricsPanel.css` (no explanation of `50vh` padding pattern)
- **Files with good comments**: `index.css` (section headers), `Button.css` (variant comments), `IconButton.css` (touch target explanation), `SolidPanel.css`
- **Severity**: **LOW**
- **Suggestion**: Add comments documenting the CSS/JS protocol for custom properties like `--progress-width` and `--volume-width`.

### 12.2 Global class name collisions risk

- **Category**: Maintainability Issues
- **Files**: All CSS files use global class names with no CSS Modules, no scoping, no preprocessor nesting.
- **Severity**: **MEDIUM**
- **Issue**: All 36 CSS files use flat global class names. If a class like `.track-row` or `.button` is used in another context, it will collide. The BEM convention mitigates this but does not guarantee uniqueness.
- **Suggestion**: Consider CSS Modules (`.module.css`) or a scoping approach if the project grows. Alternatively, prefix all component classes with a project identifier.

### 12.3 Component styles not co-located with JS consistently

- **Category**: Maintainability Issues
- **Observation**: Each component has its own `.css` file in the same directory, which is good.
- **Severity**: **NONE** (positive finding)
- **Note**: This is a well-organized pattern. Keep it up.

---

## 13. Hardcoded Values Summary

### 13.1 Hardcoded font sizes (not using design tokens)

| File | Line | Value | Should Be |
|------|------|-------|-----------|
| `ProgressBar.css` | 9 | `font-size: 11px` | `var(--text-xs)` (0.75rem) |
| `BottomNavigation.css` | 39 | `font-size: 10px` | `var(--text-xs)` (0.75rem) |
| `LyricsPanel.css` | 31 | `font-size: 1.5rem` | Could use `var(--text-3xl)` |
| `LyricsPanel.css` | 60 | `font-size: 1.25rem` | Could use `var(--text-xl)` |
| `PlaylistView.css` | 46 | `font-size: 3rem` | Could use `var(--text-4xl)` (2.25rem) or add token |

### 13.2 Hardcoded colors (not using design tokens)

| File | Line | Value | Should Be |
|------|------|-------|-----------|
| `Library.css` | 58 | `#FF6B6B, #C44569` | Define a `--accent-liked` token or use theme color |
| `IconButton.css` | 66, 71 | `rgba(212, 224, 237, 0.08)`, `rgba(212, 224, 237, 0.12)` | Use a semantic hover token or `--text-primary` with opacity |
| `Button.css` | 74 | `#fff;` | `var(--text-primary)` |
| `Button.css` | 76 | `rgba(212, 224, 237, 0.2)` | Use a shadow token |
| `Sidebar.css` | 66 | `rgba(212, 224, 237, 0.05)` | Use a hover token |
| `Sidebar.css` | 71 | `rgba(212, 224, 237, 0.1)` | Use an active token |
| `Settings.css` | 48 | `rgba(255, 255, 255, 0.1)` | `var(--border-default)` |

### 13.3 Hardcoded widths/heights

| File | Line | Value | Should Be |
|------|------|-------|-----------|
| `QueuePanel.css` | 6 | `width: 320px` | `var(--queue-width)` |
| `TopBar.css` | 5 | `height: 64px` | `var(--topbar-height)` or add token |
| `AppShell.css` | 47 | `padding-bottom: 120px` | `calc(var(--playbar-height) + var(--space-8))` |
| `BottomPlaybar.css` | 14, 79 | `min-width: 200px` | Use percentage or responsive approach |

---

## Summary Statistics

| Category | Count | High | Medium | Low |
|----------|-------|------|--------|-----|
| Undefined CSS Custom Properties | 7 groups | 13 individual refs | 2 | 0 |
| Z-index Management | 8 files | 3 | 2 | 3 |
| Naming Convention | 5 files | 0 | 1 | 4 |
| Specificity / `!important` | 3 files | 0 | 1 | 2 |
| Performance Issues | 6 files | 0 | 3 | 3 |
| Accessibility Issues | 5 groups | 3 | 1 | 1 |
| Responsive Design Issues | 4 groups | 0 | 2 | 2 |
| Code Duplication | 5 groups | 0 | 2 | 3 |
| Animation / Transition | 3 files | 0 | 0 | 3 |
| Browser Compatibility | 4 groups | 1 | 1 | 2 |
| Structure & Layout | 5 files | 0 | 3 | 2 |
| Maintainability | 3 groups | 0 | 1 | 2 |
| Hardcoded Values | 3 groups | 0 | 2 | 1 |

**Total findings: ~80+ individual issues across 36 CSS files.**

### Priority Actions

1. **HIGH** — Fix undefined custom properties in `GestureGuideOverlay.css`, `ShortcutOverlay.css`, `InstallPrompt.css` (use `--space-*` / `--text-*` tokens)
2. **HIGH** — Replace magic z-index values with design tokens in `PetContainer.css` (9999), `InstallPrompt.css` (2000), `GestureGuideOverlay.css` (1100)
3. **HIGH** — Remove CSS nesting (`&::-webkit-scrollbar`) from `LyricsPanel.css` and `RecommendationCarousel.css` (breaks in all browsers)
4. **HIGH** — Define missing tokens: `--bg-highlight`, `--font-display`, `--primary`, `--accent-primary`, `--ease-bounce` or replace with existing ones
5. **HIGH** — Fix hardcoded `px` font-sizes in `ProgressBar.css` (11px) and `BottomNavigation.css` (10px)
6. **MEDIUM** — Add `focus-visible` styles to all interactive elements lacking them
7. **MEDIUM** — Remove `duplicate @keyframes spin` from `SongRedirectView.css`
8. **MEDIUM** — Standardize breakpoints (480/600/767/768 → consistent mobile/tablet/desktop)
9. **MEDIUM** — Add `@supports not (backdrop-filter)` fallback to all glass components
10. **MEDIUM** — Replace `transition: all` with specific property transitions in Button, IconButton, Sidebar
