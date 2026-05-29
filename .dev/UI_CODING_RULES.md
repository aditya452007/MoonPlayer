# MoonPlayer -- UI Coding Rules

> **Version**: 1.0
> **Enforced by**: All agents and contributors
> **Source**: `DECISIONS_DIGEST.md` Section 1 (Design Identity)

---

## 1. CSS Architecture

### Global Styles Structure

```
src/styles/
  index.css          -- CSS reset, :root tokens, global typography
  animations.css     -- All CSS keyframe animations
  utilities.css      -- Utility classes (sr-only, truncate, etc.)
```

### Component Styles Structure

```
src/components/SearchBar/
  SearchBar.jsx
  SearchBar.css      -- Scoped to this component ONLY
```

### Rules

1. **ALL visual values MUST use CSS custom properties**

```css
/* CORRECT */
.card {
  background: var(--bg-surface);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  font-family: var(--font-body);
}

/* FORBIDDEN -- hardcoded values */
.card {
  background: #12151A;
  color: white;
  border-radius: 8px;
  padding: 16px;
  font-family: Inter, sans-serif;
}
```

2. **No global class pollution** -- prefix component classes or use data attributes

```css
/* CORRECT */
.search-bar__input { }
.search-bar__results { }
.search-bar--focused { }

/* ALSO CORRECT */
[data-component="search-bar"] .input { }

/* FORBIDDEN */
.input { }
.results { }
.focused { }
```

3. **No `!important`** -- ever. Fix specificity instead.

4. **No inline styles in JSX** -- except for truly dynamic values (e.g., `style={{ '--progress': `${percent}%` }}`)

5. **No Tailwind, no CSS-in-JS, no styled-components**

---

## 2. Design Token Reference

### Spacing Scale (4px base grid)

| Token | Value | Usage |
|:---|:---|:---|
| `--space-1` | `4px` | Tight gaps, icon padding |
| `--space-2` | `8px` | Small gaps, inline spacing |
| `--space-3` | `12px` | Medium gaps |
| `--space-4` | `16px` | Default component padding |
| `--space-5` | `20px` | Section gaps |
| `--space-6` | `24px` | Card padding |
| `--space-8` | `32px` | Section spacing |
| `--space-10` | `40px` | Large section gaps |
| `--space-12` | `48px` | Page-level spacing |
| `--space-16` | `64px` | Hero spacing |

### Border Radius

| Token | Value | Usage |
|:---|:---|:---|
| `--radius-sm` | `4px` | Small elements (badges, chips) |
| `--radius-md` | `8px` | Cards, inputs |
| `--radius-lg` | `12px` | Modals, panels |
| `--radius-xl` | `16px` | Large panels |
| `--radius-full` | `9999px` | Pills, circular elements |

### Typography Scale

| Token | Value | Usage |
|:---|:---|:---|
| `--font-heading` | `'Space Grotesk', sans-serif` | h1-h6, display text |
| `--font-body` | `'Inter', sans-serif` | Body text, UI labels |
| `--font-mono` | `'JetBrains Mono', monospace` | Code, data |
| `--text-xs` | `0.75rem` (12px) | Captions, timestamps |
| `--text-sm` | `0.875rem` (14px) | Secondary text, labels |
| `--text-base` | `1rem` (16px) | Body text |
| `--text-lg` | `1.125rem` (18px) | Subheadings |
| `--text-xl` | `1.25rem` (20px) | Section headings |
| `--text-2xl` | `1.5rem` (24px) | Page headings |
| `--text-3xl` | `1.875rem` (30px) | Hero text |
| `--text-4xl` | `2.25rem` (36px) | Display text |

### Z-Index Scale

| Token | Value | Usage |
|:---|:---|:---|
| `--z-base` | `0` | Normal flow |
| `--z-dropdown` | `100` | Dropdowns, popovers |
| `--z-sticky` | `200` | Sticky headers |
| `--z-sidebar` | `300` | Sidebar overlay (mobile) |
| `--z-modal` | `400` | Modals, sheets |
| `--z-toast` | `500` | Toast notifications |
| `--z-pet` | `550` | Pet overlay |
| `--z-miniPlayer` | `600` | Mini-player |
| `--z-splash` | `700` | Splash screen |
| `--z-tooltip` | `800` | Tooltips |

### Shadows

| Token | Value | Usage |
|:---|:---|:---|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | Subtle lift |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.4)` | Cards |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.5)` | Modals, elevated panels |
| `--shadow-glow` | `0 0 20px rgba(107,163,214,0.15)` | Moonlight glow on focus |

### Transition Presets

| Token | Value | Usage |
|:---|:---|:---|
| `--ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | General transitions |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Enter animations |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Exit animations |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bouncy interactions |
| `--duration-fast` | `150ms` | Micro-interactions |
| `--duration-normal` | `250ms` | Standard transitions |
| `--duration-slow` | `400ms` | Page transitions |
| `--duration-splash` | `1500ms` | Splash screen animation |

---

## 3. Component Patterns

### Component File Structure

```jsx
// SearchBar.jsx
import { useState, useCallback } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { usePlayerStore } from '../../stores/playerStore';
import './SearchBar.css';

export function SearchBar() {
  // 1. Hooks (state, store, effects)
  // 2. Handlers
  // 3. Computed values
  // 4. Render
  return (
    <div className="search-bar" data-component="search-bar">
      {/* ... */}
    </div>
  );
}
```

### Rules

1. **Named exports only** (no default exports)
2. **One component per file** (split if > 300 lines)
3. **data-component attribute** on root element for debugging
4. **Unique IDs** on all interactive elements

```jsx
/* CORRECT */
<button id="play-pause-btn" aria-label="Play">

