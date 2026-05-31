# MoonPlayer Visual Design & Theme System — Implementation Guide

**Reference**: BloomeeTunes (Flutter/Dart) → MoonPlayer (React/JSX)  
**Goal**: Elevate MoonPlayer's visual design system to match BloomeeTunes' color richness, typography role system, glassmorphism strategy, dynamic ambient backgrounds, and component-level theming.

---

## 1. Expanded Color System

### What BloomeeTunes Does
BloomeeTunes defines 7 semantically named colors with distinct roles:
| Variable | Role | Hex |
|----------|------|-----|
| `themeColor` | App background (near-black) | `#0A040C` |
| `primaryColor1` | Light blue surface tint | `#DAEAF7` |
| `primaryColor2` | Light pink surface tint | `#F2E7F0` |
| `accentColor1` | Cyan-blue action accent | `#0EA5E0` |
| `accentColor2` | Red-pink primary accent | `#FE385E` |
| `successColor` | Positive feedback | `#5EFF43` |
| Material 3 Dark ColorScheme | Dark theme with 10+ derived surface/on-surface colors | — |

Color roles are **semantic** — they communicate intent (primary, accent, success) rather than just surface structure.

### What We Have
MoonPlayer has 7 CSS custom properties for color:

```css
--bg-void: #000000;
--bg-surface: #000000;
--bg-elevated: #080808;
--text-primary: #D4E0ED;
--accent-moon: #6BA3D6;
--accent-glow: #E8C87A;
--glass-bg: rgba(0, 0, 0, 0.75);
```

We do have error/success/warning vars at lines 35-37 of `index.css`, but they are:
- Not defined in the `:root` token section alongside the core colors (`--error`, `--success`, `--warning` appear at line 35-37, physically separated)
- Missing opacity variants for overlays
- Missing secondary accent, surface variant levels (void/surface/elevated/overlay/highlight all exist but no medium-mid-tone surface)

### The Gap
1. No secondary accent color (BloomeeTunes uses both `accentColor1` cyan-blue and `accentColor2` red-pink)
2. No color opacity system — glass-bg is hardcoded as `rgba(0,0,0,0.75)`, borders use arbitrary opacity values
3. No surface hierarchy beyond 4 levels (void, surface, elevated, overlay)
4. Error/success/warning exist but are not categorized as semantic tokens
5. No system for deriving text-on-color foregrounds

### Implementation Steps

**Step 1: Expand `:root` color tokens in `src/styles/index.css`**

Add the following tokens to the `:root` block, grouped by category with comments:

```css
/* -- Colors: Background Surface Hierarchy -- */
--bg-void: #000000;
--bg-surface: #000000;
--bg-elevated: #080808;
--bg-overlay: #101010;
/* NEW */
--bg-surface-raised: #050505;    /* halfway between void and surface */
--bg-elevated-2: #121212;        /* second elevated tier for dropdowns/modals */

/* -- Colors: Text -- */
--text-primary: #D4E0ED;
--text-secondary: #8B9DC3;
--text-tertiary: #6B7A99;
/* NEW */
--text-inverse: #030508;         /* for text on light/colored backgrounds */
--text-on-accent: #FFFFFF;       /* text over accent-moon (BloomeeTunes: onPrimary) */
--text-disabled: rgba(212, 224, 237, 0.35); /* disabled text */

/* -- Colors: Accents -- */
--accent-moon: #6BA3D6;          /* primary action accent (BloomeeTunes: accentColor1 analogous) */
--accent-glow: #E8C87A;          /* gold/amber highlight accent */
/* NEW */
--accent-secondary: #FE385E;     /* BloomeeTunes: accentColor2 — red-pink for premium CTAs, badges, favorite heart */
--accent-moon-hover: #82B3E4;    /* hover state for accent-moon */
--accent-moon-active: #5289C0;   /* active/pressed state for accent-moon */

/* -- Colors: Semantic / Feedback -- */
--error: #E5484D;
--error-bg: rgba(229, 72, 77, 0.12);   /* error background tint */
--success: #46A758;
--success-bg: rgba(70, 167, 88, 0.12);
--warning: #F5A623;
--warning-bg: rgba(245, 166, 35, 0.12);
/* NEW */
--info: #0EA5E0;                        /* BloomeeTunes: accentColor1 — for informational badges */
--info-bg: rgba(14, 165, 224, 0.12);

/* -- Colors: Opacity System (for overlays, dividers, scrims) -- */
--overlay-subtle: rgba(0, 0, 0, 0.50);
--overlay-medium: rgba(0, 0, 0, 0.70);
--overlay-heavy: rgba(0, 0, 0, 0.85);

/* -- Colors: Border Opacity Scale -- */
--border-subtle: rgba(212, 224, 237, 0.04);
--border-default: rgba(212, 224, 237, 0.10);
--border-medium: rgba(212, 224, 237, 0.18);   /* NEW — for hovered panels */
--border-strong: rgba(212, 224, 237, 0.30);    /* NEW — for focus/active states */
--border-focus: rgba(107, 163, 214, 0.50);

/* -- Colors: Glass Background Variants -- */
--glass-bg: rgba(0, 0, 0, 0.75);
--glass-bg-light: rgba(10, 13, 20, 0.60);    /* subtler glass */
--glass-bg-heavy: rgba(18, 21, 26, 0.85);    /* heavier glass (options drawer, modals) */
--glass-border: rgba(212, 224, 237, 0.10);
--glass-border-hover: rgba(107, 163, 214, 0.25);

/* -- Colors: Gradient Presets -- */
--gradient-premium: linear-gradient(135deg, var(--accent-secondary) 0%, #FF6B8A 100%);
--gradient-play: linear-gradient(135deg, var(--accent-moon) 0%, var(--accent-moon-hover) 100%);
--gradient-liked-songs: linear-gradient(135deg, #FE385E 0%, #FF6B8A 100%);
--gradient-surface: linear-gradient(180deg, var(--bg-elevated) 0%, var(--bg-void) 100%);
```

**Step 2: Update `--glass-bg` and border tokens usage across all components**

Replace hardcoded `rgba()` values in component CSS files with token references:
- `FullscreenPlayer.css` line 225: `background: linear-gradient(135deg, var(--accent-moon) 0%, var(--primary-light) 100%)` — keep, already using tokens
- `FullscreenPlayer.css` line 141: `background: rgba(13, 17, 23, 0.95)` → replace with `var(--glass-bg-heavy)`
- `FullscreenPlayer.css` line 131: `background: rgba(0, 0, 0, 0.55)` → replace with `var(--overlay-subtle)`
- `MiniPlayer.css` line 11: `background-color: var(--primary)` — define `--primary` as `var(--accent-moon)` (already at line 25 in index.css)
- Various `rgba(107, 163, 214, 0.xx)` → use `--border-focus`, `--glass-border-hover`, or create specific alpha variants

**Step 3: Add surface color utility classes to `src/styles/utilities.css`**

```css
/* -- Surface Colors -- */
.bg-void        { background-color: var(--bg-void); }
.bg-surface     { background-color: var(--bg-surface); }
.bg-elevated    { background-color: var(--bg-elevated); }
.bg-overlay     { background-color: var(--bg-overlay); }

/* -- Text Colors -- */
.text-primary   { color: var(--text-primary); }
.text-secondary { color: var(--text-secondary); }
.text-tertiary  { color: var(--text-tertiary); }
.text-accent    { color: var(--accent-moon); }
.text-error     { color: var(--error); }
.text-success   { color: var(--success); }
```

### Files Affected
- `src/styles/index.css` — expand `:root` color tokens
- `src/styles/utilities.css` — add color utility classes
- `src/components/player/FullscreenPlayer/FullscreenPlayer.css` — replace hardcoded rgba values with tokens
- `src/components/player/MiniPlayer/MiniPlayer.css` — replace hardcoded rgba values with tokens
- `src/components/common/GlassToast/GlassToast.css` — replace hardcoded rgba values with tokens

