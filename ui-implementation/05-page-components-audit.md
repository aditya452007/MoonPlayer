# Page View Components & Shared Components Audit

---

## 1. Home Page

**Files:** `Home.jsx`, `Home.css`

- Heavy inline styles for RecentlyPlayed section (lines 74-121): margin, flex, gap all in JSX
- Grid items use `flex: 0 0 140px` hardcoded — no responsive scaling
- Header is just `<h1>Home</h1>` — no subtitle, no greeting, no personality
- Dead CSS: `.home-page__grid` defined but never used
- Error state → EmptyState component ✅ Good
- Loading skeleton → `LoadingSkeleton shape="card-grid"` ✅ Good, but skeleton doesn't match actual grid size

---

## 2. Search Page

**Files:** `Search.jsx`, `Search.css`

- Glass panel inconsistency: search bar uses `<GlassPanel variant="searchbar">`, autocomplete dropdown uses raw `className="glass-panel"` — two approaches
- Filter chips use `--font-heading` while rest of page uses body font — minor inconsistency
- Dual empty states handled well (history vs no results)

---

## 3. Library Page

**Files:** `Library.jsx`, `Library.css`

- **Inline style overload:** Filter bar (lines 131-147) has 8 inline CSS properties for a single element
- **Grid definition conflict:** `style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}` in JSX vs `.library-page__grid` CSS class defines `minmax(200px, 1fr)` — two different values, the inline one wins
- **Modal duplication:** Library has its own modal with `.custom-modal-*` classes, PlaylistView has another with `.playlist-view__modal-*`. Same pattern, duplicated code.
- **Animation inconsistency:** Favorites section uses `AnimatedListItem` individually, Playlists section uses `AnimatedList` wrapper

---

## 4. LocalMusicView

**Files:** `LocalMusicView.jsx`, `LocalMusicView.css`

- **Does NOT use EmptyState component** (lines 140-145) — raw `<div>` with inline styles
- **Hardcoded colors:** Error display uses `rgba(248, 113, 113, 0.1)` and `#f87171` — duplicated identically in ImportExportView
- **No loading skeleton** while scanning — only disabled button with "Scanning..."

---

## 5. PlaylistView

**Files:** `PlaylistView.jsx`, `PlaylistView.css`

- **Modal duplication:** Delete playlist modal duplicates Library's modal pattern almost identically
- **`!important` overrides:** `.playlist-view__btn--danger` uses `!important` to override Button component styles — Button lacks `danger` variant
- Background uses `<BlurredBackground>` component ✅ Good
- Empty state uses EmptyState component ✅ Good

---

## 6. AlbumView

**Files:** `AlbumView.jsx`, `AlbumView.css`

- **Backdrop duplication:** AlbumView uses raw `<div className="album-view__backdrop" />` with CSS gradient + blur, while PlaylistView uses `<BlurredBackground>` component — same effect, two implementations
- **Color inconsistency:** Play button uses `var(--accent-moon)`, PlaylistView uses `var(--primary)`, ChartView uses `var(--accent-secondary)` — three different tokens for same action
- Loading skeleton centered in page, not in context — causes layout shift when content loads

---

## 7. ArtistView

**Files:** `ArtistView.jsx`, `ArtistView.css`

- **No LayoutSwitch** for DetailHeader — always compact on mobile, never responsive
- **Plain `<p>` empty states** — "No popular tracks found" and "No albums found" are bare paragraphs, no EmptyState
- Backdrop = raw `<div>` (third implementation of same pattern)

---

## 8. ChartView

**Files:** `ChartView.jsx`, `ChartView.css`

- **Fourth backdrop implementation** — inline `background-image` on div + separate overlay div
- **Hardcoded green:** `#10b981` on lines 199, 240 — duplicated, not using CSS variable
- Watermark text (large faded number) is genuinely premium — a bright spot

---

## 9. Offline Page — CRITICALLY BAD

**File:** `Offline.jsx`

22 lines total. Inline styles. No CSS file. No EmptyState component. Just:
```
<Download icon> <h2>Offline</h2> <p>Downloaded tracks will appear here.</p>
```
This is a stub/placeholder, not a designed page.

---

## 10. Shared Component Issues

### TrackCard / TrackRow / SongRow — Triplicate Inconsistency