/* FORBIDDEN */
<button onClick={play}>
```

5. **No anonymous event handlers in JSX** -- extract to named functions

```jsx
/* CORRECT */
const handlePlay = useCallback(() => { ... }, []);
<button onClick={handlePlay}>

/* FORBIDDEN */
<button onClick={() => playerStore.play()}>
```

6. **Semantic HTML** -- use `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<header>`, `<footer>`

7. **Single `<h1>` per view** -- proper heading hierarchy (h1 > h2 > h3, never skip)

---

## 4. Glassmorphism Implementation

### Glass Panel (for sidebar, mini-player, fullscreen player)

```css
.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
}
```

### Solid Panel (for cards, lists, non-glass surfaces)

```css
.solid-panel {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}
```

### Glass ONLY on these surfaces:
- Fullscreen player (blurs album art background)
- Desktop sidebar
- Mini-player / floating playbar
- Modal overlays

### Glass NEVER on:
- Track list items
- Search results
- Settings page
- Library/playlist views
- Regular content cards

---

## 5. Responsive Patterns

### Breakpoint Usage

```css
/* Mobile-first approach */
.component {
  /* Mobile styles (default) */
  padding: var(--space-4);
}

@media (min-width: 768px) {
  .component {
    /* Tablet styles */
    padding: var(--space-6);
  }
}

@media (min-width: 1024px) {
  .component {
    /* Desktop styles */
    padding: var(--space-8);
  }
}
```

### Breakpoint Tokens

```css
/* In index.css -- for reference only, use in @media queries */
/* --bp-tablet: 768px */
/* --bp-desktop: 1024px */
/* --bp-wide: 1440px */
```

### Layout Components

- `MobileView.jsx` -- renders for `< 768px`
- `TabletView.jsx` -- renders for `768px - 1024px`
- `DesktopView.jsx` -- renders for `> 1024px`
- Layout switch happens in `App.jsx` using `window.matchMedia` or a custom `useBreakpoint` hook

---

## 6. Animation Rules

### CSS Animations (micro-interactions)

```css
/* Hover glow */
.interactive-element:hover {
  box-shadow: var(--shadow-glow);
  transition: box-shadow var(--duration-fast) var(--ease-default);
}

/* Loading shimmer */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-surface) 25%,
    var(--bg-elevated) 50%,
    var(--bg-surface) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

### Framer Motion (page transitions, gestures)

```jsx
import { motion, AnimatePresence } from 'framer-motion';

// Page transition
<AnimatePresence mode="wait">
  <motion.div
    key={location.pathname}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

### GSAP (VibeTune visualizer only)

```jsx
// Only in VibeTune components
import { gsap } from 'gsap';

// Timeline-based visualizer sequences
const tl = gsap.timeline({ repeat: -1 });
tl.to('.particle', { ... });
```

### Rules
1. **`prefers-reduced-motion`** -- ALL animations must respect this media query
2. **No animation > 400ms** for UI interactions (except splash screen)
3. **Framer Motion components lazy-loaded** -- not in the initial bundle
4. **GSAP only in VibeTune** -- nowhere else in the app

---

## 7. Accessibility Requirements

### Minimum Standards
- WCAG 2.1 AA compliance
- All interactive elements keyboard-accessible
- Focus visible on all focusable elements (using `--border-focus`)
- Screen reader announcements for state changes (song change, queue update)
- `aria-label` on all icon-only buttons
- `aria-live="polite"` on toast notification regions
- Touch targets minimum 44x44px on mobile

### Color Contrast
- Primary text (`--text-primary`) on background (`--bg-void`): minimum 7:1
- Secondary text (`--text-secondary`) on background: minimum 4.5:1
- Interactive elements (`--accent-moon`) on background: minimum 4.5:1

---

## 8. Icon Usage

```jsx
// CORRECT -- tree-shakeable import
import { Play, Pause, SkipForward } from '@phosphor-icons/react';

<Play size={24} weight="light" color="var(--text-primary)" />

// FORBIDDEN -- barrel import
import * as Icons from '@phosphor-icons/react';
```

### Icon Sizes
| Context | Size | Token |
|:---|:---|:---|
| Inline with text | 16px | `--icon-sm` |
| Button icon | 20px | `--icon-md` |
| Navigation icon | 24px | `--icon-lg` |
| Hero/feature icon | 32px | `--icon-xl` |
| Splash logo | 64-128px | Custom |

---

## 9. Forbidden Patterns

| Pattern | Reason | Alternative |
|:---|:---|:---|
| `dangerouslySetInnerHTML` | XSS risk | Decode in adapter layer |
| Inline styles (except dynamic vars) | Unmaintainable | CSS custom properties |
| Hardcoded colors/fonts/sizes | Breaks theming | CSS custom properties |
| `!important` | Specificity war | Fix selector specificity |
| `console.log` in production | Noise | Remove or use logger |
| Direct API calls from components | Breaks abstraction | Use `MusicService` |
| Default exports | Inconsistent naming | Named exports only |
| Anonymous handlers in JSX | Re-render waste | `useCallback` + named |
| Barrel import of icons | Bundle bloat | Individual imports |
| `var` keyword | Scope bugs | `const` or `let` |
| `any` type (if using TS) | Defeats typing | Proper types |
| Nested ternaries in JSX | Unreadable | Extract to variables/components |