### Impact Notes
- All existing code using `var(--bg-*)`, `var(--text-*)`, `var(--border-*)` continues to work unchanged
- New token names follow existing convention (kebab-case, `--category-property`)
- No runtime cost — CSS custom properties
- `--accent-secondary` (#FE385E) is BloomeeTunes' red-pink accent, used for premium buttons, favorite heart, notification badges

---

## 2. Typography Refinement

### What BloomeeTunes Does
BloomeeTunes uses **7 font families** with specific weight roles:

| Font | Role | Weights |
|------|------|---------|
| Unageo | Headings/Display | 400–900 |
| Gilroy | Body text | Regular, Medium, Bold (700), Black (900) |
| CodePro | Monospace/code | — |
| ReThink-Sans | UI elements (buttons, labels) | 400–800 |
| NotoSans | Variable fallback (CJK/wide lang) | variable |
| Fjalla | Display titles (hero, large headings) | — |
| FontAwesome | Icons | Brands, Regular, Solids |

Key pattern: **one font per role** — headings, body, UI, monospace, icons each have dedicated families.

### What We Have
MoonPlayer has 3 font families:

```css
--font-heading: 'Space Grotesk', sans-serif;
--font-body: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

Text size scale: `--text-xs` (12px) through `--text-4xl` (36px).
Line heights: `--leading-tight` (1.2), `--leading-normal` (1.5), `--leading-relaxed` (1.65).
No weight tokens. No label/caption/title/display role differentiation beyond h1–h6 using `--font-heading`.

### The Gap
1. No distinction between display (hero) and heading (section) typography — both use Space Grotesk
2. No UI-specific font family for buttons, input labels, badges (BloomeeTunes: ReThink-Sans)
3. No weight tokens — weights are hardcoded (600 for headings, 600 for buttons, etc.)
4. No type scale roles: display, headline, title, body, label, caption (h1–h6 are just scaled headings)
5. No letter-spacing tokens
6. No caption/overline style for metadata

### Implementation Steps

**Step 1: Add font weight tokens and letter-spacing tokens to `:root` in `src/styles/index.css`**

```css
/* -- Typography: Font Family Roles -- */
--font-display: 'Space Grotesk', sans-serif;  /* BloomeeTunes: Unageo/Fjalla — hero, large titles */
--font-heading: 'Space Grotesk', sans-serif;   /* BloomeeTunes: Unageo — section headings */
--font-body: 'Inter', sans-serif;              /* BloomeeTunes: Gilroy — body copy */
--font-ui: 'Inter', sans-serif;                /* NEW — BloomeeTunes: ReThink-Sans — buttons, labels, inputs */
--font-mono: 'JetBrains Mono', monospace;      /* BloomeeTunes: CodePro */
/* NEW — system font for UI safety */
--font-system: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;

/* -- Typography: Font Weights -- */
--weight-light: 300;
--weight-regular: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;
--weight-extrabold: 800;
--weight-black: 900;

/* -- Typography: Scale with Roles -- */
--text-display: 2.75rem;    /* 44px — hero titles */
--text-headline: 2.25rem;   /* 36px — page headlines (= old --text-4xl) */
--text-title-1: 1.5rem;     /* 24px — section titles (= old --text-2xl) */
--text-title-2: 1.25rem;    /* 20px — card titles (= old --text-xl) */
--text-title-3: 1.125rem;   /* 18px — sub-section titles (= old --text-lg) */
--text-body: 1rem;          /* 16px — body copy (= old --text-base) */
--text-body-sm: 0.875rem;   /* 14px — compact body (= old --text-sm) */
--text-label: 0.8125rem;    /* 13px — button text, input labels */
--text-caption: 0.75rem;    /* 12px — metadata, timestamps (= old --text-xs) */
--text-overline: 0.6875rem; /* 11px — uppercase labels, badges */  /* NEW */
--text-micro: 0.625rem;     /* 10px — tiny timestamps, version */

/* Keep old tokens as aliases for backwards compatibility */
--text-xs: var(--text-caption);
--text-sm: var(--text-body-sm);
--text-base: var(--text-body);
--text-lg: var(--text-title-3);
--text-xl: var(--text-title-2);
--text-2xl: var(--text-title-1);
--text-3xl: var(--text-headline);
--text-4xl: var(--text-display);

/* -- Typography: Letter Spacing -- */
--tracking-tight: -0.02em;
--tracking-normal: 0em;
--tracking-wide: 0.04em;
--tracking-wider: 0.08em;
--tracking-overline: 0.12em;  /* for uppercase labels */
```

**Step 2: Update HTML `h1`–`h6` rules to use role-based sizing**

```css
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-tight);
  color: var(--text-primary);
}
h1 { font-size: var(--text-headline); }
h2 { font-size: var(--text-title-1); }
h3 { font-size: var(--text-title-2); }
h4 { font-size: var(--text-title-3); }
h5 { font-size: var(--text-body); }
h6 { font-size: var(--text-body-sm); }
```

**Step 3: Add `.display-text` utility class for hero/display usage**

```css
.display-text {
  font-family: var(--font-display);
  font-size: var(--text-display);
  font-weight: var(--weight-bold);
  line-height: 1.1;
  letter-spacing: var(--tracking-tight);
}
```

**Step 4: Update `src/styles/utilities.css` with text style utility classes**

```css
/* -- Typography Role Utilities -- */
.text-display  { font-family: var(--font-display); font-size: var(--text-display); font-weight: var(--weight-bold); line-height: 1.1; letter-spacing: var(--tracking-tight); }
.text-headline { font-family: var(--font-heading); font-size: var(--text-headline); font-weight: var(--weight-semibold); }
.text-title-1  { font-family: var(--font-heading); font-size: var(--text-title-1); font-weight: var(--weight-semibold); }
.text-title-2  { font-family: var(--font-heading); font-size: var(--text-title-2); font-weight: var(--weight-semibold); }
.text-title-3  { font-family: var(--font-heading); font-size: var(--text-title-3); font-weight: var(--weight-semibold); }
.text-body     { font-family: var(--font-body); font-size: var(--text-body); }
.text-body-sm  { font-family: var(--font-body); font-size: var(--text-body-sm); }
.text-label    { font-family: var(--font-ui); font-size: var(--text-label); font-weight: var(--weight-medium); }
.text-caption  { font-family: var(--font-body); font-size: var(--text-caption); color: var(--text-tertiary); }
.text-overline { font-family: var(--font-ui); font-size: var(--text-overline); font-weight: var(--weight-semibold); letter-spacing: var(--tracking-overline); text-transform: uppercase; }
```

**Step 5: Apply role-specific fonts to components in codebase**

| Component | Current | Should Use |
|-----------|---------|------------|
| Button text | `font-family: var(--font-body)` | `font-family: var(--font-ui)` |
| IconButton text | `font-family: inherit` (body) | `font-family: var(--font-ui)` |
| TrackCard title | `font-family: var(--font-body)` | `font-family: var(--font-heading)` for titles, `var(--font-body)` for artist |
| MiniPlayer title | `font-family: var(--font-body)` | `font-family: var(--font-heading)` |
| FullscreenPlayer title | `font-family: var(--font-heading)` | keep (already correct) |
| HeroSlideshow title | — (currently no dedicated) | Use `.display-text` utility |
| SearchBar input | `font-family: inherit` (body) | `font-family: var(--font-ui)` |
| Labels/badges | body font | `font-family: var(--font-ui)` with `--text-label` |

### Files Affected
- `src/styles/index.css` — add weight/letter-spacing/role-scale tokens, update h1–h6 rules
- `src/styles/utilities.css` — add role-based text utilities
- `src/components/common/Button/Button.css` — change `font-family` to `var(--font-ui)`
- `src/components/common/IconButton/IconButton.css` — inline styles use `var(--font-ui)` if needed
- `src/components/common/TrackCard/TrackCard.css` — `.track-card__title` use `var(--font-heading)`
- `src/components/player/MiniPlayer/MiniPlayer.css` — title use `var(--font-heading)`

### Impact Notes
- Backwards compatible — old `--text-*` aliases preserved
- ~0.3KB added to `index.css` for new tokens
- Font loading unchanged (Space Grotesk, Inter, JetBrains Mono still used; no new Google Fonts)
- BloomeeTunes' pattern of role-specific fonts achieved without adding extra web font downloads

---

## 3. Design Token Architecture

### What BloomeeTunes Does
BloomeeTunes defines its design system as Dart `ThemeData` — a single object with 200+ lines of configuration passed through the widget tree. Categories include:
- `ColorScheme` (Material 3 dark)
- `TextTheme` (13 text style slots)
- `CardTheme`, `SwitchTheme`, `SearchBarTheme`, `ScrollbarTheme`, `SliderTheme`, `BottomNavigationBarTheme`
- `AppBarTheme`, `TabBarTheme`, `DialogTheme`, `SnackBarTheme`
- `IconTheme` (size, color)
- All accessible via `Theme.of(context)` at any level

### What We Have
MoonPlayer uses flat CSS custom properties in `:root` inside `src/styles/index.css`:
- 1 file, 121 lines of `:root` variable definitions
- Categories: Colors (22 vars), Typography (13 vars), Spacing (10 vars), Border Radius (5 vars), Shadows (5 vars), Z-Index (11 vars), Transitions (8 vars), Icon Sizes (4 vars), Layout (5 vars)
- No component-level theme tokens (no button-, card-, switch-specific tokens)
- No animation timing tokens beyond duration/easing
- No separation between global tokens and component tokens

### The Gap
1. CSS vars are all flat in one file — no category grouping with clear section headers (currently structured with comments, but tokens from different categories intermingle — e.g., `--ease-default` is under `/* -- Transitions -- */` but after Z-Index)
2. No component-level design tokens (button padding, card padding, switch dimensions)
3. No `@supports`-based fallback strategy for older browsers
4. No token documentation/comments explaining usage
5. No token naming convention that encodes category → property → variant

### Implementation Steps

**Step 1: Restructure `src/styles/index.css` with strict category ordering and documentation headers**

The final token order should be:

```
:root {
  /* 1. COLORS */
     --bg-void: ...             /* Background: deepest level */
     ...
     --gradient-premium: ...    /* Gradient presets */

  /* 2. TYPOGRAPHY */
     --font-display: ...        /* Font families by role */
     --weight-bold: ...         /* Font weight scale */
     --text-display: ...        /* Type scale */
     --tracking-tight: ...      /* Letter spacing */

  /* 3. SPACING */
     --space-1: ...             /* 4px base grid */
     --section-gap: ...         /* Section rhythm tokens (NEW) */
     --card-gap: ...

  /* 4. BORDER RADIUS */
     --radius-sm: ...           /* Shape scale */

  /* 5. SHADOWS */
     --shadow-sm: ...           /* Elevation shadows */
     --shadow-glow: ...         /* Glow effects */

  /* 6. Z-INDEX */
     --z-base: ...              /* Layer scale */

  /* 7. ANIMATION */
     --ease-default: ...        /* Easing curves */
     --duration-fast: ...       /* Duration scale */

  /* 8. ICON SIZES */
     --icon-sm: ...             /* Icon dimension scale */

  /* 9. LAYOUT */
     --sidebar-width: ...        /* Fixed layout dimensions */

  /* 10. COMPONENT TOKENS (NEW) */
     --button-height-sm: 32px;
     --button-height-md: 40px;
     --button-height-lg: 48px;
     --button-radius: var(--radius-full);
     --button-font-weight: var(--weight-semibold);
     ...
}
```

**Step 2: Add Component Design Tokens to `:root`**

```css
/* -- Component Tokens: Button -- */
--button-height-sm: 32px;
--button-height-md: 40px;
--button-height-lg: 48px;
--button-padding-sm: 0 var(--space-4);
--button-padding-md: 0 var(--space-5);
--button-padding-lg: 0 var(--space-6);
--button-radius: var(--radius-full);
--button-font-weight: var(--weight-semibold);
--button-icon-gap: var(--space-2);