| Feature | TrackCard | TrackRow | SongRow |
|---------|-----------|----------|---------|
| Duration display | Yes | Yes | **No** |
| NowPlayingBars | Yes | Yes | **No** |
| Long-press context | Yes | Yes | No |
| Artist link | Yes | Yes | Yes |
| Index number | No | Yes | Yes |
| Hover play overlay | Yes | Yes | Yes (but stays visible on active) |

- **Long-press handler duplicated** in TrackCard.jsx:48-56 and TrackRow.jsx:47-55 — identical code
- **SongRow active overlay stays visible** — hovering not required, confusing

### DetailHeader
- Uses raw `<img>` not `ImgWithFallback` — broken images on album/artist/chart pages
- Art size conflicts: DetailHeader defines 200px/280px, parent pages override with 180px/240px

### Button Component
- BloomeeTunes-specific `--premium` variant hardcodes `#FE385E` — domain leak in generic component
- Settings.css overrides Button with `!important` — component lacks `shape` prop

### EmptyState Component
- Duplicates entire JSX for reduced motion branch (~20 lines of duplication)
- Only `"empty"` and `"error"` variants — no `"warning"`, `"success"`, `"info"`

### LoadingSkeleton
- Grid skeleton `minmax(180px, 1fr)` doesn't match page grids (some use 160px, some 200px)
- count prop doesn't reflect actual content count

### AlbumCard / ArtistCard / PlaylistCard
- Three different sizing approaches: `aspect-ratio: 1/1` (Album, Playlist) vs explicit `width: 120px; height: 120px` (Artist)
- AlbumCard has hover play overlay, PlaylistCard and ArtistCard do NOT

---

## 11. Cross-Cutting Issues

### Issue 1: Inline Style Proliferation
Nearly every page has extensive `style={{}}` in JSX. Key offenders:
- `Home.jsx:74-121` — entire RecentlyPlayed layout
- `Library.jsx:131-146` — filter bar
- `LocalMusicView.jsx:94-111` — filter input
- `ImportExportView.jsx:85-100` — button overrides
- `Offline.jsx:12-16` — entire page

### Issue 2: Hardcoded Colors
- `LocalMusicView.css:100-104` — `rgba(248,113,113,0.1)` / `#f87171`
- `ImportExportView.css:101-102` — `rgba(74,222,128,0.1)` / `#4ade80`
- `ChartView.css:199,240` — `#10b981`

### Issue 3: 4 Different Backdrop Implementations
1. `PlaylistView.jsx:188` — `<BlurredBackground>` component ✅
2. `AlbumView.jsx:199` — raw `<div>` with CSS gradient + `filter: blur()`
3. `ArtistView.jsx:128` — same as AlbumView (raw div)
4. `ChartView.jsx:83` — raw div with inline `background-image` + separate overlay div

### Issue 4: Duplicated Modal
Library (`custom-modal-*`) and PlaylistView (`playlist-view__modal-*`) have near-identical overlay/backdrop/animation code.

### Issue 5: Duplicated TrackRow/SongRow
80% identical components with different feature sets. `SongRow` lacks duration and NowPlayingBars.

### Issue 6: Button Styling Fragmentation
- Standard `<button>` with custom classes (LocalMusicView, ChartView)
- `Button` component (Library, PlaylistView, Settings, ImportExportView)
- `IconButton` component (PlaylistView ShareNetwork, AlbumView)
- Raw `<button>` with inline styles (Library download queue)

### Issue 7: Empty State Fragmentation
- `EmptyState` component: Home, Search, Library, PlaylistView, AlbumView, ChartView, Settings
- Raw `<div>`: LocalMusicView, Offline
- Plain `<p>`: ArtistView
- Bare stub: SongRedirectView

---

## 12. Why It Doesn't Feel Premium

1. **Card inconsistency** — 4 card types, 3 padding systems, none share a blueprint
2. **List spacing inconsistency** — TrackRow/SongRow/LocalMusicView all use different spacings
3. **No `ImgWithFallback` in DetailHeader** — broken images look amateur
4. **No blur-up image loading** — skeleton flash instead of gradual resolution
5. **3 accent colors competing** — `--accent-moon` / `--accent-secondary` / `--primary` used interchangeably
6. **Offline page is a stub** — 3 elements, no design effort
7. **No shared `Modal` component** — duplicated in Library + PlaylistView
