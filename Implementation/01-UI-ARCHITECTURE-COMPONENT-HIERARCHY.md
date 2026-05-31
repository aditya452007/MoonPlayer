# MoonPlayer UI Architecture & Component Hierarchy — Implementation Guide

**Reference**: BloomeeTunes (Flutter/Dart) → MoonPlayer (React/TypeScript)  
**Goal**: Port proven UI architecture patterns from BloomeeTunes into MoonPlayer's React/JSX codebase.

---

## 1. Component Decomposition & Granularity

### What BloomeeTunes does better
BloomeeTunes has **37 reusable widget files** in `lib/screens/widgets/` with highly specialized components:
- `SquareImgCard` — square image card with optional play overlay (used for albums, playlists, artists)
- `ArtistCard` — dedicated artist card with image + name + genre
- `AlbumCard` — album card with image + title + year
- `PlaylistCard` — playlist card with image + name + track count
- `ChartListTile` — chart-positioned list tile (rank number + image + title + artist + peak position)
- `SongTile` — compact horizontal tile for song lists
- `MoreBottomSheet` — reusable bottom sheet for track/album actions
- `TabSongListWidget` — tab-switchable song list for home page sections
- `HorizontalCardView` — horizontal scrolling wrap for sections

Each component handles **one data type** and **one layout purpose**, making them individually testable, memoizable, and independently styled.

### What we currently have
MoonPlayer has **18 common components** in `src/components/common/`:
- `TrackCard` (`src/components/common/TrackCard/TrackCard.jsx`) — generic card for any track. 105 lines, handles: track display, play action, long-press context menu, image loading, active state
- `TrackRow` (`src/components/common/TrackRow/TrackRow.jsx`) — generic list row for any track. 135 lines, handles: track display, play action, drag-to-context-menu, image/index toggle, duration
- `SolidPanel` / `GlassPanel` — generic containers
- `Button` / `IconButton` — atomic controls
- `Skeleton` — loading placeholder

**The gap**: `TrackCard` does double-duty as album card, artist card, and playlist card. There's no `AlbumCard`, `ArtistCard`, `PlaylistCard`, `SongRow`, or `BottomSheet` component. This causes:
- Bloated single-file components (105-135 lines when BloomeeTunes equivalents are 40-60 lines)
- No type-specific rendering (artist cards should show genre, album cards should show year, playlist cards should show track count)
- CSS specificity conflicts from shared class names
- Harder to animate/memoize individually

### Implementation guide

**Step 1: Create `AlbumCard` component**
- `src/components/common/AlbumCard/AlbumCard.jsx` + `AlbumCard.css`
- Props: `album: { id, title, artistName, imageUrl, year, trackCount }`
- Render: `SolidPanel` → square image (aspect-ratio 1/1) → title → artist name + year
- Remove generic play overlay; use `IconButton` with `Play` only on hover
- Export as `React.memo(function AlbumCard(...){...})`
- Reference: BloomeeTunes' `AlbumCard` in `lib/screens/widgets/AlbumCard.dart`

```jsx
// src/components/common/AlbumCard/AlbumCard.jsx
export const AlbumCard = React.memo(function AlbumCard({ album, onClick, className = '' }) {
  // Image with lazy loading
  // Title text overflow ellipsis
  // Artist + year subtitle
  // Hover play button overlay
  // Context menu on long-press (TrackContextMenu adapted for album)
});
```

**Step 2: Create `ArtistCard` component**
- `src/components/common/ArtistCard/ArtistCard.jsx` + `ArtistCard.css`
- Props: `artist: { id, name, imageUrl, genre, monthlyListeners? }`
- Render: circular image (border-radius 50%) + name + genre subtitle
- No play overlay; click navigates to artist detail page
- Reference: BloomeeTunes' `ArtistCard` widgets

**Step 3: Create `PlaylistCard` component**
- `src/components/common/PlaylistCard/PlaylistCard.jsx` + `PlaylistCard.css`
- Extract from Library.jsx's inline `.playlist-card` pattern (lines 91-136 of `Library.jsx`)
- Props: `playlist: { id, name, tracks, coverImage? }, variant: 'liked' | 'recent' | 'custom'`
- Handles gradient backgrounds for special variants (liked=red gradient, recent=highlight gradient)
- Reference: BloomeeTunes' `PlaylistCard` in `lib/screens/widgets/LibItemCard.dart`

**Step 4: Create `SongRow` compact variant**
- `src/components/common/SongRow/SongRow.jsx`
- A slimmer version of `TrackRow` without drag gesture, index number, or duration
- Used inside album/playlist detail views where space is tight
- Props: `track, showArtwork, onPlay, onMenu`
- Reference: BloomeeTunes' `SongTile` — compact, no gestures

**Step 5: Refactor `TrackCard` to be purely a recommendation card**
- Remove artist card / album card usage patterns
- Keep only for horizontal carousels (`RecommendationCarousel`)
- Rename internally or document as "for carousel use only"

### Impact analysis
- **Affected views**: Home.jsx (RecommendationCarousel uses TrackCard), Library.jsx (inline playlist cards → PlaylistCard), PlaylistView.jsx (uses TrackRow → could use SongRow)
- **Affected CSS**: `TrackCard.css` becomes leaner. New CSS files per card type.
- **Store changes**: None — the `Track` type in `libraryStore.js` already has all needed fields. Accept `album` and `artist` objects as new props from service layer.
- **Bundle size**: Increases by ~3KB per new component (negligible), but reduces re-render surface area.

---

## 2. Grid & Layout System

### What BloomeeTunes does better
BloomeeTunes uses `ResponsiveBreakpoints.of(context)` with pixel-precise calculations:
```dart
// BloomeeTunes: Dynamic columns via ResponsiveBreakpoints
final smallerOrEqualToTABLET = ResponsiveBreakpoints.of(context).smallerOrEqualTo(TABLET);
final itemWidth = smallerOrEqualToTABLET ? width * 0.88 : width * 0.48;
final columnSize = 3;
final crossAxisCount = (width / (itemWidth + gap)).floor(); // dynamic columns
```

Key patterns:
- `final double itemWidth = smallerOrEqualTo(TABLET) ? width*0.88 : width*0.48` — viewport-relative sizing
- Items are chunked by `columnSize` (3 items per vertical column in horizontal scroll)
- `viewportFraction` varies by device: 0.65 (mobile), 0.40 (tablet), 0.30 (desktop)
- Grid columns calculated from actual available width, not hardcoded breakpoints
- `LayoutBuilder maxWidth < 750` switches between mobile (centered column) and desktop (side-by-side row)