/* -- Component Tokens: IconButton -- */
--iconbutton-size-sm: 28px;
--iconbutton-size-md: 36px;
--iconbutton-size-lg: 44px;
--iconbutton-size-xl: 56px;
--iconbutton-touch-target: 44px;

/* -- Component Tokens: Card -- */
--card-padding: var(--space-3);
--card-gap: var(--space-3);
--card-radius: var(--radius-sm);

/* -- Component Tokens: Panel (Solid) -- */
--panel-radius: var(--radius-md);
--panel-padding: var(--space-4);

/* -- Component Tokens: Glass -- */
--glass-radius: var(--radius-lg);
--glass-blur-default: 12px;
--glass-blur-light: 8px;
--glass-blur-heavy: 24px;
--glass-blur-toast: 24px;

/* -- Component Tokens: Section Rhythm -- */
--section-gap: var(--space-8);         /* gap between home sections */
--section-header-gap: var(--space-4);  /* gap between section title and content */
--grid-gap: var(--space-4);            /* gap between grid items */
--list-gap: var(--space-2);            /* gap between list items */
```

**Step 3: Update existing component CSS files to reference component tokens**

`Button.css` changes:
```css
/* Replace hardcoded values: */
.button {
  border-radius: var(--button-radius);
  font-weight: var(--button-font-weight);
}
.button__content {
  gap: var(--button-icon-gap);
}
.button--sm {
  height: var(--button-height-sm);
  padding: var(--button-padding-sm);
  font-size: var(--text-label);
}
.button--md {
  height: var(--button-height-md);
  padding: var(--button-padding-md);
  font-size: var(--text-body-sm);
}
.button--lg {
  height: var(--button-height-lg);
  padding: var(--button-padding-lg);
  font-size: var(--text-body);
}
```

`IconButton.css` changes:
```css
.icon-button::before {
  width: var(--iconbutton-touch-target);
  height: var(--iconbutton-touch-target);
}
.icon-button--sm { width: var(--iconbutton-size-sm); height: var(--iconbutton-size-sm); }
.icon-button--md { width: var(--iconbutton-size-md); height: var(--iconbutton-size-md); }
.icon-button--lg { width: var(--iconbutton-size-lg); height: var(--iconbutton-size-lg); }
.icon-button--xl { width: var(--iconbutton-size-xl); height: var(--iconbutton-size-xl); }
```

`SolidPanel.css` changes:
```css
.solid-panel {
  border-radius: var(--panel-radius);
}
```

`GlassPanel.css` changes:
```css
.glass-panel {
  backdrop-filter: blur(var(--glass-blur-default));
  border-radius: var(--glass-radius);
}
.glass-panel--light {
  backdrop-filter: blur(var(--glass-blur-light));
}
.glass-panel--heavy {
  backdrop-filter: blur(var(--glass-blur-heavy));
  background: var(--glass-bg-heavy);
}
```

**Step 4: Add an optional ThemeContext provider (only if dynamic theme switching is desired)**

Create `src/context/ThemeContext.jsx`:

```jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = 'moonplayer-theme';

export function ThemeProvider({ children }) {
  const [accentOverride, setAccentOverride] = useState(null); // e.g., #FE385E for dynamic accent

  // Load saved accent preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved) setAccentOverride(saved);
    } catch {}
  }, []);

  const setAccent = useCallback((color) => {
    setAccentOverride(color);
    try { localStorage.setItem(THEME_STORAGE_KEY, color); } catch {}
    // Apply to CSS custom property
    if (color) {
      document.documentElement.style.setProperty('--accent-dynamic', color);
    } else {
      document.documentElement.style.removeProperty('--accent-dynamic');
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ accentOverride, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
```

Then wrap app in `App.jsx`:

```jsx
<ThemeProvider>
  <AppShell>
    ...
  </AppShell>
</ThemeProvider>
```

Define `--accent-dynamic` in `:root` as a fallback:

```css
--accent-dynamic: var(--accent-moon);  /* default, can be overridden at runtime */
```

### Files Affected
- `src/styles/index.css` — restructure token order, add component tokens, section rhythm tokens
- `src/components/common/Button/Button.css` — reference component tokens
- `src/components/common/IconButton/IconButton.css` — reference component tokens
- `src/components/common/GlassPanel/GlassPanel.css` — reference glass tokens
- `src/components/common/SolidPanel/SolidPanel.css` — reference panel tokens
- `src/components/common/GlassToast/GlassToast.css` — reference glass-blur-toast
- `src/context/ThemeContext.jsx` — new file (optional, for dynamic accent switching)
- `src/App.jsx` — wrap with ThemeProvider (optional)

### Impact Notes
- Token restructure is pure CSS — no runtime cost
- Component tokens reduce magic numbers (BloomeeTunes' "no magic numbers" principle)
- Section rhythm tokens (`--section-gap: var(--space-8)`) standardize spacing between home page sections — BloomeeTunes uses consistent `gap` between all `CustomScrollView` children
- Grid/list gap tokens standardize the `gap` property in grid and list layouts

---

## 4. Glassmorphism & Surface Enhancement

### What BloomeeTunes Does
BloomeeTunes uses `BackdropFilter` for true frosted glass on specific surfaces:
- **Search bar**: frosted glass (always visible, sticky)
- **Plugin selector**: translucent overlay with backdrop blur
- **Mini player**: glass bottom sheet
- **Chart hero**: glass overlay on hero banners

For performance, BloomeeTunes avoids `BackdropFilter` on scrollable content areas and uses `ImageFiltered` (CSS filter blur on an image element) for album/playlist detail backgrounds:
```dart
// BloomeeTunes: ImageFiltered for album art background blur
ImageFiltered(
  imageFilter: ImageFilter.blur(sigmaX: 80, sigmaY: 80),
  child: Image.network(album.imageUrl)
)
```

Strategies for glass:
- **BackdropFilter** (true glass): static/overlay surfaces (search bar, mini player panel)
- **ImageFiltered** (blurred image): detail view backgrounds (album art blur, playlist art blur)
- Never on scrollable long lists (performance)

### What We Have
MoonPlayer has `GlassPanel` (`src/components/common/GlassPanel/GlassPanel.jsx`):
- 3 blur levels: `default` (12px), `light` (8px), `heavy` (24px)
- `background: rgba(0, 0, 0, 0.75)` with `backdrop-filter: blur()`
- `@supports not (backdrop-filter)` fallback to solid surface background
- Applied in: GlobalPlayer wrapper, sidebar, fullscreen player options drawer, toast

`SolidPanel` (`src/components/common/SolidPanel/SolidPanel.jsx`):
- `background: var(--bg-surface)` with `border: 1px solid var(--border-subtle)`
- Variants: elevated (bg-elevated + shadow), interactive (hover states)

### The Gap
1. No **variant system** for `GlassPanel` that maps blur levels to specific UI roles (BloomeeTunes: search bar uses one blur, mini player uses another)
2. No **ImageFiltered-equivalent** for album/playlist art backgrounds (currently only static gradient in `AppShell.css`)
3. No **frosted glass search bar** pattern (BloomeeTunes: sticky glass bar)
4. `SolidPanel` uses only `--bg-surface` — should have a `variant="glass"` option or clearer separation
5. No `@supports (backdrop-filter)` fallback for `GlassPanel--heavy` (current `GlassPanel.css` has the fallback at line 30 but it only applies to `.glass-panel`, not the modifier classes)

### Implementation Steps

**Step 1: Update `GlassPanel.jsx` to support role-based blur mapping**

Replace the current blur prop system with a more semantic `variant` prop:

```jsx
import './GlassPanel.css';

const BLUR_MAP = {
  default: 'var(--glass-blur-default)',  // 12px — general purpose
  light: 'var(--glass-blur-light)',      // 8px — subtle
  heavy: 'var(--glass-blur-heavy)',      // 24px — overlay panels
};

export function GlassPanel({ 
  children, 
  className = '', 
  as: Component = 'div', 
  variant = 'default',    // default, light, heavy, searchbar, miniplayer, toast
  ...props 
}) {
  // Map semantic variant names to blur modifiers
  let blurMod = '';
  if (variant === 'light') blurMod = 'glass-panel--light';
  else if (variant === 'heavy' || variant === 'toast') blurMod = 'glass-panel--heavy';
  else if (variant === 'searchbar') blurMod = 'glass-panel--searchbar';
  else if (variant === 'miniplayer') blurMod = 'glass-panel--miniplayer';
  
  return (
    <Component 
      className={`glass-panel ${blurMod} ${className}`.trim()}
      data-component="glass-panel"
      {...props}
    >
      {children}
    </Component>
  );
}
```

**Step 2: Add new glass variant CSS classes in `GlassPanel.css`**

```css
/* -- Glass Variants -- */
.glass-panel--searchbar {
  background: var(--glass-bg-light);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-full); /* pill shape for search bar */
}

.glass-panel--miniplayer {
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid var(--glass-border);
  border-radius: 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
}

/* -- Fallback for non-supporting browsers -- */
@supports not (backdrop-filter: blur(1px)) {
  .glass-panel--searchbar,
  .glass-panel--miniplayer {
    background: var(--bg-surface);
  }
}
```

**Step 3: Add `BlurredBackground` component (BloomeeTunes' ImageFiltered equivalent)**

Create `src/components/common/BlurredBackground/BlurredBackground.jsx`:

```jsx
import './BlurredBackground.css';

/**
 * BloomeeTunes-equivalent ImageFiltered component.
 * Renders an image blurred via CSS filter as a background.
 * Used for album/playlist/artist detail view backdrops.
 */
export function BlurredBackground({ 
  imageUrl, 
  dominantColor = 'var(--bg-void)',
  blurPx = 80,
  opacity = 0.3,
  className = '',
  children 
}) {
  return (
    <div 
      className={`blurred-background ${className}`.trim()}
      style={{ '--blur-px': `${blurPx}px`, '--bg-fallback': dominantColor }}
    >
      {imageUrl && (
        <img 
          src={imageUrl} 
          alt="" 
          className="blurred-background__image"
          aria-hidden="true"
          loading="lazy"
        />
      )}
      <div className="blurred-background__overlay" />
      {children && (
        <div className="blurred-background__content">
          {children}
        </div>
      )}
    </div>
  );
}
```

`BlurredBackground.css`:

```css
.blurred-background {
  position: relative;
  overflow: hidden;
  background: var(--bg-fallback, var(--bg-void));
}

.blurred-background__image {
  position: absolute;
  inset: -50%; /* expand beyond container to avoid edge artifacts at high blur */
  width: 200%;
  height: 200%;
  object-fit: cover;
  filter: blur(var(--blur-px, 80px));
  opacity: 0.3;
  pointer-events: none;
  will-change: transform;
}

.blurred-background__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    transparent 0%,
    var(--bg-void) 100%
  );
  pointer-events: none;
}

