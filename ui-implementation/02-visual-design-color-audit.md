# Visual Design & Color Audit

## 1. Color Palette — Core Problems

### Problem A: Pure Black Background (Critical)
`index.css:19-20` — `--bg-void: #000000` and `--bg-surface: #000000` are identical. No perceptual depth between deepest and surface levels.

**Compare:**
| App | Base | Surface | Card | Hover |
|-----|------|---------|------|-------|
| Spotify | #000 | #121212 | #181818 | #282828 |
| Apple Music | #1C1C1E | #2C2C2E | #3A3A3C | — |
| Tidal | #0A0A0A | #141414 | #1E1E1E | — |
| **MoonPlayer** | **#000** | **#000** | **#080808** | **#101010** |

**Fix:** Change `--bg-void` to `#000000` (keep deepest), `--bg-surface` to `#0D0D0D` (new visible tier), `--bg-elevated` to `#1A1A1A`.

### Problem B: Text Has Strong Blue Cast (High)
`index.css:28-30` — `--text-primary: #D4E0ED` has heavy blue component. Makes entire UI feel cold and clinical.

**Fix:** Move to neutral warm-white:
- `--text-primary: #EDEDEF` (near-white, slight warmth)
- `--text-secondary: #A1A1AA` (neutral gray)
- `--text-tertiary: #71717A`

### Problem C: Blue Accent Overused (High)
`--accent-moon (#6BA3D6)` appears on: buttons, links, progress bars, selection highlight, tab active states, section titles, glass hover borders, focus outlines, scrollbar glow.

**Fix:** Reserve `--accent-moon` exclusively for interactive elements. Use `--accent-secondary` (rose/pink) and `--accent-glow` (amber) for decorative roles. Add a neutral `--accent-neutral` for structural accents.

### Problem D: No Warm Neutrals (Medium)
Entire palette is cool-toned. Missing: `--neutral-50` through `--neutral-950` or equivalent warm gray scale.

---

## 2. Typography Issues

### Weight Mismatch (Medium)
`index.css:91-98` declares `--weight-light: 300`, `--weight-extrabold: 800`, `--weight-black: 900` but:
- Google Fonts `@import` (line 7) only loads Space Grotesk 500/600/700 and Inter 400/500/600
- Light (300), Extrabold (800), Black (900) resolve to browser defaults

### Leading Tokens Missing (Medium)
`index.css:304,312` uses `var(--leading-normal)` and `var(--leading-tight)` but these are never defined.

### Font Pairing is Good
Space Grotesk (display) + Inter (body) + JetBrains Mono (mono) is a modern, proven pairing. Keep.

### Type Scale is Excellent
11 levels from `--text-micro` (10px) to `--text-display` (44px) is comprehensive.

---

## 3. Design Token Gaps

### Missing: Light Theme (Critical)
No `[data-theme="light"]` block anywhere. Dark-only is a significant gap in 2026.

### Missing: Cover Art Tokens
No `--cover-*` tokens. Cover sizes are hardcoded: 140px (Home recently played), 180px (AlbumView), 56px (BottomPlaybar).

### Missing: Noise/Grain Texture
Premium music apps use subtle grain overlay for tactile depth.

### Missing: Extended Shadow System
Only 4 shadow levels + 1 glow. Apple Music has 6+ levels with ambient + key light separation.

### Border System is Good
5 border opacity levels (`--border-subtle` through `--border-focus`) at `index.css:62-66` is well-architected.

### Elevation Scale Too Shallow
Current: 3 tiers (void → elevated → overlay). Needs 5-7 tiers like Spotify.

---

## 4. Gradient Issues

### Duplicate Gradients
`index.css:76,78` — `--gradient-premium` and `--gradient-liked-songs` are identical (`#FE385E` to `#FF6B8A`).

### Invisible Gradient
`--gradient-surface` (line 79): `#080808` to `#000000` — barely perceptible. Used nowhere.

### Inline Gradients Bypass Tokens
Multiple components define their own gradients:
- `Settings.css:14` — section title gradient
- `TopBar.css:83` — same pattern
- `ChartCarousel.css:132` — image overlay
- `ShellLayout.css:17-19` — ambient background (this one is good actually)

---

## 5. Theme Support

### No Dark/Light Toggle in Settings
`ThemeContext.jsx` only handles accent color override via `--accent-dynamic`. No `data-theme` switching, no `prefers-color-scheme`.

### Accent Customization is Minimal
`setAccent(color)` exists but:
- Settings doesn't expose accent color picker
- Only `--accent-dynamic` overridden, not hover/active derivatives
- No color swatch presets

### Missing Settings Sections
- Appearance/Theme (dark/light/system)
- Accent color picker
- Density toggle (compact/comfortable)
- Cover art size preference

---

## 6. Premium Feel Assessment

| Axis | Score | Why |
|------|-------|-----|
| Visual hierarchy | 6/10 | Good type scale, OK spacing, but flat backgrounds kill depth |
| Color harmony | 4/10 | Too much cold blue, no warm balance, pure black, one theme |
| Typography | 7/10 | Good pairing, let down by weight mismatches, missing leading tokens |
| Spacing | 8/10 | Best category — `--space-*` and rhythm tokens are well-considered |
| Premium feel | 3/10 | Static album art, no rotation, no grain, no light theme, tiny covers |

---

## 7. Recommended New Color Palette

### Dark Theme (New Default)
```css
--bg-void: #09090B;
--bg-surface: #111113;
--bg-elevated: #18181B;
--bg-overlay: #1F1F23;
--bg-highlight: #27272A;
--bg-raised: #2D2D32;

--text-primary: #EDEDEF;
--text-secondary: #A1A1AA;
--text-tertiary: #71717A;
--text-quaternary: #52525B;

--accent-primary: #F59E0B;       /* amber-500 — warmth */
--accent-secondary: #F43F5E;    /* rose-500 — energy */
--accent-tertiary: #8B5CF6;     /* violet-500 — depth */
--accent-ghost: #A1A1AA;        /* neutral for structural elements */

--gradient-hero: linear-gradient(135deg, #F59E0B 0%, #F43F5E 100%);
--gradient-surface: linear-gradient(180deg, #1A1A1E 0%, #09090B 100%);
--gradient-glass: linear-gradient(135deg, rgba(245, 158, 11, 0.06) 0%, transparent 50%);
```

### Light Theme (New)
```css
[data-theme="light"] {
  --bg-void: #FAFAFA;
  --bg-surface: #F4F4F5;
  --bg-elevated: #ECECEE;
  --text-primary: #18181B;
  --text-secondary: #52525B;
}
```