### What we currently have
MoonPlayer uses CSS media queries at 768/1024 breakpoints:
- `useBreakpoint.js` — hook returning `{ isMobile, isTablet, isDesktop }` based on `matchMedia`
- `Library.css` (line 29): `grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))`
- `Home.css` (line 23): `grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))`
- `RecommendationCarousel.css` (line 91): fixed `160px` item width, jumps to `200px` at 768px
- No viewport-fraction-based sizing, no column count calculation relative to container width, no `LayoutBuilder`-equivalent for switching layout modes

### The gap
- Fixed pixel widths don't adapt to sidebar open/closed states
- CSS auto-fill causes visual jumps when columns reflow
- No responsive viewport fraction for carousels (hero slideshow, recommended items)
- No container-query-style layout switching (BloomeeTunes' `maxWidth < 750` check)

### Implementation guide

**Step 1: Create `useContainerWidth` hook**
- `src/hooks/useContainerWidth.js`
- Returns `{ containerRef, width }` using `ResizeObserver`
- Enables BloomeeTunes-style `LayoutBuilder` pattern in React

```jsx
// src/hooks/useContainerWidth.js
import { useState, useRef, useEffect } from 'react';
export function useContainerWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { containerRef: ref, width };
}
```

**Step 2: Create responsive column calculation utility**
- `src/core/utils/gridUtils.js`
- Implements BloomeeTunes' column calculation pattern

```js
// src/core/utils/gridUtils.js
export function calculateGridColumns(containerWidth, minItemWidth, gap) {
  const effectiveWidth = containerWidth + gap; // account for trailing gap
  const columns = Math.max(1, Math.floor(effectiveWidth / (minItemWidth + gap)));
  const usedWidth = columns * minItemWidth + (columns - 1) * gap;
  const remaining = containerWidth - usedWidth;
  return { columns, itemWidth: minItemWidth + remaining / columns, remaining };
}

export function getViewportFraction(containerWidth) {
  if (containerWidth < 768) return 0.65;
  if (containerWidth < 1024) return 0.40;
  return 0.30;
}
```

**Step 3: Update `RecommendationCarousel` to use container-based sizing**
- Replace fixed `160px` / `200px` item width with calculated width from container
- Use `useContainerWidth` on the scroll area
- Set `scroll-snap-type: x mandatory` (upgrade from `proximity` for BloomeeTunes-aligned precision)
- Pass `viewportFraction` to dynamically adjust item width

**Step 4: Create `ResponsiveGrid` component**
- `src/components/common/ResponsiveGrid/ResponsiveGrid.jsx` + `.css`
- BloomeeTunes-equivalent grid with dynamic columns

```jsx
<ResponsiveGrid minItemWidth={180} gap={16}>
  {items.map(item => <AlbumCard key={item.id} album={item} />)}
</ResponsiveGrid>
```

```jsx
// src/components/common/ResponsiveGrid/ResponsiveGrid.jsx
export function ResponsiveGrid({ children, minItemWidth = 180, gap = 16, className = '' }) {
  const { containerRef, width } = useContainerWidth();
  const { columns } = React.useMemo(() => calculateGridColumns(width, minItemWidth, gap), [width, minItemWidth, gap]);
  const style = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: `${gap}px`
  };
  return <div ref={containerRef} className={`responsive-grid ${className}`} style={style}>{children}</div>;
}
```

**Step 5: Create `LayoutSwitch` component (LayoutBuilder equivalent)**
- `src/components/common/LayoutSwitch/LayoutSwitch.jsx`
- Renders `mobile` or `desktop` children based on container width threshold (default 750px)
- Used in `PlaylistView` and `AlbumView` for switching between stacked and side-by-side layouts

### Impact analysis
- **Affected**: `Home.jsx`, `Library.jsx`, `RecommendationCarousel`, `PlaylistView`, all carousels
- **CSS files**: Remove hardcoded minmax grids from `Library.css`, `Home.css`. Replace with `ResponsiveGrid`.
- **New dependencies**: None — `ResizeObserver` is native in all modern browsers.
- **Performance**: `useContainerWidth` causes re-renders on resize; pair with `useMemo` for column calculations.

---

## 3. Home Page Composition

### What BloomeeTunes does better
BloomeeTunes home page uses a `CustomScrollView` with sliver-based sections:
```
CustomScrollView
  └── SliverAppBar (collapsible)
  └── SliverList
       ├── Carousel (hero banner, viewportFraction varies by device)
       ├── "Recently Played" → TabSongListWidget (horizontal tab-switchable rows)
       ├── "Last.FM Picks" → Song cards grid
       ├── "Plugin Home Sections" → HorizontalCardView per plugin
       │    └── Each section: title + horizontal scrollable cards
```
Key patterns:
- Sections are data-driven from a plugins system (each plugin registers a home section)
- Recently Played uses `TabSongListWidget` with tab filtering (All | Songs | Albums | Artists)
- Carousel `viewportFraction` varies: 0.65 mobile, 0.40 tablet, 0.30 desktop
- Endless scrolling via `_maybeLoadMore()` at 240px threshold
- Each section has a "Show all" action button
- Loading skeleton per section, not one monolithic loader

### What we currently have
MoonPlayer Home (`src/views/pages/Home.jsx`):
```jsx
<HeroSlideshow tracks={carousels[0].tracks} />
{carousels.map(carousel => (
  <RecommendationCarousel title={carousel.title} tracks={carousel.tracks} />
))}
```
- Single `useEffect` fetches all recommendations at once
- One global loading/error state for the entire page
- No section-specific loading skeletons (only one big skeleton for hero area)
- No "Recently Played" section on home (it's on Library)
- No "Show all" links
- No data-driven section system (recommendations are flat array from one API call)
- No empty states per section (only one global empty state)
- No lazy loading / infinite scroll

### The gap
- Home page is monolithic — one fetch, one loading state, one error state
- No section-level granularity (can't show "Recently Played" while "Recommendations" is loading)
- No recently played section on home (users expect it)
- No "Show all" navigation shortcuts
- No data-driven plugin-based section system

### Implementation guide

**Step 1: Create section data model**
- Define section types in a shared type: `{ id, title, type: 'carousel' | 'grid' | 'list', items, showAllLink?, loading?, error? }`
- Update `recommendationService.js` to return typed sections instead of flat arrays

**Step 2: Add "Recently Played" section to home**
- Import `useLibraryStore` to get `recentlyPlayed`
- Render `TabSongListWidget` equivalent — horizontal scrollable list with tab filtering
- Fixed to top below the hero carousel

```jsx
// In Home.jsx — after HeroSlideshow
<RecentlyPlayedSection tracks={recentlyPlayed} onShowAll={() => navigate('/playlist/recently_played')} />
```

**Step 3: Create section-level loading states**
- Replace single `loading` / `error` with per-section loading
- Each `RecommendationCarousel` manages its own loading skeleton
- BloomeeTunes pattern: `_lazyLoading_placeholder` per section, not global

**Step 4: Add "Show all" links**
- Each section has an optional `onShowAll` callback
- Renders a "Show all →" button in the section header
- Navigates to dedicated page or playlist view

**Step 5: Implement section skeleton matching**
- Create `SectionSkeleton` component that mimics the section layout
- `SectionSkeleton` renders differently per `type`:
  - `carousel-type`: wide shimmer banner
  - `grid-type`: 4-6 skeleton cards in a row
  - `list-type`: 5 skeleton rows

**Step 6: Add endless scroll (future phase)**
- Create `useInfiniteScroll` hook triggering at 240px from bottom (matching BloomeeTunes' threshold)
- Sections register their `hasMore` state and `loadMore` callback

### Impact analysis
- **Affected files**: `Home.jsx` (major rewrite), `Home.css` (restructure), `recommendationService.js` (return typed sections)
- **New components**: `RecentlyPlayedSection`, `SectionSkeleton`, `HomeSection` wrapper
- **Store changes**: `libraryStore.js` already has `recentlyPlayed` — no changes needed
- **Performance**: Add `React.memo` on each section to isolate re-renders

---

## 4. Search Screen Architecture

### What BloomeeTunes does better
BloomeeTunes search (`lib/screens/search/`) is **1270 lines** with sophisticated architecture:
- `ValueNotifier` for high-frequency state (avoids widget rebuild on every keystroke)
- `ContentBloc` for search results state management
- `SearchSuggestionBloc` for autocomplete suggestions
- Arrow key navigation through results (keyboard support)
- Category tabs: Tracks | Albums | Artists | Playlists
- Plugin selector to filter search source
- Floating frosted glass search bar (always visible, sticky)
- Recent searches section
- Categorized results with different rendering:
  - Tracks → `TrackRow` with play button + duration + artist
  - Albums → `AlbumCard` grid (2 columns)
  - Artists → `ArtistCard` horizontal list
  - Playlists → `PlaylistCard` horizontal list
- Search history with clear support

### What we currently have
MoonPlayer Search (`src/views/pages/Search.jsx`, 126 lines):
```jsx
const [query, setQuery] = useState('');
const [results, setResults] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
// ... debounced fetch → MusicService.searchSongs → TrackRow list
```
- Single flat list of `TrackRow` results
- No category tabs
- No autocomplete/suggestions
- No keyboard navigation
- No recent searches
- No album/artist/playlist results
- No frosted glass sticky search bar
- No search history

### The gap
- Search is flat and track-only; users can't discover albums or artists
- No suggestions while typing
- No keyboard navigation
- No recent searches for quick recall
- Single `MusicService.searchSongs` method doesn't return categorized results

### Implementation guide

**Step 1: Restructure search results to be categorized**
- Create `searchTypes.js`: `{ query, tracks: [], albums: [], artists: [], playlists: [], suggestions: [] }`
- Update `MusicService` to add `searchAll(query)` returning categorized results
- Create `SearchResultCategory` component that renders different layouts per type

```jsx
// Categorized results rendering
{results.tracks?.length > 0 && (
  <SearchResultCategory title="Tracks" type="list">
    {results.tracks.map(track => <TrackRow key={track.id} track={track} showImage />)}
  </SearchResultCategory>
)}
{results.albums?.length > 0 && (
  <SearchResultCategory title="Albums" type="grid" columns={2}>
    {results.albums.map(album => <AlbumCard key={album.id} album={album} />)}
  </SearchResultCategory>
)}
```

**Step 2: Add sticky frosted glass search bar**
- Move search input outside the scroll area (fixed/sticky positioning)
- Apply `backdrop-filter: blur(20px)` with `background: rgba(0,0,0,0.75)`
- Match BloomeeTunes' "floating frosted glass" pattern
- Update `Search.css`: `.search-page__input-wrapper` becomes `position: sticky; top: 0; z-index: 10;`

**Step 3: Add search suggestions panel**
- On input focus (query length > 0), show a suggestions dropdown
- Suggestions from: recent searches (localStorage), popular searches (API)
- Each suggestion is clickable → fills query + triggers search
- BloomeeTunes' `SearchSuggestionBloc` pattern: fetch suggestions on every keystroke with separate debounce

```jsx
// src/hooks/useSearchSuggestions.js
export function useSearchSuggestions(query) {
  const [suggestions, setSuggestions] = useState([]);
  // Debounced fetch from recent searches + API
  // Return { suggestions, recentSearches }
}
```

**Step 4: Add search history**
- Store recent searches in `preferenceStore` or `localStorage`
- Show on empty query (before user types)
- BloomeeTunes' recent search pattern: section above results with clear button

**Step 5: Add keyboard navigation**
- `onKeyDown` handler on search input
- Arrow Down → highlight first result
- Arrow Up → highlight previous result / return to input
- Enter → play highlighted track or navigate to highlighted album/artist
- Escape → clear search / close suggestions
- Reference: BloomeeTunes' arrow key navigation in `_SearchFieldState`

**Step 6: Add category filter chips**
- Below search bar: "All" | "Tracks" | "Albums" | "Artists" | "Playlists"
- Active chip highlights with accent color
- Tracks the active filter changes which result category is rendered
- Sticky below search bar, horizontal scrollable on mobile

### Impact analysis
- **Affected files**: `Search.jsx` (complete rewrite — grows from 126 to ~400 lines), `Search.css` (major additions), `MusicService.js` (add `searchAll` method)
- **New components**: `SearchResultCategory`, `SearchSuggestions`, `SearchFilterChips`, `RecentSearches`
- **Store changes**: `preferenceStore.js` — add `recentSearches: []` array
- **API changes**: `MusicService.searchAll(query)` returns categorized results
- **Performance**: ValueNotifier pattern not applicable in React; use `useDeferredValue` or separate suggestion debounce to avoid UI jank on fast typing

---

## 5. Library & Playlist Views

### What BloomeeTunes does better
BloomeeTunes library screen features:
- `SliverReorderableList` for drag-to-reorder playlists
- `AnimatedListItem` staggered entrance animation for each item
- `LibItemCard` with type-specific rendering:
  - Liked songs → red gradient heart icon + count
  - Recently played → clock icon + timestamp
  - Custom playlists → playlist name + track count + cover image
  - Downloaded → download badge + offline indicator
- Search-within-library (filter playlists by name)
- Long-press context menu per playlist (rename, delete, share, download)
- Section headers: "Recently Played", "Your Playlists", "Liked Songs"
- Empty states with illustrations and CTA buttons

### What we currently have
MoonPlayer Library (`src/views/pages/Library.jsx`, 194 lines):
- Inline `.playlist-card` elements rendered inside a CSS grid
- Two special cards (Liked Songs, Recently Played) + custom playlists from store
- Simple create-playlist modal
- Empty state with icon + text + CTA
- Reorderable: NOT supported (no drag-to-reorder)
- Search-within-library: NOT supported
- Type-specific rendering: basic (icon + background color differentiation)
- Animated entrance: NOT supported

### The gap
- No reorder for playlists on desktop (mobile Framer Motion Reorder could work)
- No search/filter within library
- No library item context menu (rename, delete, share)
- No section headers (Liked Songs / Recently Played / Playlists all mixed)
- No animated item entrance
- Dedicated `PlaylistCard` component doesn't exist (inline pattern used instead)

### Implementation guide

**Step 1: Extract inline cards into `PlaylistCard` component**
- As described in Section 1, Step 3
- Props: `playlist, variant: 'liked' | 'recent' | 'custom', onPlay, onMenu, onReorder?`

**Step 2: Add section headers to Library page**
- Group items into sections: "Recently Played" → "Playlists"
- Use BloomeeTunes' section header pattern: `h2` with "See all" link where applicable
- Each section has its own `AnimatePresence` for entrance

```jsx
<section className="library-page__section">
  <div className="library-page__section-header">
    <h2>Recently Played</h2>
  </div>
  {/* horizontal scroll or grid of recently played */}
</section>
```

**Step 3: Add AnimatedListItem entrance pattern**
- Wrap each list item in staggered entrance wrapper
- See Section 9 for implementation details

**Step 4: Add drag-to-reorder for playlists**
- Use `framer-motion`'s `Reorder.Group` (same pattern as `QueuePanel.jsx`)
- Only enable on desktop (mobile uses bottom nav, hard to drag)

```jsx
<Reorder.Group axis="y" values={playlists} onReorder={handleReorderPlaylists}>
  {playlists.map(playlist => (
    <Reorder.Item key={playlist.id} value={playlist}>
      <PlaylistCard playlist={playlist} />
    </Reorder.Item>
  ))}
</Reorder.Group>
```

**Step 5: Add search-within-library**
- Simple text input filtering playlists by name
- Could reuse filtered subset pattern:

```jsx
const [libFilter, setLibFilter] = useState('');
const filteredPlaylists = playlists.filter(p => 
  p.name.toLowerCase().includes(libFilter.toLowerCase())
);
```

**Step 6: Add playlist context menu (long-press)**
- `PlaylistContextMenu` component: Rename, Delete, Share, Download
- Reuses pattern from `TrackContextMenu.jsx`

### Impact analysis
- **Affected files**: `Library.jsx` (restructure with sections), `Library.css` (section styles), `libraryStore.js` (add reorder method if needed)
- **New components**: `PlaylistCard`, `PlaylistContextMenu`, `LibrarySection`
- **Store changes**: `libraryStore.js` — add `reorderPlaylists(newOrder)` action; `renamePlaylist` already exists
- **Bundle size**: Minimal (~2KB new components)

---

## 6. Album/Artist/Playlist Detail Views

### What BloomeeTunes does better
BloomeeTunes has dedicated views:
- **AlbumView** (665 lines) — blurred background from album art, header with art + title + artist + year + track count, action row (play all, shuffle, download, share, favorite), track list with numbered rows, infinite scroll
- **ArtistView** — header with circular art + name + monthly listeners + genre tags, top tracks section, albums section, "Related Artists" section, follow/share buttons
- **PlaylistView** (635 lines for remote, 832 lines for local) — collaborative playlist support, owner info, edit button, playlist description, track count + duration summary, reorderable track list
- **ChartView** (1046 lines) — rank-positioned list, peak position badges, chart movement indicators
- **LayoutBuilder maxWidth < 750** — switches between mobile (centered column) and desktop (side-by-side: cover art left + track list right)

Common patterns:
- Blurred backdrop from dominant color of cover art
- `SliverAppBar` collapsing header
- Action buttons: Play All, Shuffle, Download, Share, Favorite
- Infinite scroll with `_maybeLoadMore()`
- Track drag to reorder (for own playlists)
- Search within playlist tracks

### What we currently have
MoonPlayer has only `PlaylistView` (`src/views/pages/PlaylistView.jsx`, 188 lines):
- Static header with cover image + title + track count
- Play All button + Share + Delete buttons
- Flat list of `TrackRow` components
- Simple empty state
- Delete confirmation modal
- No: AlbumView, ArtistView, ChartView
- No: blurred background, action row variety, reorderable list, infinite scroll, track filtering

### The gap
- No dedicated Album or Artist pages — critical missing features
- PlaylistView lacks: blur backdrop, reorderable tracks, search within playlist, track count summary, collaborative features
- No responsive layout adaptation (mobile vs desktop side-by-side)

### Implementation guide

**Step 1: Create `AlbumView` page**
- `src/views/pages/AlbumView.jsx` + `AlbumView.css`
- Route: `/album/:id`
- Pattern from BloomeeTunes' `AlbumView`:

```jsx
export function AlbumView() {
  const { id } = useParams();
  const [album, setAlbum] = useState(null);
  const [bgColor, setBgColor] = useState('rgb(26, 30, 37)');

  useEffect(() => {
    // Fetch album details + tracks
    // Extract dominant color from cover
  }, [id]);

  return (
    <PageTransition>
      <div className="album-view">
        <div className="album-view__backdrop" style={{ background: bgColor }} />
        <div className="album-view__header">
          <img src={album.imageUrl} alt={album.title} />
          <div className="album-view__info">
            <span className="album-view__type">ALBUM</span>
            <h1>{album.title}</h1>
            <p>{album.artistName} · {album.year} · {album.trackCount} tracks</p>
          </div>
        </div>
        <div className="album-view__actions">
          <PlayAllButton />
          <ShuffleButton />
          <DownloadButton />
          <FavoriteButton />
        </div>
        <div className="album-view__tracks">
          {album.tracks.map((track, i) => (
            <SongRow key={track.id} track={track} index={i} />
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
```

**Step 2: Create `ArtistView` page**
- `src/views/pages/ArtistView.jsx` + `ArtistView.css`
- Route: `/artist/:id`
- Sections: Top Tracks, Albums, Related Artists
- BloomeeTunes' `ArtistView` pattern

**Step 3: Enhance `PlaylistView` with blurred backdrop**
- Add `colorExtractor.js` usage to extract dominant color from first track's cover art
- Render semi-transparent gradient background: `background: linear-gradient(to bottom, extractedColor, var(--bg-void))`
- Match BloomeeTunes' `AppBar` and blurred background pattern

**Step 4: Add responsive layout adaptation to PlaylistView/AlbumView**
- Use `useContainerWidth` hook
- At container width < 750px: stacked layout (cover above, tracks below)
- At container width >= 750px: side-by-side (cover left 40%, tracks right 60%)
- BloomeeTunes' `LayoutBuilder maxWidth < 750` pattern

```jsx
const { containerRef, width } = useContainerWidth();
const isCompact = width < 750;

return (
  <div ref={containerRef} className={`playlist-view ${isCompact ? 'playlist-view--compact' : 'playlist-view--expanded'}`}>
    {isCompact ? (
      // Mobile: stacked
      <>
        <HeaderSection />
        <TracksSection />
      </>
    ) : (
      // Desktop: side-by-side
      <div className="playlist-view__side-by-side">
        <div className="playlist-view__left-panel"><HeaderSection /></div>
        <div className="playlist-view__right-panel"><TracksSection /></div>
      </div>
    )}
  </div>
);
```

**Step 5: Add infinite scroll to track lists**
- Create `useInfiniteScroll` hook
- Used in PlaylistView, AlbumView for long track lists (>50 tracks)
- BloomeeTunes' `_maybeLoadMore()` at 240px threshold

### Impact analysis
- **New files**: `AlbumView.jsx`, `AlbumView.css`, `ArtistView.jsx`, `ArtistView.css`
- **Affected files**: `PlaylistView.jsx` (major enhancement), `PlaylistView.css` (responsive addition), `App.jsx` (add new routes), `MusicService.js` (add album/artist detail methods)
- **New routes**: `/album/:id`, `/artist/:id`
- **Sidebar/BottomNav**: No changes — navigation to albums/artists happens from search results and home page links
- **Store changes**: None needed — album/artist data can be fetched on mount and stored locally via `useState`

---

## 7. Player Component Architecture

### What BloomeeTunes does better
BloomeeTunes player uses a responsive `Stack` + `Row` architecture:
```
Mobile:
  Stack
    ├── _PlayerUI (full-screen art + controls)
    └── UpNextPanel (slide-up from bottom, draggable)

Desktop:
  Row
    ├── _PlayerUI (60% width, constrained)
    └── UpNextPanel (40% width, always visible)
```
Key patterns:
- `PlayerOverlayWrapper` — reusable wrapper for slide-up overlay panels (slide-up animation, drag-down-to-dismiss)
- `GradientProgressBar` — custom gradient that changes based on album art dominant color
- `UpNextPanel` — integrated in layout, not a separate overlay
- Player transport controls always visible — no separate collapsed/expanded states
- Volume slider integrated into desktop layout
- Queue/UpNext shown side-by-side on desktop, slide-up on mobile

### What we currently have
MoonPlayer has a **3-tier player** (`src/components/player/`):
```
Mobile:
  GlassPanel (fixed bottom)
    └── MiniPlayer (collapsed: art + title + play/pause + next)
  AnimatePresence
    └── FullscreenPlayer (slide-up from bottom, full screen)

Desktop:
  GlassPanel (fixed bottom, 80px height)
    └── BottomPlaybar (expanded: art + controls + progress + volume + queue toggle)
  AnimatePresence
    └── FullscreenPlayer (slide-up modal)
  Side panel (conditional)
    └── QueuePanel (if isQueueVisible)
```

Problems:
- `FullscreenPlayer.jsx` is 410 lines — handles too many concerns (art, lyrics, visualizer, options, sleep timer, color extraction, double-tap like)
- Queue/UpNext is a separate overlay panel, not integrated into player layout
- No album-art-based gradient on progress bar
- MiniPlayer → FullscreenPlayer transition is a full modal, not a push-up layout
- No collapsible UpNext panel on mobile (it's a separate sidebar on desktop only)

### Implementation guide

**Step 1: Create `PlayerOverlayWrapper` (BloomeeTunes' `PlayerOverlayWrapper` equivalent)**
- `src/components/player/PlayerOverlayWrapper/PlayerOverlayWrapper.jsx`
- Props: `isOpen, onClose, minDragDistance, children`
- Reusable slide-up panel with drag-down-to-dismiss
- Used by: QueuePanel (mobile), UpNextPanel, OptionsDrawer

```jsx
export function PlayerOverlayWrapper({ isOpen, onClose, children, minDragDistance = 100 }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.8 }}
          onDragEnd={(_, { offset, velocity }) => {
            if (offset.y > minDragDistance || velocity.y > 500) onClose();
          }}
          style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 500 }}
        >
          {children}
        </m.div>
      )}
    </AnimatePresence>
  );
}
```

**Step 2: Integrate QueuePanel into FullscreenPlayer layout**
- On desktop FullscreenPlayer: show `UpNextPanel` to the right of the art (40% width)
- On mobile FullscreenPlayer: queue is a `PlayerOverlayWrapper` (slide-up from bottom)
- BloomeeTunes' `Row` pattern: `_PlayerUI` (60%) + `UpNextPanel` (40%)

**Step 3: Create `GradientProgressBar`**
- `src/components/player/ProgressBar/GradientProgressBar.jsx`
- Accepts `dominantColor` prop
- Progress fill uses gradient: `linear-gradient(to right, dominantColor, var(--accent-moon))`
- BloomeeTunes' custom gradient progress bar pattern

**Step 4: Refactor FullscreenPlayer — extract sub-components**
- Split 410-line `FullscreenPlayer.jsx` into:
  - `FullscreenHeader.jsx` — close button, title bar, options button
  - `FullscreenArtwork.jsx` — album art with double-tap heart, visualizer integration
  - `FullscreenControlsSection.jsx` — progress bar, transport controls, volume
  - `FullscreenOptionsDrawer.jsx` — playback speed, sleep timer (extracted from inline)
  - `FullscreenNowPlaying.jsx` — title, artist, heart, lyrics toggle, sleep timer status

**Step 5: Add dominant color to progress bar**
- Already have `colorExtractor.js` — pass extracted color to `GradientProgressBar`
- Store color in FullscreenPlayer state (already done for bgColor)

### Impact analysis
- **Affected files**: `FullscreenPlayer.jsx` (refactor into sub-components), `GlobalPlayer.jsx` (update layout), `QueuePanel.jsx` (integrate into player), `BottomPlaybar.jsx` (update progress bar)
- **New components**: `PlayerOverlayWrapper`, `GradientProgressBar`, `FullscreenHeader`, `FullscreenArtwork`, `FullscreenControlsSection`, `FullscreenOptionsDrawer`, `FullscreenNowPlaying`
- **Store changes**: None — all state already in `playerStore.js`
- **Performance**: Sub-component extraction enables better memoization (e.g., `FullscreenArtwork` doesn't re-render when options drawer opens)
- **Bundle size**: Net neutral (refactoring, not adding)

---

## 8. Image Loading Strategy

### What BloomeeTunes does better
BloomeeTunes uses `LoadImageCached` with a **3-tier fallback** system:
```dart
// BloomeeTunes LoadImageCached pattern
Image.network(
  imageUrl,
  fit: BoxFit.cover,
  width: calculatedWidth * MediaQuery.devicePixelRatio,
  errorBuilder: (context, error, stackTrace) {
    if (localAssetPath != null) return Image.asset(localAssetPath); // Tier 2
    return fallbackWidget; // Tier 3
  },
  loadingBuilder: shimmerPlaceholder,
)
```

Key features:
- **3-tier fallback**: local asset → network URL → fallback widget
- **Memoized pixel-ratio-aware width**: `imageWidth * devicePixelRatio` to avoid blurry images on Retina
- **Static `_failedImageUrls` set**: caches failed URLs to avoid retrying broken images on rebuilds
- **Loading shimmer** built into the widget (not a separate component)
- **CachedNetworkImage** from the `cached_network_image` package for disk caching

### What we currently have
MoonPlayer uses standard `<img>` tags with `loading="lazy"`:
```jsx
<img 
  src={track.imageUrl || '/default-album-art.png'} 
  alt={track.title}
  className="track-card__image"
  loading="lazy"
/>
```

- **Fallback**: inline src fallback via `||` (no network error handling)
- **Retry**: No `onError` handler in `TrackCard` (but `BottomPlaybar` and `FullscreenPlayer` have `handleImageError`)
- **Cache**: Browser native caching only (no disk cache layer)
- **Pixel ratio**: No device-pixel-ratio-aware sizing
- **Failed URL tracking**: No mechanism to avoid retrying broken URLs
- **Loading**: No shimmer/placeholder during load (only skeleton container)

### The gap
- No 3-tier fallback — broken images show broken icon or nothing
- No failed URL tracking — re-renders will retry broken URLs
- No device-pixel-ratio-aware sizing — images may look blurry on Retina
- Inconsistent `onError` handling (some components have it, `TrackCard`, `HeroSlideshow`, `RecommendationCarousel` don't)

### Implementation guide

**Step 1: Create `ImgWithFallback` component**
- `src/components/common/ImgWithFallback/ImgWithFallback.jsx`
- Implements BloomeeTunes' 3-tier fallback pattern

```jsx
import React, { useState, useRef } from 'react';
import { Skeleton } from '../Skeleton/Skeleton';

// Static set to track permanently failed URLs across component instances
const failedImageUrls = new Set();

export const ImgWithFallback = React.memo(function ImgWithFallback({
  src,
  alt = '',
  fallbackSrc = '/default-album-art.png',
  fallbackComponent = null, // Tier 3: custom fallback JSX
  className = '',
  style = {},
  onLoad,
  onError,
  ...props
}) {
  const [status, setStatus] = useState(
    failedImageUrls.has(src) ? 'failed' : 'loading'
  );
  const loaded = useRef(false);

  const handleLoad = () => {
    if (!loaded.current) {
      loaded.current = true;
      setStatus('loaded');
      onLoad?.();
    }
  };

  const handleError = () => {
    if (src) failedImageUrls.add(src);
    setStatus('failed');
    onError?.();
  };

  if (status === 'loading') {
    return (
      <>
        {/* Hidden img for actual loading, show skeleton in its place */}
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          style={{ display: 'none' }}
          {...props}
        />
        <Skeleton variant="rect" className={className} style={style} />
      </>
    );
  }

  if (status === 'failed') {
    if (fallbackComponent) return fallbackComponent;
    return (
      <img src={fallbackSrc} alt={alt} className={className} style={style} {...props} />
    );
  }

  return <img src={src} alt={alt} className={className} style={style} {...props} />;
});
```

**Step 2: Add device-pixel-ratio-aware sizing utility**
- `src/core/utils/imageUtils.js`

```js
export function getOptimalImageUrl(baseUrl, targetWidth = 400) {
  if (!baseUrl) return null;
  const dpr = window.devicePixelRatio || 1;
  const optimalWidth = Math.round(targetWidth * dpr);
  // Append size params if URL supports it (e.g., Unsplash, Spotify-style APIs)
  if (baseUrl.includes('=')) return baseUrl;
  return `${baseUrl}?w=${optimalWidth}`;
}
```

**Step 3: Replace all `<img>` tags with `ImgWithFallback`**
- `TrackCard.jsx` line 75
- `TrackRow.jsx` line 91
- `HeroSlideshow.jsx` lines 98, 135
- `MiniPlayer.jsx` line 74
- `BottomPlaybar.jsx` line 60
- `FullscreenPlayer.jsx` line 253
- `QueuePanel.jsx` line 56

### Impact analysis
- **Affected files**: All components using `<img>` — 8 files minimum
- **New files**: `ImgWithFallback.jsx`, `ImgWithFallback.css`, `imageUtils.js`
- **Bundle size**: +2KB for the component
- **Performance**: `React.memo` prevents re-renders. `failedImageUrls` Set is module-scoped (doesn't persist across page reloads — intentional, allows retry on next session)

---

## 9. Animation & List Rendering Patterns

### What BloomeeTunes does better
BloomeeTunes uses `AnimatedListItem` for staggered list animations:
```dart
// BloomeeTunes: AnimatedListItem
AnimatedListItem(
  index: index,
  child: ListTile(...)
)

// Animation config:
// - Stagger: 30ms per index
// - Duration: 250ms per item
// - Curve: easeOutQuart (decelerating)
// - Direction: fade-in + slide-up (0 → 1 opacity, 20px → 0 translateY)
```

Key features:
- Used in EVERY list: search results, library, playlists, album tracks
- `easeOutQuart` curve — natural-feeling deceleration (starts fast, ends slow)
- 250ms + (30ms × index) — items don't all appear at once, create cascade
- HorizontalCardView uses similar but horizontal slide-in
- AnimatedPageView for page transitions (slide left/right)
- AnimatedSwitcher for content swap (e.g., switching between tracks)

### What we currently have
MoonPlayer uses framer-motion selectively:
- `PageTransition.jsx` — page-level entry animation (opacity + y, 300ms, `anticipate` easing)
- `AnimatePresence mode="wait"` in `App.jsx` — page exits
- `TrackRow.jsx` — uses `m.div` for drag gesture (no entrance animation)
- `QueuePanel.jsx` — `Reorder.Item` has `initial/ animate/ exit` for mount/unmount
- `FullscreenPlayer.jsx` — slide-up entrance with spring physics
- `HeroSlideshow.jsx` — slide transitions between featured tracks

**Missing**: No staggered list entrance animations anywhere. No AnimatedListItem equivalent. No `easeOutQuart` (using default spring/ease). No horizontal list cascade animation.

### The gap
- Lists feel static — items appear all at once
- No visual hierarchy or "cascade" effect when navigating between pages
- Users don't get visual feedback of content loading progressively
- framer-motion is already available (`framer-motion` in `package.json`) — not utilizing its full potential

### Implementation guide

**Step 1: Create `AnimatedListItem` component (framer-motion equivalent)**
- `src/components/common/AnimatedListItem/AnimatedListItem.jsx`

```jsx
import { m } from 'framer-motion';

export function AnimatedListItem({ index, children, className = '' }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.25,
        delay: index * 0.03, // 30ms stagger per index — BloomeeTunes' 30ms pattern
        ease: [0.25, 1, 0.5, 1], // easeOutQuart approximation
      }}
      className={className}
    >
      {children}
    </m.div>
  );
}
```

**Step 2: Apply `AnimatedListItem` to all lists**
- `Search.jsx` — wrap each `TrackRow` in `AnimatedListItem`
- `Library.jsx` — wrap each `PlaylistCard` in `AnimatedListItem`
- `PlaylistView.jsx` — wrap each `TrackRow` in `AnimatedListItem`
- `AlbumView.jsx` — wrap each `SongRow` in `AnimatedListItem`
- TrackRow itself: NOT wrapped (reuse AnimatedListItem as wrapper at the parent list level)

**Step 3: Add list wrapper `AnimatedList` for batch stagger**
- `src/components/common/AnimatedList/AnimatedList.jsx`
- Wraps a list of children with staggered entrance

```jsx
export function AnimatedList({ children, staggerDelay = 0.03 }) {
  return (
    <>
      {React.Children.map(children, (child, i) => (
        <AnimatedListItem key={child.key} index={i}>
          {child}
        </AnimatedListItem>
      ))}
    </>
  );
}
```

**Step 4: Add horizontal cascade for carousels**
- `RecommendationCarousel.jsx` — items slide in from right with stagger (0.05s per item)
- `RecentlyPlayedSection.jsx` — similar horizontal cascade

**Step 5: Implement `easeOutQuart` as a shared easing constant**
- Add to `src/styles/animations.css` or create `src/core/utils/animation.js`:

```js
export const EASE_OUT_QUART = [0.25, 1, 0.5, 1];
export const STAGGER_FAST = 0.03;   // 30ms — lists
export const STAGGER_MEDIUM = 0.05; // 50ms — grids
export const STAGGER_SLOW = 0.08;   // 80ms — carousels
```

### Impact analysis
- **Affected files**: `Search.jsx`, `Library.jsx`, `PlaylistView.jsx`, new `AlbumView.jsx`/`ArtistView.jsx`
- **New components**: `AnimatedListItem`, `AnimatedList`
- **Performance**: `framer-motion` handles layout animations off the main thread. 0.03s stagger on long lists (50 items) = 1.5s total cascade. Acceptable.
- **Bundle size**: ~0.5KB for the new components

---

## 10. Empty/Loading/Error State Components

### What BloomeeTunes does better
BloomeeTunes uses `SignBoardWidget` as a universal empty/error/loading state component:
```dart
// BloomeeTunes: SignBoardWidget pattern
SignBoardWidget(
  icon: Icons.music_note,        // Any icon
  title: "No songs found",        // Primary message
  description: "Try a different search term", // Subtitle
  actionText: "Browse Home",      // Optional CTA
  onAction: () => navigateHome(), // CTA callback
)
```

Additionally:
- `_lazyLoading_placeholder` — shimmer skeleton matching the exact layout of the content it replaces
- Error states with retry button (inline, not full-page)
- Empty states are contextual: different empty state for search vs library vs playlist
- Loading animation is smooth shimmer (not spinner or text)

### What we currently have
MoonPlayer has only `Skeleton` component: `src/components/common/Skeleton/Skeleton.jsx`
- Variants: `text`, `circle`, `rect`, `card`
- No icon support
- No message/description/action CTA
- No dedicated error state component
- Loading states are ad-hoc: `loading ? <Skeleton ... /> : <ActualContent />` in each view

Empty states are ad-hoc too:
- `Search.jsx` line 117-121: inline `<div>No results found</div>`
- `Library.jsx` line 141-149: inline div with icon + text + button
- `PlaylistView.jsx` line 136-138: inline `<div>This playlist is empty.</div>`

### The gap
- No reusable empty/error/state component
- Each view reimplements its own empty state (inconsistent styling)
- Error states are just text (no retry button in most views)
- No `SignBoardWidget` equivalent for quick consistent messaging
- No `_lazyLoading_placeholder` — skeletons don't match content layout exactly

### Implementation guide

**Step 1: Create `EmptyState` component (SignBoardWidget equivalent)**
- `src/components/common/EmptyState/EmptyState.jsx` + `.css`

```jsx
import { IconButton } from '../IconButton/IconButton';

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'empty', // 'empty' | 'error' | 'loading'
}) {
  return (
    <div className={`empty-state empty-state--${variant}`}>
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
    </div>
  );
}
```

**Step 2: Replace all ad-hoc empty states**
- `Search.jsx`:
  - Replace `"No results found"` with `<EmptyState icon={MagnifyingGlass} title="No results found" description="Try a different search term" />`
  - Replace `"Find your favorite music"` with `<EmptyState icon={MagnifyingGlass} title="Find your music" description="Search for songs, albums, or artists" />`
- `Library.jsx`:
  - Replace inline empty state with `<EmptyState icon={Playlist} title="Your library is empty" description="Save songs or create a playlist" actionLabel="Create Playlist" onAction={() => setIsCreateModalOpen(true)} />`
- `PlaylistView.jsx`:
  - Replace inline with `<EmptyState icon={MusicNotes} title="This playlist is empty" description="Add songs from the home page or search" />`

**Step 3: Create `ErrorState` component variant**
- Reuse `EmptyState` with `variant="error"` styling (red tint, error icon)
- Always includes a "Retry" action button
- Used in: Search (fetch error), Library (hydration error), Home (recommendation error)

**Step 4: Add `LoadingSkeleton` pattern (BloomeeTunes' `_lazyLoading_placeholder`)**
- Create `src/components/common/LoadingSkeleton/LoadingSkeleton.jsx`
- Matches content layout: pass a `shape` prop that describes the layout

```jsx
export function LoadingSkeleton({ shape = 'list', count = 5 }) {
  if (shape === 'card-grid') {
    return (
      <div className="loading-skeleton__grid">
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} variant="card" />
        ))}
      </div>
    );
  }
  // list shape — default
  return (
    <div className="loading-skeleton__list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="loading-skeleton__row">
          <Skeleton variant="rect" width={48} height={48} />
          <div className="loading-skeleton__text">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="30%" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Impact analysis
- **Affected files**: `Search.jsx`, `Library.jsx`, `PlaylistView.jsx`, `Home.jsx` (error states)
- **New components**: `EmptyState` (with built-in error variant), `LoadingSkeleton`
- **CSS**: `.empty-state--error` uses `var(--error)` for icon/text color
- **Bundle size**: +2KB
- **Consistency**: All views now use the same empty/error patterns

---

## Summary: File Change Manifest

### New files to create (17 files)
| File | Section |
|------|---------|
| `src/components/common/AlbumCard/AlbumCard.jsx` + `.css` | 1 |
| `src/components/common/ArtistCard/ArtistCard.jsx` + `.css` | 1 |
| `src/components/common/PlaylistCard/PlaylistCard.jsx` + `.css` | 1, 5 |
| `src/components/common/SongRow/SongRow.jsx` + `.css` | 1 |
| `src/components/common/ImgWithFallback/ImgWithFallback.jsx` + `.css` | 8 |
| `src/components/common/ResponsiveGrid/ResponsiveGrid.jsx` + `.css` | 2 |
| `src/components/common/LayoutSwitch/LayoutSwitch.jsx` | 2 |
| `src/components/common/AnimatedListItem/AnimatedListItem.jsx` | 9 |
| `src/components/common/AnimatedList/AnimatedList.jsx` | 9 |
| `src/components/common/EmptyState/EmptyState.jsx` + `.css` | 10 |
| `src/components/common/LoadingSkeleton/LoadingSkeleton.jsx` | 10 |
| `src/components/player/PlayerOverlayWrapper/PlayerOverlayWrapper.jsx` | 7 |
| `src/components/player/ProgressBar/GradientProgressBar.jsx` | 7 |
| `src/hooks/useContainerWidth.js` | 2 |
| `src/hooks/useSearchSuggestions.js` | 4 |
| `src/core/utils/gridUtils.js` | 2 |
| `src/core/utils/imageUtils.js` | 8 |
| `src/core/utils/animation.js` | 9 |
| `src/views/pages/AlbumView.jsx` + `.css` | 6 |
| `src/views/pages/ArtistView.jsx` + `.css` | 6 |
| `src/views/pages/SearchResultCategory.jsx` | 4 |

### Files to modify (13 files)
| File | Change |
|------|--------|
| `src/App.jsx` | Add routes for `/album/:id`, `/artist/:id` |
| `src/components/common/TrackCard/TrackCard.jsx` | Replace `<img>` with `ImgWithFallback` |
| `src/components/common/TrackRow/TrackRow.jsx` | Replace `<img>` with `ImgWithFallback` |
| `src/components/common/RecommendationCarousel/RecommendationCarousel.jsx` | Use container-based sizing, add horizontal stagger |
| `src/components/common/HeroSlideshow/HeroSlideshow.jsx` | Replace `<img>` with `ImgWithFallback` |
| `src/components/player/MiniPlayer/MiniPlayer.jsx` | Replace `<img>` with `ImgWithFallback` |
| `src/components/player/BottomPlaybar/BottomPlaybar.jsx` | Replace `<img>` with `ImgWithFallback`, use GradientProgressBar |
| `src/components/player/FullscreenPlayer/FullscreenPlayer.jsx` | Split into sub-components, replace `<img>` |
| `src/components/player/QueuePanel/QueuePanel.jsx` | Replace `<img>` with `ImgWithFallback` |
| `src/views/pages/Home.jsx` | Add Recently Played section, section-level loading |
| `src/views/pages/Search.jsx` | Categorized results, suggestions, filter chips, history |
| `src/views/pages/Library.jsx` | Use PlaylistCard, add sections, search, reorder |
| `src/views/pages/PlaylistView.jsx` | Blur backdrop, responsive layout, infinite scroll |