.blurred-background__content {
  position: relative;
  z-index: 1;
}
```

**Step 4: Apply `GlassPanel` variant to existing components**

| Current Component | Current Usage | New Variant |
|-------------------|---------------|-------------|
| `GlobalPlayer.jsx` — mobile/desktop wrapper | `GlassPanel blur="heavy"` | `variant="miniplayer"` |
| `FullscreenPlayer.css` — options drawer | inline `background: rgba(13,17,23,0.95)` + `backdrop-filter: blur(24px)` | Use `<GlassPanel variant="heavy" as="div">` |
| `GlassToast.jsx` | inline `backdrop-filter: blur(24px)` | `variant="toast"` (maps to heavy blur) |
| Sidebar | `GlassPanel` default | `variant="default"` (keep) |

### Files Affected
- `src/components/common/GlassPanel/GlassPanel.jsx` — add variant prop with role mapping
- `src/components/common/GlassPanel/GlassPanel.css` — add searchbar/miniplayer variant classes, fix `@supports` fallback for all modifiers
- `src/components/common/BlurredBackground/BlurredBackground.jsx` + `.css` — new files
- `src/components/player/GlobalPlayer/GlobalPlayer.jsx` — update GlassPanel variant prop
- `src/components/common/GlassToast/GlassToast.css` — reference glass-blur-toast token
- `src/components/player/FullscreenPlayer/FullscreenPlayer.css` — replace inline glass with component or token

### Impact Notes
- `BlurredBackground` is the exact React equivalent of BloomeeTunes' `ImageFiltered` for art backgrounds
- Using CSS `filter: blur()` and an `<img>` element (not CSS `backdrop-filter`) for art backgrounds = better performance (avoids the expensive composite of backdrop-filter)
- BloomeeTunes uses `sigmaX: 80, sigmaY: 80` → mapped to `blur(80px)`
- The `inset: -50%` on the image prevents edge-darkening artifacts at high blur values

---

## 5. Button & Interactive Component System

### What BloomeeTunes Does
BloomeeTunes "Premium" button pattern:
```dart
// BloomeeTunes: Premium button styling
Container(
  decoration: BoxDecoration(
    border: Border.all(color: accentColor2, width: 1.5),
    borderRadius: BorderRadius.circular(30),
    color: accentColor2.withOpacity(0.07), // thin tint background
  ),
  child: Text("Premium", style: TextStyle(color: accentColor2))
)
```

Key characteristics:
- **accentColor2 border** (1.5px, `#FE385E`) — red-pink, not the primary accent
- **Thin tint fill**: `accentColor2.withOpacity(0.07)` — barely visible, just enough to differentiate
- **Radius: 30** — pill shape, consistent with other buttons
- Used for CTAs that need attention (premium upsell, featured actions)

Button variants in BloomeeTunes:
- **Default** (primary): accent fill, white text
- **Premium** (outline-accent): accent border, thin tint, accent text
- **Ghost**: transparent, text-only
- **Icon**: circular, icon-only

### What We Have
MoonPlayer has 3 button variants in `src/components/common/Button/Button.jsx`:
- `primary`: white text color on dark bg (`var(--text-primary)` background with `var(--bg-void)` text) — inverted from typical "primary" pattern
- `secondary`: `var(--bg-surface)` bg with border-subtle, text-primary
- `ghost`: transparent bg, text-primary

Loading state: shimmer overlay with `opacity: 0` on content.

### The Gap
1. No "premium" / outline-accent variant — no way to draw attention using accent color
2. No dedicated focus-visible styles per variant (only global `:focus-visible` on all elements)
3. No active state on primary button (scale(0.98) only on secondary/ghost)
4. BloomeeTunes' premium button pattern (1.5px border + thin tint) is a proven pattern for conversion

### Implementation Steps

**Step 1: Add `premium` variant to `Button.jsx`**

```diff
- variant = 'primary', // primary, secondary, ghost
+ variant = 'primary', // primary, secondary, ghost, premium
```

**Step 2: Add premium CSS to `Button.css`**

```css
/* Premium — BloomeeTunes accent border + thin tint + accent color text */
.button--premium {
  background: rgba(254, 56, 94, 0.07);   /* accentColor2 tint — BloomeeTunes pattern */
  color: var(--accent-secondary);          /* #FE385E */
  border: 1.5px solid var(--accent-secondary);
  box-shadow: 0 0 16px rgba(254, 56, 94, 0.08); /* subtle glow */
}

.button--premium:hover:not(:disabled) {
  background: rgba(254, 56, 94, 0.15);
  color: var(--accent-secondary);
  border-color: var(--accent-secondary);
  transform: scale(1.02);
  box-shadow: 0 0 24px rgba(254, 56, 94, 0.18);
}

.button--premium:active:not(:disabled) {
  transform: scale(0.98);
  background: rgba(254, 56, 94, 0.20);
}
```

**Step 3: Add consistent focus-visible styles for all button variants**

Add to `Button.css` at the end of the file:

```css
/* -- Focus Visible (all variants) -- */
.button:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}
```

**Step 4: Add active state to primary button**

```diff
 .button--primary:hover:not(:disabled) {
   background: #ffffff;
   transform: scale(1.02);
   box-shadow: var(--shadow-md);
 }
+ 
+.button--primary:active:not(:disabled) {
+  transform: scale(0.98);
+}
```

**Step 5: Standardize hover/active/focus across all interactive components**

Ensure these four components all implement the same hover/active/focus pattern:

| Component | Hover | Active | Focus-visible |
|-----------|-------|--------|---------------|
| `Button` | scale(1.02) + bg change | scale(0.98) | outline + offset |
| `IconButton` | bg change | scale(0.92) + bg change | outline + offset (already has via global) |
| `SolidPanel` (interactive) | bg-elevated + border-default + shadow-sm | scale(0.98) | outline + shadow-glow (already has) |
| `TrackCard` | bg-elevated | — | inherits from SolidPanel interactive |

**Step 6: Apply `premium` variant to relevant CTAs**

| Location | Button | New Variant |
|----------|--------|-------------|
| Liked Songs card | "Play" or CTA | `premium` |
| Featured playlist card in home | CTA | `premium` |
| Download prompt | "Install" | `premium` |
| Premium upsell (future) | any | `premium` |

### Files Affected
- `src/components/common/Button/Button.jsx` — add `premium` to variant prop destructuring
- `src/components/common/Button/Button.css` — add `.button--premium`, add `.button:focus-visible`, add primary active state
- `src/components/common/IconButton/IconButton.css` — ensure `.icon-button:focus-visible` exists (currently relies on global, which is sufficient)

### Impact Notes
- The `premium` variant is a direct port of BloomeeTunes' accentColor2 button pattern
- No new dependencies — pure CSS
- Button variants now: primary (white/full), secondary (border), ghost (transparent), premium (accent outline + tint)
- Premium variant should be used sparingly — BloomeeTunes uses it for featured/paid CTAs only

---

## 6. Album Art Color Extraction

### What BloomeeTunes Does
BloomeeTunes uses `palette_generator` (Dart package) to extract dominant colors from album art:

```dart
// BloomeeTunes: Palette generation from album art
final PaletteGenerator paletteGenerator;
// Uses image URL → download → pixel analysis → dominant color(s)

// Applied to:
// 1. Fullscreen player background: radial gradient from extracted color
// 2. Ambient shadow in player: AlbumArtShadowWidget with extracted color
// 3. Detail page backdrops: gradient from extracted color to black
```

The extracted color is used in:
- `_PlayerUI`: `decoration: BoxDecoration(gradient: RadialGradient(...))` with extracted color
- `AlbumArtShadowWidget`: shadow glow matching art's dominant color
- Album detail view: background gradient from extracted color to `themeColor`

### What We Have
MoonPlayer has `src/core/utils/colorExtractor.js` (89 lines) that:
- Creates a `<canvas>` scaled to 50×50
- Averages all pixel RGB values
- Returns `'rgb(r, g, b)'` string
- Handles CORS errors with fallback
- Supports `AbortSignal` for cancellation

Used in `FullscreenPlayer.jsx` at line 116-119:
```jsx
useEffect(() => {
  if (currentTrack?.imageUrl) {
    extractDominantColor(currentTrack.imageUrl).then((color) => {
      setBgColor(color);
    });
  }
}, [currentTrack]);
```

But the extracted color is **only stored in state** (`bgColor`) and passed to `VisualizerContainer` — it is **not** used as:
- A background gradient in the FullscreenPlayer background
- An ambient glow/shadow around the album art
- A background tint in MiniPlayer
- A progress bar gradient color
- A backdrop in AlbumView/PlaylistView detail pages

### The Gap
1. `colorExtractor.js` is underutilized — extracted color stored but barely applied
2. No dynamic radial gradient in FullscreenPlayer background (BloomeeTunes' key visual feature)
3. No ambient glow around album art matching dominant color
4. MiniPlayer has no color-aware styling
5. Progress bar uses static accent-moon gradient (could be dynamic)
6. Album/playlist detail views have no color-extracted backgrounds

### Implementation Steps

**Step 1: Enhance `colorExtractor.js` to extract a palette (not just average)**

Add a function to extract 2-3 dominant colors for gradient use:

```js
/**
 * Extracts a color palette from an image URL.
 * Returns an array of dominant color strings, sorted by frequency.
 * BloomeeTunes' palette_generator equivalent.
 */
export function extractColorPalette(imageUrl, signal = null, colorCount = 3) {
  return new Promise((resolve) => {
    if (!imageUrl || signal?.aborted) {
      resolve(['rgb(26, 30, 37)']);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';

    let abortHandler;
    if (signal) {
      abortHandler = () => {
        img.src = '';
        resolve(['rgb(26, 30, 37)']);
      };
      signal.addEventListener('abort', abortHandler);
    }

    img.onload = () => {
      if (signal?.aborted) {
        if (abortHandler) signal.removeEventListener('abort', abortHandler);
        resolve(['rgb(26, 30, 37)']);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const size = 50;
      canvas.width = size;
      canvas.height = size;

      try {
        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size).data;

        // Simple color quantization: bucket colors into coarse bins
        const colorMap = new Map();
        const binSize = 32; // 8 bins per channel (256/32)

        for (let i = 0; i < imageData.length; i += 4) {
          if (imageData[i + 3] < 128) continue;
          const r = Math.floor(imageData[i] / binSize) * binSize + binSize / 2;
          const g = Math.floor(imageData[i + 1] / binSize) * binSize + binSize / 2;
          const b = Math.floor(imageData[i + 2] / binSize) * binSize + binSize / 2;
          const key = `${r},${g},${b}`;
          colorMap.set(key, (colorMap.get(key) || 0) + 1);
        }

        // Sort by frequency, return top colors
        const sorted = [...colorMap.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, colorCount)
          .map(([key]) => {
            const [r, g, b] = key.split(',').map(Number);
            return `rgb(${r}, ${g}, ${b})`;
          });

        resolve(sorted.length > 0 ? sorted : ['rgb(26, 30, 37)']);
      } catch (e) {
        resolve(['rgb(26, 30, 37)']);
      } finally {
        if (abortHandler) signal.removeEventListener('abort', abortHandler);
      }
    };

    img.onerror = () => {
      if (abortHandler) signal.removeEventListener('abort', abortHandler);
      resolve(['rgb(26, 30, 37)']);
    };

    img.src = imageUrl;
  });
}
```

**Step 2: Apply extracted color as FullscreenPlayer dynamic background gradient**

Update `FullscreenPlayer.jsx`:

```jsx
const [palette, setPalette] = useState(['rgb(26, 30, 37)']);

useEffect(() => {
  if (currentTrack?.imageUrl) {
    extractColorPalette(currentTrack.imageUrl, controller.signal, 2).then((colors) => {
      setPalette(colors);
      setBgColor(colors[0]);
    });
  }
}, [currentTrack]);

const backgroundStyle = {
  background: palette.length > 1
    ? `radial-gradient(ellipse at 50% 0%, ${palette[0]} 0%, ${palette[1]} 40%, var(--bg-void) 75%)`
    : `radial-gradient(ellipse at 50% 0%, ${palette[0]} 0%, var(--bg-void) 70%)`,
};
```

This is the exact pattern BloomeeTunes uses: `RadialGradient` from dominant color to black.

**Step 3: Add ambient glow around album art in FullscreenPlayer**

Update the art container in `FullscreenPlayer.css`:

```css
.fullscreen-player__art-container {
  box-shadow: 
    0 0 30px rgba(var(--glow-color-rgb), 0.15),
    0 8px 32px rgba(0, 0, 0, 0.5);
}
```

Apply via inline style:
```jsx
// Parse rgb string to use as glow shadow
const glowColor = bgColor.replace('rgb(', '').replace(')', '');
<div 
  className="fullscreen-player__art-container"
  style={{ boxShadow: `0 0 30px rgba(${glowColor}, 0.15), 0 8px 32px rgba(0, 0, 0, 0.5)` }}
>
```

This mirrors BloomeeTunes' `AlbumArtShadowWidget`.

**Step 4: Integrate color extraction into MiniPlayer for ambient glow**

Add a small glowy border/shadow to the MiniPlayer art based on extracted color:

```jsx
// In MiniPlayer.jsx
const [miniColor, setMiniColor] = useState(null);

useEffect(() => {
  if (currentTrack?.imageUrl) {
    extractDominantColor(currentTrack.imageUrl).then((color) => {
      setMiniColor(color);
    });
  }
}, [currentTrack]);

// Apply as box-shadow on the art
style={{
  boxShadow: miniColor ? `0 0 12px ${miniColor.replace('rgb', 'rgba').replace(')', ', 0.2)')}` : 'none'
}}
```

**Step 5: Integrate color extraction into detail views (AlbumView, PlaylistView)**

In `PlaylistView.jsx` and `AlbumView.jsx`, extract the dominant color from the cover art and render a `BlurredBackground`:

```jsx
const [bgColor, setBgColor] = useState('rgb(26, 30, 37)');

useEffect(() => {
  if (playlist?.tracks?.[0]?.imageUrl) {
    extractDominantColor(playlist.tracks[0].imageUrl).then(setBgColor);
  }
}, [playlist]);

// Render
<div className="playlist-view__backdrop" style={{ background: `linear-gradient(to bottom, ${bgColor}, var(--bg-void))` }}>
```

### Files Affected
- `src/core/utils/colorExtractor.js` — add `extractColorPalette()` function
- `src/components/player/FullscreenPlayer/FullscreenPlayer.jsx` — use palette for radial gradient + glow shadow
- `src/components/player/FullscreenPlayer/FullscreenPlayer.css` — update art-container shadow to support dynamic glow
- `src/components/player/MiniPlayer/MiniPlayer.jsx` — add dynamic glow shadow on art
- `src/views/pages/PlaylistView.jsx` — add color extraction for backdrop gradient
- `src/views/pages/AlbumView.jsx` — add color extraction for backdrop gradient (when created)
- `src/components/player/ProgressBar/ProgressBar.jsx` — optionally pass dominant color for gradient fill

### Impact Notes
- Color palette extraction uses the same 50×50 canvas approach as BloomeeTunes' `palette_generator` equivalent
- Performance: extraction runs once per track change (~10-50ms on modern devices)
- CORS-fallback: if extraction fails (tainted canvas), gracefully falls back to default bg
- Radial gradient is more performant than a blurred image because it's a pure CSS gradient, not a filter operation
- Ambient glow shadow in `.fullscreen-player__art-container` creates BloomeeTunes' album art "halo" effect

---

## 7. Scrollbar & Component Theming

### What BloomeeTunes Does
BloomeeTunes defines component-level themes via Material 3 `ThemeData`:

**ScrollbarTheme**:
```dart
// BloomeeTunes: Custom scrollbar
scrollbarTheme: ScrollbarThemeData(
  thumbColor: WidgetStateProperty.all(accentColor2), // #FE385E
  interactive: true,
  thickness: WidgetStateProperty.all(6),
  radius: const Radius.circular(4),
)
```

**SwitchTheme**:
```dart
// BloomeeTunes: Custom switch
switchTheme: SwitchThemeData(
  thumbColor: WidgetStateProperty.resolveWith((states) { ... }),
  trackColor: WidgetStateProperty.resolveWith((states) { ... }),
)
```

**CardTheme**: transparent surface tint
**SearchBarTheme**: transparent background with custom styling

### What We Have
MoonPlayer has:
- **Scrollbar**: 6px width, transparent track, `var(--text-tertiary)` thumb, hover changes to `var(--text-secondary)` — defined globally in `index.css` lines 203-219. Hidden on mobile (≤767px, lines 222-235).
- **Switch**: No custom theme — uses browser default. (React components in `Settings.jsx` use `<label>` + `<input type="checkbox">` with basic CSS in `Settings.css`)
- **Card**: No card-level theme — `TrackCard` uses `SolidPanel` with `interactive` prop
- **SearchBar**: No search bar component. Inline `<input>` in `Search.jsx`.

### The Gap
1. Scrollbar thumb color uses `--text-tertiary` (muted gray) instead of accent color (BloomeeTunes: `accentColor2` = `--accent-secondary`)
2. No interactive scrollbar on all scrollable areas (BloomeeTunes: `interactive: true`)
3. No Switch component — Settings uses raw `<input type="checkbox">` with no styled track/thumb
4. No Card-level design tokens — card border-radius, padding, hover effects vary across components
5. No SearchBarTheme — search inputs have no consistent glass styling
6. No component-level CSS custom properties for overrides per instance

### Implementation Steps

**Step 1: Update global scrollbar styling in `src/styles/index.css`**

Replace existing scrollbar rules (lines 203-219):

```css
/* --- Scrollbar --- */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--accent-secondary);   /* BloomeeTunes: accentColor2 thumb */
  border-radius: var(--radius-full);
  min-height: 40px;                       /* BloomeeTunes: ensures grabable thumb */
}

::-webkit-scrollbar-thumb:hover {
  background: #FF5A7A;                    /* lighter hover state */
}

::-webkit-scrollbar-thumb:active {
  background: #E0345A;                    /* darker active state */
}

/* Interactive mode: show thumb only on hover (BloomeeTunes' interactive: true) */
::-webkit-scrollbar-thumb {
  opacity: 0;
  transition: opacity var(--duration-normal) var(--ease-default);
}

:hover::-webkit-scrollbar-thumb,
::-webkit-scrollbar-thumb:hover {
  opacity: 1;
}
```

**Step 2: Create a reusable `Switch` component**

Create `src/components/common/Switch/Switch.jsx`:

```jsx
import './Switch.css';

export function Switch({
  checked = false,
  onChange,
  disabled = false,
  label,
  id,
  className = '',
}) {
  const switchId = id || `switch-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <label 
      className={`switch ${disabled ? 'switch--disabled' : ''} ${className}`.trim()}
      htmlFor={switchId}
    >
      <input
        id={switchId}
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="switch__input"
      />
      <span className="switch__track">
        <span className="switch__thumb" />
      </span>
      {label && <span className="switch__label">{label}</span>}
    </label>
  );
}
```

`Switch.css`:

```css
.switch {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  cursor: pointer;
  user-select: none;
}

.switch--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.switch__input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

.switch__track {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--bg-elevated-2, #121212);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-full);
  transition: background-color var(--duration-fast) var(--ease-default),
              border-color var(--duration-fast) var(--ease-default);
  flex-shrink: 0;
}

.switch__input:checked + .switch__track {
  background: var(--accent-moon);
  border-color: var(--accent-moon);
}

.switch__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: var(--text-primary);
  border-radius: 50%;
  transition: transform var(--duration-fast) var(--ease-spring);
  box-shadow: var(--shadow-sm);
}

.switch__input:checked + .switch__track .switch__thumb {
  transform: translateX(20px);
}

.switch__input:focus-visible + .switch__track {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

.switch__label {
  font-family: var(--font-ui);
  font-size: var(--text-body-sm);
  color: var(--text-primary);
}
```

**Step 3: Add SearchBar design tokens and apply glass styling**

In `src/styles/index.css`, add search bar tokens:

```css
/* -- Component Tokens: SearchBar -- */
--searchbar-height: 40px;
--searchbar-radius: var(--radius-full);
--searchbar-bg: var(--glass-bg-light);
--searchbar-blur: 20px;
--searchbar-border: var(--glass-border);
--searchbar-padding: 0 var(--space-4);
```

Create a SearchBar variant in the GlassPanel (already done in Section 4 Step 2 — `glass-panel--searchbar`). Update `Search.jsx` to wrap the input:

```jsx
// In Search.jsx — wrap search input with GlassPanel variant="searchbar"
<GlassPanel variant="searchbar" className="search-page__input-wrapper">
  <MagnifyingGlass size={20} weight="light" />
  <input 
    type="search"
    placeholder="Search songs, albums, artists..."
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    className="search-page__input"
  />
  {query && (
    <IconButton icon={X} size="sm" ariaLabel="Clear search" onClick={() => setQuery('')} />
  )}
</GlassPanel>
```

**Step 4: Add Card theme tokens to `:root`**

```css
/* -- Component Tokens: Card -- */
--card-radius: var(--radius-sm);
--card-padding: var(--space-3);
--card-gap: var(--space-3);
--card-image-radius: var(--radius-sm);
--card-hover-transform: scale(1.02);
--card-active-transform: scale(0.98);
```

Apply to `TrackCard.css`:

```css
.track-card {
  padding: var(--card-padding);
  gap: var(--card-gap);
  border-radius: var(--card-radius); /* override SolidPanel radius */
}

.track-card__image-container {
  border-radius: var(--card-image-radius);
}
```

### Files Affected
- `src/styles/index.css` — update scrollbar styling, add searchbar and card component tokens
- `src/components/common/Switch/Switch.jsx` + `Switch.css` — new files
- `src/views/pages/Settings.jsx` — replace `<input type="checkbox">` with `<Switch>` component
- `src/components/common/TrackCard/TrackCard.css` — use card tokens
- `src/views/pages/Search.jsx` — wrap input in GlassPanel variant="searchbar"
- `src/views/pages/Search.css` — remove hardcoded search input styles if any

### Impact Notes
- Scrollbar with `--accent-secondary` thumb mirrors BloomeeTunes' `accentColor2` scrollbar
- Interactive mode (thumb only visible on hover) is BloomeeTunes' `interactive: true` pattern — clean default look
- Switch component replaces raw checkboxes with a BloomeeTunes-themed toggle (accent-moon checked track, spring transition)
- Card tokens (`--card-radius`, `--card-padding`, etc.) provide BloomeeTunes' `CardTheme`-equivalent overridability

---

## 8. Ambient & Dynamic Backgrounds

### What BloomeeTunes Does
BloomeeTunes uses two distinct background techniques:

**1. ImageFiltered blur for detail view backdrops** (`AlbumView`, `PlaylistView`, `ArtistView`):
```dart
// BloomeeTunes: Blurred art behind album detail
Container(
  decoration: BoxDecoration(
    image: DecorationImage(
      image: ImageFiltered(
        imageFilter: ImageFilter.blur(sigmaX: 80, sigmaY: 80),
        child: Image.network(album.imageUrl)
      ).image,
      fit: BoxFit.cover,
      colorFilter: ColorFilter.mode(Colors.black.withOpacity(0.6), BlendMode.darken)
    )
  )
)
```

**2. Dynamic radial gradient in player** (from color extraction):
```dart
// BloomeeTunes: Player background from palette
Container(
  decoration: BoxDecoration(
    gradient: RadialGradient(
      colors: [paletteGenerator.dominantColor?.color ?? defaultColor, backgroundColor],
      radius: 1.2,
    )
  )
)
```

**3. Ambient shadow** (`AmbientImgShadowWidget`):
```dart
// BloomeeTunes: Glow shadow matching album art
AlbumArtShadowWidget(
  imageUrl: track.imageUrl,
  shadowColor: extractedColor,
  blurRadius: 40,
  spreadRadius: 5,
)
```

### What We Have
MoonPlayer has **static** backgrounds:
- `AppShell.css` lines 16-21: three hardcoded radial gradients (moonlight bloom at 50%/0%, gold at 10%/20%, subtle blue at 90%/80%)
- `FullscreenPlayer.jsx` line 174-176: `background: 'var(--bg-void)'` — solid black, no gradient
- `PlaylistView.jsx`: `background: var(--bg-void)` — solid black
- No `BlurredBackground` component (to be created in Section 4 Step 3)

### The Gap
1. FullscreenPlayer background is solid black — BloomeeTunes uses dynamic radial gradient from album art
2. PlaylistView/AlbumView backgrounds are solid black — BloomeeTunes uses blurred album art + gradient overlay
3. No ambient shadow around album art in MiniPlayer or FullscreenPlayer
4. AppShell's static gradient is subtle and doesn't adapt to what's playing
5. No mechanism for view-specific ambient backgrounds

### Implementation Steps

**Step 1: Integrate dynamic radial gradient into FullscreenPlayer (from Section 6)**

Already covered in Section 6 Step 2 — but here is the complete implementation in `FullscreenPlayer.jsx`:

```jsx
// State
const [palette, setPalette] = useState(['rgb(26, 30, 37)']);

// In the track-change effect
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

// Background style
const backgroundStyle = {
  background: palette.length > 1
    ? `radial-gradient(ellipse at 50% 25%, ${palette[0]} 0%, ${palette[1]} 45%, var(--bg-void) 80%)`
    : `radial-gradient(ellipse at 50% 25%, ${palette[0]} 0%, var(--bg-void) 70%)`,
};
```

**Step 2: Integrate `BlurredBackground` into PlaylistView and AlbumView**

In `PlaylistView.jsx`:

```jsx
import { BlurredBackground } from '../../components/common/BlurredBackground/BlurredBackground';
import { extractDominantColor } from '../../core/utils/colorExtractor';

// State
const [dominantColor, setDominantColor] = useState('rgb(26, 30, 37)');
const [coverUrl, setCoverUrl] = useState(null);

// In the playlist fetch effect
useEffect(() => {
  if (playlist?.tracks?.[0]?.imageUrl) {
    const url = playlist.tracks[0].imageUrl;
    setCoverUrl(url);
    extractDominantColor(url).then(setDominantColor);
  }
}, [playlist]);

// Render
<BlurredBackground 
  imageUrl={coverUrl}
  dominantColor={dominantColor}
  blurPx={80}
  opacity={0.25}
  className="playlist-view__backdrop"
/>
```

`PlaylistView.css` additions:

```css
.playlist-view {
  position: relative;
}

.playlist-view__backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  height: 50vh;  /* gradient fades to void in lower half */
  pointer-events: none;
}

.playlist-view > * {
  position: relative;
  z-index: 1;
}
```

**Step 3: Add ambient glow to MiniPlayer art (from Section 6 Step 4)**

```jsx
// In MiniPlayer.jsx
const [miniGlow, setMiniGlow] = useState(null);

useEffect(() => {
  if (currentTrack?.imageUrl) {
    const controller = new AbortController();
    extractDominantColor(currentTrack.imageUrl, controller.signal).then((color) => {
      setMiniGlow(color);
    });
    return () => controller.abort();
  }
}, [currentTrack]);

// Apply glow on the art element
<img 
  src={currentTrack.imageUrl || '/default-album-art.png'} 
  alt={currentTrack.title} 
  className="mini-player__art"
  style={miniGlow ? {
    boxShadow: `0 0 16px ${miniGlow.replace('rgb', 'rgba').replace(')', ', 0.25)')}`
  } : undefined}
/>
```

**Step 4: Replace static AppShell ambient gradient with a dynamic system placeholder**

Update `AppShell.jsx` to accept an optional `bgStyle` prop that parent pages can set:

```diff
- export function AppShell({ children }) {
+ export function AppShell({ children, ambientStyle }) {

// In the JSX:
- <div className="app-shell__background" aria-hidden="true"></div>
+ <div className="app-shell__background" style={ambientStyle} aria-hidden="true"></div>
```

The `.app-shell__background` still has the static moon gradient as CSS fallback, but can be overridden per page via inline style.

### Files Affected
- `src/components/player/FullscreenPlayer/FullscreenPlayer.jsx` — dynamic radial gradient from palette
- `src/components/player/MiniPlayer/MiniPlayer.jsx` — dynamic glow shadow on art
- `src/components/player/FullscreenPlayer/FullscreenPlayer.css` — adjust art-container for ambient shadow
- `src/views/pages/PlaylistView.jsx` — add BlurredBackground backdrop
- `src/views/pages/PlaylistView.css` — backdrop positioning styles
- `src/views/pages/AlbumView.jsx` — add BlurredBackground backdrop (when created)
- `src/components/common/BlurredBackground/BlurredBackground.jsx` + `.css` — new files (from Section 4)
- `src/components/layout/AppShell/AppShell.jsx` — ambientStyle prop for dynamic override
- `src/components/layout/AppShell/AppShell.css` — existing static gradient retained as default

### Impact Notes
- Dynamic radial gradient is BloomeeTunes' exact pattern: `RadialGradient(colors: [dominant, bg])` → CSS `radial-gradient(ellipse at 50% 25%, rgb(...), rgb(...), var(--bg-void))`
- Blurred background in detail views mirrors BloomeeTunes' `ImageFiltered(sigmaX: 80, sigmaY: 80)` → CSS `filter: blur(80px)`
- All dynamic backgrounds gracefully fall back to void black if extraction fails
- Performance: CSS radial gradients are GPU-composited. CSS blur on an `<img>` is cheaper than canvas-based alternatives.

---

## 9. Icon System Consistency

### What BloomeeTunes Does
BloomeeTunes uses **FontAwesome** with 3 variants:
```dart
// BloomeeTunes: FontAwesome usage
FaIcon(FontAwesomeIcons.heart)       // Regular
FaIcon(FontAwesomeIcons.solidHeart)  // Solid (filled)
FaIcon(FontAwesomeIcons.heart)       // Brands (for logos)
```

Conventions:
- **Regular**: default weight for icons (outline style)
- **Solid**: active/selected state (filled)
- **Brands**: third-party logos (Spotify, Apple Music, etc.)
- Icons inside buttons: 20px (medium)
- Icons in list tiles: 16px (small)  
- Icons in hero/display: 32px (large) or custom
- Color follows text color hierarchy (primary, secondary, tertiary) or accent for active

### What We Have
MoonPlayer uses **Phosphor Icons** (`@phosphor-icons/react`):
- 600+ icons
- 6 weight variants: `thin`, `light`, `regular`, `bold`, `fill`, `duotone`
- Size via `fontSize` prop or CSS `font-size`

Current usage patterns:
- `Button.jsx`: `<Icon weight="bold" />` — bold weight inside buttons
- `IconButton.jsx`: `<Icon weight={active ? 'fill' : 'light'} />` — fill when active, light when inactive
- `TrackCard.jsx`: `<Play weight="fill" />` — fill weight for play button
- Various inline icons in components with default weight (regular)
- No established size conventions per role
- No icon color conventions beyond `color: var(--text-*)`

### The Gap
1. No documented icon weight conventions — `bold`, `light`, `fill`, and `regular` are used inconsistently
2. No role-based size guidelines (button icons, list icons, hero icons all use different sizes ad-hoc)
3. No icon-only button sizing convention (BloomeeTunes: `FaIcon` with `size:` parameter)
4. BloomeeTunes uses solid fill for active state; MoonPlayer does the same but only in IconButton

### Implementation Steps

**Step 1: Define icon usage conventions in `src/styles/index.css` icon size tokens (already exist)**

Existing tokens:
```css
--icon-sm: 16px;   /* list items, inline with text */
--icon-md: 20px;   /* buttons, icon buttons default */
--icon-lg: 24px;   /* section headers, larger controls */
--icon-xl: 32px;   /* hero, empty states, page icons */
```

Add weight tokens:
```css
/* -- Icon: Weight Conventions -- */
--icon-weight-button: 'bold';
--icon-weight-active: 'fill';
--icon-weight-inactive: 'light';
--icon-weight-default: 'regular';
```

**Step 2: Standardize icon weight usage across components**

| Component | Icon Usage | Weight Convention |
|-----------|-----------|-------------------|
| `Button` | Leading icon | `bold` |
| `IconButton` (inactive) | Standalone icon | `light` |
| `IconButton` (active) | Standalone icon | `fill` |
| `TrackRow` | Play button | `fill` |
| `TrackRow` | Drag handle | `regular` |
| `ContextMenu` items | Leading icon | `regular` |
| `BottomNavigation` | Navigation icons | `regular` or `fill` (active) |
| `EmptyState` | Illustration icon | `light` (large, decorative) |
| Stars/ratings | Rating stars | `fill` (gold-accent) |

Update `Button.jsx` to always use `bold` weight:
```jsx
<Icon className="button__icon" weight="bold" />
```

Update `IconButton.jsx` — already has correct convention (line 33):
```jsx
<Icon className="icon-button__icon" weight={active ? 'fill' : 'light'} />
```

**Step 3: Enforce consistent icon colors**

Add utility CSS classes in `src/styles/utilities.css`:

```css
/* -- Icon Color Utilities -- */
.icon-accent  { color: var(--accent-moon); }
.icon-glow    { color: var(--accent-glow); }
.icon-error   { color: var(--error); }
.icon-success { color: var(--success); }
.icon-muted   { color: var(--text-tertiary); }
```

**Step 4: Audit all icon usages for weight and size consistency**

Run through `src/components/` and `src/views/pages/` and flag inconsistencies:

| File | Icon | Current | Should Be |
|------|------|---------|-----------|
| `FullscreenPlayer.jsx` line 268 | `Heart size={120}` | hardcoded 120 | acceptable (animation oversized) |
| `MiniPlayer.jsx` line 47 | `Sparkle size={14}` | size=14 (no token) | use `--icon-sm` (16px) via CSS |
| `MiniPlayer.jsx` line 93 | `Play` / `Pause` | via IconButton md (20px) | correct |
| `HeroSlideshow.jsx` | Play button icon | — | should use `fill` weight |
| `Search.jsx` | MagnifyingGlass | default (regular) | should use `regular` weight |
| Various | Heart icon | varies | consistent: `light` (inactive), `fill` (favorited) |

### Files Affected
- `src/styles/index.css` — add icon weight convention comments
- `src/styles/utilities.css` — add icon color utility classes
- `src/components/common/Button/Button.jsx` — enforce `weight="bold"`
- `src/components/player/MiniPlayer/MiniPlayer.jsx` — replace `size={14}` with CSS size via className
- All icon usage files — no mandatory changes, this section codifies existing patterns

### Impact Notes
- No icon library change — still Phosphor Icons
- BloomeeTunes' 3-variant (Regular/Solid/Brands) maps to Phosphor's `light`/`fill`/`regular`/`bold`
- BloomeeTunes' active = solid fill → maps to Phosphor's `fill` weight
- Size tokens `--icon-*` are already defined and used correctly in most places

---

## 10. Spacing & Rhythm Standardization

### What BloomeeTunes Does
BloomeeTunes follows Material 3 spacing conventions with `ResponsiveBreakpoints` adaptation:
- Base grid: 4px (same as MoonPlayer)
- Section gaps: `gap` property between `CustomScrollView` slivers — typically 24px
- Card padding: `EdgeInsets.all(12)` → 12px (= 3 × 4px grid)
- List tile padding: varies by device (compact on mobile via `ResponsiveBreakpoints`)
- Horizontal carousel item spacing: varies by viewport width (tighter on mobile)
- Between sections: `SizedBox(height: 24)` or `SizedBox(height: 32)` depending on section type

Key distinction: BloomeeTunes **adapts spacing to viewport** — mobile uses tighter spacing, desktop uses more generous spacing.

### What We Have
MoonPlayer has a 4px base grid with `--space-1` (4px) through `--space-16` (64px):
```css
--space-1: 4px;   --space-2: 8px;   --space-3: 12px;  --space-4: 16px;
--space-5: 20px;  --space-6: 24px;  --space-8: 32px;  --space-10: 40px;
--space-12: 48px; --space-16: 64px;
```

Current usage:
- `AppShell.css` content padding: `var(--space-4)` mobile, `var(--space-6)` tablet+
- Component padding: various values — `--space-3` in TrackCard, `--space-4` in SolidPanel
- Section gaps: ad-hoc — no standardized section rhythm
- No responsive spacing (BloomeeTunes: `ResponsiveBreakpoints` adaptation)

### The Gap
1. No section rhythm tokens — home page sections, playlist sections all use ad-hoc gaps
2. No responsive spacing scale — `--space-*` values are static, not viewport-relative
3. No viewport-specific padding adaptation in most components
4. No list/grid gap tokens for standardized grid/list spacing

### Implementation Steps

**Step 1: Add section rhythm tokens to `:root` (from Section 3 Step 2)**

```css
/* -- Rhythm: Section Spacing -- */
--section-gap: var(--space-8);          /* gap between major page sections (32px) */
--section-gap-compact: var(--space-6);  /* tighter gap for mobile (24px) */
--section-header-gap: var(--space-4);   /* gap between section title and content (16px) */
--section-inner-gap: var(--space-3);    /* gap within a section's items (12px) */

/* -- Rhythm: Layout Padding -- */
--page-padding: var(--space-4);         /* page content padding (16px) */
--page-padding-tablet: var(--space-6);  /* tablet+ page padding (24px) */
--page-padding-desktop: var(--space-8); /* desktop page padding (32px) */

/* -- Rhythm: Grid & List -- */
--grid-gap: var(--space-4);             /* gap between grid items (16px) */
--grid-gap-compact: var(--space-3);     /* compact grid gap, mobile (12px) */
--list-gap: var(--space-2);             /* gap between list items (8px) */
--list-gap-compact: var(--space-1);     /* compact list gap (4px) */

/* -- Rhythm: Card Padding -- */
--card-padding: var(--space-3);         /* card inner padding (12px) */
--card-padding-compact: var(--space-2); /* compact card on mobile (8px) */
```

**Step 2: Apply rhythm tokens to page-level components**

`Home.jsx` section spacing:
```css
.home-page__section {
  margin-bottom: var(--section-gap);
}

.home-page__section-header {
  margin-bottom: var(--section-header-gap);
}
```

`PlaylistView.jsx` spacing:
```css
.playlist-view__section {
  margin-bottom: var(--section-gap);
}
```

**Step 3: Apply responsive padding to AppShell content**

Update `AppShell.css`:

```css
.app-shell__content {
  padding: var(--page-padding);
  padding-bottom: calc(180px + env(safe-area-inset-bottom, 0px));
}

@media (min-width: 768px) {
  .app-shell__content {
    padding: var(--page-padding-tablet);
    padding-bottom: 120px;
  }
}

@media (min-width: 1024px) {
  .app-shell__content {
    padding: var(--page-padding-desktop);
  }
}
```

**Step 4: Add list/grid gap utility classes to `src/styles/utilities.css`**

```css
/* -- Grid & List Gap Utilities -- */
.gap-grid   { gap: var(--grid-gap); }
.gap-list   { gap: var(--list-gap); }
.gap-section { gap: var(--section-gap); }
.gap-stack  { gap: var(--section-inner-gap); }
```

**Step 5: Add responsive spacing hook for BloomeeTunes' ResponsiveBreakpoints equivalent**

Create `src/hooks/useResponsiveSpacing.js`:

```js
import { useBreakpoint } from './useBreakpoint';

const SCALES = {
  mobile: {
    sectionGap: 'var(--section-gap-compact)',
    gridGap: 'var(--grid-gap-compact)',
    listGap: 'var(--list-gap-compact)',
    cardPadding: 'var(--card-padding-compact)',
    pagePadding: 'var(--page-padding)',
  },
  desktop: {
    sectionGap: 'var(--section-gap)',
    gridGap: 'var(--grid-gap)',
    listGap: 'var(--list-gap)',
    cardPadding: 'var(--card-padding)',
    pagePadding: 'var(--page-padding-tablet)',
  },
};

export function useResponsiveSpacing() {
  const { isMobile } = useBreakpoint();
  return isMobile ? SCALES.mobile : SCALES.desktop;
}
```

### Files Affected
- `src/styles/index.css` — add rhythm tokens
- `src/styles/utilities.css` — add gap utility classes
- `src/components/layout/AppShell/AppShell.css` — use `--page-padding-*` tokens
- `src/views/pages/Home.jsx` + `Home.css` — use `--section-gap`
- `src/views/pages/PlaylistView.jsx` + `PlaylistView.css` — use `--section-gap`
- `src/views/pages/Library.jsx` + `Library.css` — use rhythm tokens
- `src/hooks/useResponsiveSpacing.js` — new file (optional, for programmatic spacing)

### Impact Notes
- All rhythm tokens use existing `--space-*` values — no new primitive spacing values
- Responsive adaptation matches BloomeeTunes' `ResponsiveBreakpoints` pattern: mobile = compact spacing, desktop = generous spacing
- Section gap (32px) matches BloomeeTunes' 24-32px gap between `CustomScrollView` slivers
- List gap (8px) matches BloomeeTunes' compact list spacing
- Grid gap (16px) matches BloomeeTunes' grid cross-axis spacing

---

## Summary: File Change Manifest

### New Files to Create (7 files)
| File | Section |
|------|---------|
| `src/components/common/BlurredBackground/BlurredBackground.jsx` | 4, 8 |
| `src/components/common/BlurredBackground/BlurredBackground.css` | 4, 8 |
| `src/components/common/Switch/Switch.jsx` | 7 |
| `src/components/common/Switch/Switch.css` | 7 |
| `src/context/ThemeContext.jsx` | 3 (optional) |
| `src/hooks/useResponsiveSpacing.js` | 10 (optional) |

### Files to Modify (15 files)
| File | Change |
|------|--------|
| `src/styles/index.css` | Expand color tokens, add weight/letter-spacing/role-typography, restructure token order, add component tokens, update scrollbar, add rhythm tokens |
| `src/styles/utilities.css` | Add color utilities, role-based text utilities, grid/list gap utilities, icon color utilities |
| `src/components/common/Button/Button.jsx` | Add `premium` variant |
| `src/components/common/Button/Button.css` | Add `.button--premium`, `.button:focus-visible`, primary active state, use component tokens |
| `src/components/common/IconButton/IconButton.css` | Use component tokens for sizes |
| `src/components/common/GlassPanel/GlassPanel.jsx` | Add semantic `variant` prop with role mapping |
| `src/components/common/GlassPanel/GlassPanel.css` | Add searchbar/miniplayer variant CSS, fix `@supports` fallback |
| `src/components/common/SolidPanel/SolidPanel.css` | Use `--panel-radius` token |
| `src/components/common/TrackCard/TrackCard.css` | Use card design tokens, heading font for title |
| `src/components/player/GlobalPlayer/GlobalPlayer.jsx` | Update GlassPanel variant prop |
| `src/components/player/FullscreenPlayer/FullscreenPlayer.jsx` | Dynamic radial gradient from palette, ambient glow shadow on art |
| `src/components/player/FullscreenPlayer/FullscreenPlayer.css` | Dynamic box-shadow for art container, replace hardcoded rgba |
| `src/components/player/MiniPlayer/MiniPlayer.jsx` | Dynamic glow shadow on art |
| `src/components/player/MiniPlayer/MiniPlayer.css` | Replace hardcoded rgba with tokens |
| `src/components/layout/AppShell/AppShell.css` | Use `--page-padding-*` tokens |
| `src/views/pages/PlaylistView.jsx` | Add BlurredBackground backdrop with color extraction |
| `src/views/pages/Search.jsx` | Wrap search input in GlassPanel variant="searchbar" |

### Design Token Count Comparison
| Category | Before | After | BloomeeTunes Equivalent |
|----------|--------|-------|------------------------|
| Color tokens | 22 | ~50 | `ColorScheme` slots |
| Typography tokens | 8 | ~25 | `TextTheme` styles |
| Component tokens | 0 | ~25 | `CardTheme`, `SwitchTheme`, etc. |
| Spacing/rhythm tokens | 10 | ~22 | Material 3 spacing scale |
| Radius/shadow/z-index | 21 | 21 (unchanged) | `ThemeData` properties |
| Animation tokens | 6 | 6 (unchanged) | Duration/curve constants |
| **Total tokens** | **~67** | **~149** | **200+ lines of ThemeData** |
