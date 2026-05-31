# MoonPlayer Navigation & Responsive Layout — Implementation Guide

**Reference**: BloomeeTunes (Flutter/Dart, GoRouter) → MoonPlayer (React/JSX, react-router-dom v7)  
**Goal**: Port BloomeeTunes' navigation architecture, tab state preservation, responsive breakpoint system, and player layout integration.

---

## 1. Tab State Preservation with Shell Navigation

### BloomeeTunes Approach (with file refs)
- `lib/routes/app_router.dart:33-119` — `StatefulShellRoute.indexedStack` wrapping 5 branches
- `lib/screens/widgets/global_footer.dart:14-102` — `GlobalFooter` receives `StatefulNavigationShell`, renders horizontal/vertical nav + `_AnimatedPageView`
- Each branch maintains its own Navigator stack. Tab switch does not unmount — widget tree stays alive with scroll position
- Sub-routes (chart detail under Explore, playlist view under Library) push onto the same branch stack

### MoonPlayer Current State (with file refs)
- `src/App.jsx:36-47` — Flat `<Routes>` inside `<AnimatePresence mode="wait">` with `key={location.pathname}`
- Every navigation re-mounts the page component because the `key` changes and `AnimatePresence` destroys the exiting route
- `src/components/layout/AppShell/AppShell.jsx` — Wraps children but does not own navigation state; each page mounts fresh

### The Gap
No mechanism to keep a tab's DOM alive after navigating away. Scroll position, loaded data, and animation state are lost on every tab switch. BloomeeTunes' `indexedStack` is the equivalent of React's `<Outlet />` wrapped in a visibility-toggling shell.

### Implementation Steps

**Step 1: Create `routes/routeConstants.js`**
- File: `src/routes/routeConstants.js`
```js
// Tab shell routes
export const HOME = '/';
export const SEARCH = '/search';
export const LIBRARY = '/library';
export const LOCAL_MUSIC = '/local-music';
export const OFFLINE = '/offline';

// Named screens
export const SETTINGS = '/settings';
export const PLAYLIST_VIEW = '/playlist/:id';
export const ALBUM_VIEW = '/album/:id';
export const ARTIST_VIEW = '/artist/:id';
export const CHART_VIEW = '/chart/:id';
export const SONG_VIEW = '/song/:id';
export const LYRICS_VIEW = '/lyrics';

// Sub-routes (relative to parent tab)
export const IMPORT_MEDIA = 'import';
export const IMPORT_PROCESS = 'import/process';
```

**Step 2: Rename `AppShell` to `ShellLayout` and implement visibility-based tab preservation**
- File: `src/components/layout/ShellLayout/ShellLayout.jsx`
- Receive `children` (from `<Outlet />`) and render all tab pages in a wrapper that toggles `display: none` / `visibility: hidden` based on active path
- Keep a `Map<string, React.ReactNode>` of rendered pages so they stay mounted after first render
```jsx
import { useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar';
import { BottomNavigation } from '../BottomNavigation/BottomNavigation';
import { TopBar } from '../TopBar/TopBar';
import { GlobalPlayer } from '../../player/GlobalPlayer/GlobalPlayer';
import { QueuePanel } from '../../player/QueuePanel/QueuePanel';
import { useBreakpoint } from '../../../hooks/useBreakpoint';

const TAB_PATHS = ['/', '/search', '/library', '/local-music', '/offline'];

export function ShellLayout({ children }) {
  const location = useLocation();
  const { isMobile } = useBreakpoint();
  const renderedTabs = useRef({});

  const activeTab = useMemo(() => {
    for (const p of TAB_PATHS) {
      if (location.pathname.startsWith(p)) return p;
    }
    return null;
  }, [location.pathname]);

  const isTabRoute = TAB_PATHS.includes(activeTab);

  // If current route is a tab, store its rendered content
  if (isTabRoute) {
    renderedTabs.current[activeTab] = children;
  }

  const showSidebar = !isMobile;
  const showBottomNav = isMobile;

  return (
    <div className="shell-layout">
      {showSidebar && <Sidebar />}
      <div className="shell-layout__main-wrapper">
        <TopBar />
        <main className="shell-layout__content">
          {/* Always render all previously-visited tabs; toggle visibility */}
          {Object.entries(renderedTabs.current).map(([path, content]) => (
            <div
              key={path}
              style={{
                display: path === activeTab ? '' : 'none',
                height: '100%',
                width: '100%',
              }}
            >
              {content}
            </div>
          ))}
          {/* Non-tab routes (playlist/:id, settings, etc.) render directly */}
          {!isTabRoute && children}
        </main>
      </div>
      {showBottomNav && <BottomNavigation />}
      <GlobalPlayer />
    </div>
  );
}
```

**Step 3: Restructure `App.jsx` to use `<Outlet />` + `ShellLayout`**
- File: `src/App.jsx`
- Remove `AnimatedRoutes` function
- Replace flat `<Routes>` with a root layout route containing `ShellLayout`
```jsx
import { HashRouter, Routes, Route, Outlet } from 'react-router-dom';
import { ShellLayout } from './components/layout/ShellLayout/ShellLayout';

// Inside <HashRouter>:
<Routes>
  <Route element={<ShellLayout><Outlet /></ShellLayout>}>
    <Route index element={<Suspense><Home /></Suspense>} />
    <Route path={SEARCH} element={<Suspense><Search /></Suspense>} />
    <Route path={LIBRARY} element={<Suspense><Library /></Suspense>} />
    <Route path={LOCAL_MUSIC} element={<Suspense><LocalMusic /></Suspense>} />
    <Route path={OFFLINE} element={<Suspense><Offline /></Suspense>} />
    <Route path={PLAYLIST_VIEW} element={<Suspense><PlaylistView /></Suspense>} />
    <Route path={ALBUM_VIEW} element={<Suspense><AlbumView /></Suspense>} />
    <Route path={ARTIST_VIEW} element={<Suspense><ArtistView /></Suspense>} />
    <Route path={CHART_VIEW} element={<Suspense><ChartView /></Suspense>} />
    <Route path={SONG_VIEW} element={<Suspense><SongRedirectView /></Suspense>} />
    <Route path={SETTINGS} element={<Suspense><Settings /></Suspense>} />
    <Route path={LYRICS_VIEW} element={<Suspense><LyricsView /></Suspense>} />
  </Route>
</Routes>
```
- Move `AnimatePresence` + `PageTransition` into each page component, not at the route level

**Step 4: Move `PageTransition` into each page component**
- File: `src/views/pages/Home.jsx` (and all other pages)
```jsx
import { PageTransition } from '../../components/layout/PageTransition/PageTransition';

export function Home() {
  return (
    <PageTransition>
      {/* existing page content */}
    </PageTransition>
  );
}
```

### Files to Create
- `src/routes/routeConstants.js`
- `src/components/layout/ShellLayout/ShellLayout.jsx`
- `src/components/layout/ShellLayout/ShellLayout.css`

### Files to Modify
- `src/App.jsx` — Replace flat Routes with layout route + Outlet
- `src/views/pages/Home.jsx` — Wrap in PageTransition
- `src/views/pages/Search.jsx` — Wrap in PageTransition
- `src/views/pages/Library.jsx` — Wrap in PageTransition
- `src/views/pages/Settings.jsx` — Wrap in PageTransition
- `src/views/pages/PlaylistView.jsx` — Wrap in PageTransition
- `src/views/pages/SongRedirectView.jsx` — Wrap in PageTransition
- `src/main.jsx` — Update import paths if moved

### Integration Notes
- Sidebar/BottomNavigation must use `useLocation` + `useNavigate` (already do via `NavLink`)
- Tab visibility trick (`display: none`) keeps scroll position. Do not use `visibility: hidden` — it still paints invisible content, hurting performance
- The `renderedTabs` map persists across renders via `useRef`, so re-visiting a tab shows the exact same DOM state
- Non-tab routes like `/playlist/:id` render inline without tab preservation; they push onto the navigation stack

---

## 2. Navigation Architecture Restructure

### BloomeeTunes Approach (with file refs)
- `lib/core/constants/route_paths.dart` — All route names as `static const String` constants
- `lib/routes/app_router.dart:33-119` — Sub-routes nested under their parent tab (chart under Explore, playlist/import under Library)
- AddToPlaylist at root level (`/AddToPlaylist`), outside shell branches
- 5-level back button priority in `lib/screens/widgets/global_footer.dart:35-58`

### MoonPlayer Current State (with file refs)
- `src/App.jsx:37-44` — Inline path strings (`'/'`, `'/search'`, `'/playlist/:id'`, etc.)
- No sub-routing — all routes are flat
- No album, artist, chart, or lyrics routes
- Back button uses browser default (HashRouter), no custom priority

### The Gap
Missing route path constants cause brittle inline strings. No sub-routing means detail views lose tab context. No back button priority system causes poor UX on mobile (player overlay swallows back gesture).

### Implementation Steps

**Step 1: Create route path constants (as shown in Section 1, Step 1)**

**Step 2: Add new route components**
- `src/views/pages/AlbumView.jsx` — `/album/:id`
- `src/views/pages/ArtistView.jsx` — `/artist/:id`
- `src/views/pages/ChartView.jsx` — `/chart/:id`
- `src/views/pages/LyricsView.jsx` — `/lyrics` (fullscreen lyrics without player chrome)
- `src/views/pages/LocalMusic.jsx` — `/local-music` (tab stub)
- `src/views/pages/Offline.jsx` — `/offline` (tab stub)
- Lazy import all in `App.jsx`

**Step 3: Implement sub-routing for detail views**
- Use URL nesting rather than GoRouter-based branching
- Chart detail: navigated from Explore tab as `/chart/:id` (flat route, but detected as sub-view in ShellLayout)
- Playlist view under Library: `/playlist/:id` (same pattern)
- Add a `useBackNavigation` hook that detects if the current path is a "sub-route" and shows a back button in `TopBar`

```jsx
// src/hooks/useSubRoute.js
import { useLocation } from 'react-router-dom';

const SUB_ROUTE_PATTERNS = [
  { tab: '/', pattern: /^\/playlist\// },
  { tab: '/', pattern: /^\/album\// },
  { tab: '/', pattern: /^\/artist\// },
  { tab: '/', pattern: /^\/chart\// },
  { tab: '/', pattern: /^\/song\// },
  { tab: '/library', pattern: /^\/playlist\// },
];

export function useSubRoute() {
  const location = useLocation();
  for (const sr of SUB_ROUTE_PATTERNS) {
    if (sr.pattern.test(location.pathname)) return sr;
  }
  return null;
}
```

**Step 4: Implement back button priority system**
- File: `src/hooks/useBackHandler.js`
- Priority order (5 levels, matching BloomeeTunes):
  1. Navigator pops (browser history has entries)
  2. Collapse FullscreenPlayer overlay (if visible)
  3. Collapse QueuePanel (desktop, if open)
  4. Go to home tab if on another tab
  5. System exit (Capacitor `App.exitApp()` on mobile)
```jsx
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';

export function useBackHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isFullscreen, setFullscreen, isQueueVisible, setQueueVisibility } = usePlayerStore();

  useEffect(() => {
    const handlePopState = (e) => {
      // Priority 1: Browser back (default behavior) — only if history.length > 1
      // Priority 2: Fullscreen player visible → collapse it
      if (isFullscreen) {
        e.preventDefault();
        setFullscreen(false);
        window.history.pushState(null, '', window.location.href);
        return;
      }
      // Priority 3: Queue panel visible → collapse it (desktop)
      if (isQueueVisible) {
        e.preventDefault();
        setQueueVisibility(false);
        window.history.pushState(null, '', window.location.href);
        return;
      }
      // Priority 4: Not on home → go home
      if (location.pathname !== '/') {
        e.preventDefault();
        navigate('/');
        window.history.pushState(null, '', window.location.href);
        return;
      }
      // Priority 5: System exit — handled by Capacitor
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isFullscreen, isQueueVisible, location.pathname, navigate, setFullscreen, setQueueVisibility]);
}
```

### Files to Create
- `src/routes/routeConstants.js`
- `src/views/pages/AlbumView.jsx`
- `src/views/pages/ArtistView.jsx`
- `src/views/pages/ChartView.jsx`
- `src/views/pages/LyricsView.jsx`
- `src/views/pages/LocalMusic.jsx`
- `src/views/pages/Offline.jsx`
- `src/hooks/useSubRoute.js`
- `src/hooks/useBackHandler.js`

### Files to Modify
- `src/App.jsx` — Add new route imports and `<Route>` entries
- `src/components/layout/TopBar/TopBar.jsx` — Add back button when `useSubRoute()` returns truthy
- `src/components/layout/AppShell/AppShell.jsx` — Call `useBackHandler()`

### Integration Notes
- `/lyrics` route renders outside ShellLayout (fullscreen, no nav chrome) — use a conditional in App.jsx or a separate root-level route outside the layout route
- AddToPlaylist from BloomeeTunes is a root-level route — MoonPlayer can implement as a modal instead (no route needed initially)
- System exit (Priority 5) requires `import { App } from '@capacitor/app';` and calling `App.exitApp()`

---

## 3. Responsive Breakpoint System Refinement

### BloomeeTunes Approach (with file refs)
- `lib/main.dart:481-490` — `ResponsiveBreakpoints.builder` wrapping the entire app tree
- 4 breakpoints: MOBILE (0-450), TABLET (451-800), DESKTOP (801-1920), 4K (1921+)
- Accessed via `ResponsiveBreakpoints.of(context)` anywhere in widget tree — provides `.isMobile`, `.isTablet`, `.isDesktop`, `.smallerOrEqualTo(TABLET)`, etc.
- Used in `global_footer.dart:21`, `mini_player_widget.dart:157`, `chart/carousal_widget.dart:135-152`, `chart/chart_widget.dart:21-22`

### MoonPlayer Current State (with file refs)
- `src/hooks/useBreakpoint.js` — Custom hook with `window.matchMedia`
- 3 breakpoints: Mobile (< 768), Tablet (768-1023), Desktop (>= 1024)
- Hook must be called in each component that needs breakpoint info — no context provider
- Values are hardcoded strings; no named breakpoint constants

### The Gap
No React context provider means every component must import and call `useBreakpoint()` individually. Breakpoint values are mismatched with BloomeeTunes' tighter mobile range (0-450 vs 0-767). No `smallerOrEqualTo` / `largerOrEqualTo` API for range comparisons.

### Implementation Steps

**Step 1: Create `src/hooks/useResponsiveContext.js` (the context + provider)**
```jsx
import { createContext, useContext, useState, useEffect, useMemo } from 'react';

export const BREAKPOINTS = {
  MOBILE: { start: 0, end: 480, name: 'mobile' },
  TABLET: { start: 481, end: 800, name: 'tablet' },
  DESKTOP: { start: 801, end: 1440, name: 'desktop' },
  WIDE: { start: 1441, end: Infinity, name: 'wide' },
};

const ResponsiveContext = createContext(null);

export function ResponsiveProvider({ children }) {
  const [width, setWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1440);

  useEffect(() => {
    let rafId;
    const handleResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => setWidth(window.innerWidth));
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const value = useMemo(() => {
    const bp = width <= BREAKPOINTS.MOBILE.end ? BREAKPOINTS.MOBILE
      : width <= BREAKPOINTS.TABLET.end ? BREAKPOINTS.TABLET
      : width <= BREAKPOINTS.DESKTOP.end ? BREAKPOINTS.DESKTOP
      : BREAKPOINTS.WIDE;

    return {
      width,
      breakpoint: bp.name,
      isMobile: bp.name === 'mobile',
      isTablet: bp.name === 'tablet',
      isDesktop: bp.name === 'desktop' || bp.name === 'wide',
      isWide: bp.name === 'wide',
      smallerOrEqualTo(size) {
        const order = ['mobile', 'tablet', 'desktop', 'wide'];
        return order.indexOf(bp.name) <= order.indexOf(size);
      },
      largerOrEqualTo(size) {
        const order = ['mobile', 'tablet', 'desktop', 'wide'];
        return order.indexOf(bp.name) >= order.indexOf(size);
      },
    };
  }, [width]);

  return (
    <ResponsiveContext.Provider value={value}>
      {children}
    </ResponsiveContext.Provider>
  );
}

export function useResponsive() {
  const ctx = useContext(ResponsiveContext);
  if (!ctx) throw new Error('useResponsive must be used within ResponsiveProvider');
  return ctx;
}
```

**Step 2: Update `useBreakpoint.js` to delegate to context**
```jsx
// src/hooks/useBreakpoint.js — keep as thin wrapper for backward compat
export { useResponsive as useBreakpoint } from './useResponsiveContext';
```

**Step 3: Wrap app with `ResponsiveProvider`**
- File: `src/App.jsx` or `src/main.jsx`
```jsx
import { ResponsiveProvider } from './hooks/useResponsiveContext';

// Inside the render tree, wrapping <HashRouter>:
<ResponsiveProvider>
  <HashRouter>
    <AppInner />
  </HashRouter>
</ResponsiveProvider>
```

**Step 4: Update CSS breakpoints to match**
- File: `src/index.css` (or relevant CSS files)
- Replace `@media (min-width: 768px)` with:
```css
/* Mobile: 0-480px (default) */
/* Tablet: 481-800px */
@media (min-width: 481px) { ... }
/* Desktop: 801-1440px */
@media (min-width: 801px) { ... }
/* Wide: 1441px+ */
@media (min-width: 1441px) { ... }
```
- Update all CSS files that use `@media (min-width: 768px)` to use these new breakpoints
  - `src/components/layout/AppShell/AppShell.css:42` — Change to `@media (min-width: 481px)`

### Files to Create
- `src/hooks/useResponsiveContext.js`

### Files to Modify
- `src/hooks/useBreakpoint.js` — Delegate to `useResponsive` or re-export
- `src/main.jsx` — Wrap app in `<ResponsiveProvider>`
- `src/components/layout/AppShell/AppShell.css` — Update media query breakpoints
- All CSS files with hardcoded `768px` / `1024px` breakpoints

### Integration Notes
- The `useBreakpoint` hook is already imported in 5+ components; keeping it as a re-export prevents breaking changes
- `ResponsiveProvider` uses `requestAnimationFrame` for resize debouncing — avoids excessive re-renders
- Breakpoint comparison methods `smallerOrEqualTo` and `largerOrEqualTo` enable BloomeeTunes-style range checks (e.g., `isMobile || isTablet`)
- BloomeeTunes' 4K breakpoint is mapped to `WIDE` (1441+); can be extended later with a separate `is4K` flag

---

## 4. Layout Composition Enhancement

### BloomeeTunes Approach (with file refs)
- `lib/screens/widgets/global_footer.dart:23-101` — Composition: `PlayerOverlayWrapper` > `BackButtonListener` > `PopScope` > `Scaffold` > body (Row with VerticalNavBar + AnimatedPageView or just AnimatedPageView) + bottomNavigationBar (MiniPlayerWidget + HorizontalNavBar if mobile)
- `lib/screens/widgets/player_overlay_wrapper.dart` — `Stack` with child + slide-up player overlay (SlideTransition + FadeTransition, 300ms easeOutCubic)
- Player overlay stays mounted after first show (`_hasBeenShown` flag), enabling instant reopen

### MoonPlayer Current State (with file refs)
- `src/components/layout/AppShell/AppShell.jsx:14-45` — Flat div structure: Sidebar + main-wrapper (TopBar + content) + QueuePanel + BottomNavigation + GlobalPlayer
- `src/components/player/GlobalPlayer/GlobalPlayer.jsx:11-43` — Renders MiniPlayer or BottomPlaybar inline, with FullscreenPlayer as a separate AnimatePresence overlay
- No PlayerOverlay wrapper — FullscreenPlayer is a sibling, not layered over a persistent player container

### The Gap
FullscreenPlayer animates independently and covers the entire screen, not as a slide-up overlay over the main content. No persistent player overlay keeps the player component mounted. QueuePanel is always a sidebar, never a fullscreen overlay on mobile.

### Implementation Steps

**Step 1: Create `PlayerOverlayWrapper` component**
- File: `src/components/player/PlayerOverlayWrapper/PlayerOverlayWrapper.jsx`
```jsx
import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { FullscreenPlayer } from '../FullscreenPlayer/FullscreenPlayer';
import { usePlayerStore } from '../../../store/playerStore';

export function PlayerOverlayWrapper({ children }) {
  const { isFullscreen, setFullscreen } = usePlayerStore();
  const [hasBeenShown, setHasBeenShown] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isFullscreen && !hasBeenShown) setHasBeenShown(true);
  }, [isFullscreen, hasBeenShown]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {children}
      <AnimatePresence>
        {(isFullscreen || hasBeenShown) && (
          <m.div
            key="player-overlay"
            initial={{ y: '100%' }}
            animate={{ y: isFullscreen ? 0 : '100%' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 100,
              pointerEvents: isFullscreen ? 'auto' : 'none',
            }}
          >
            <FullscreenPlayer onClose={() => setFullscreen(false)} />
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

**Step 2: Integrate `PlayerOverlayWrapper` into `ShellLayout`**
- File: `src/components/layout/ShellLayout/ShellLayout.jsx`
- Replace the direct `children` rendering with:
```jsx
<PlayerOverlayWrapper>
  {children}
</PlayerOverlayWrapper>
```

**Step 3: Make QueuePanel a fullscreen overlay on mobile**
- File: `src/components/player/QueuePanel/QueuePanel.jsx`
- Wrap in AnimatePresence with slide-up from bottom on mobile:
```jsx
import { AnimatePresence, m } from 'framer-motion';

export function QueuePanel() {
  const { isMobile } = useBreakpoint();
  const { isQueueVisible, toggleQueueVisibility } = usePlayerStore();

  if (!isQueueVisible) return null;

  if (isMobile) {
    return (
      <AnimatePresence>
        <m.div
          className="queue-panel-overlay"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
        >
          <div className="queue-panel-overlay__handle" onClick={toggleQueueVisibility} />
          {/* existing queue panel content */}
        </m.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="queue-panel-sidebar">
      {/* existing queue panel content — stays as right sidebar on desktop */}
    </div>
  );
}
```

**Step 4: Remove `FullscreenPlayer` from `GlobalPlayer`**
- File: `src/components/player/GlobalPlayer/GlobalPlayer.jsx`
- Delete `<AnimatePresence>` block that mounts FullscreenPlayer
- GlobalPlayer now only renders MiniPlayer (mobile) or BottomPlaybar (desktop)
- FullscreenPlayer is now owned by `PlayerOverlayWrapper`

**Step 5: Update `AppShell.css` → `ShellLayout.css`**
- Rename classes: `.app-shell` → `.shell-layout`, `.app-shell__main-wrapper` → `.shell-layout__main-wrapper`, `.app-shell__content` → `.shell-layout__content`
- Remove `padding-bottom` hack for player space; the overlay is now absolute-positioned

### Files to Create
- `src/components/player/PlayerOverlayWrapper/PlayerOverlayWrapper.jsx`
- `src/components/player/PlayerOverlayWrapper/PlayerOverlayWrapper.css`
- `src/components/layout/ShellLayout/ShellLayout.css`

### Files to Modify
- `src/components/layout/ShellLayout/ShellLayout.jsx` — Add PlayerOverlayWrapper
- `src/components/player/GlobalPlayer/GlobalPlayer.jsx` — Remove FullscreenPlayer overlay
- `src/components/player/QueuePanel/QueuePanel.jsx` — Add mobile overlay mode
- `src/components/layout/AppShell/AppShell.css` — Delete/move to ShellLayout.css

### Integration Notes
- `PlayerOverlayWrapper` uses `pointerEvents: 'none'` when hidden so that clicks pass through to content underneath, matching BloomeeTunes' `Visibility(maintainState: true)` pattern
- BloomeeTunes' `_hasBeenShown` pattern ensures the player stays mounted after first open — instant slide-up on subsequent opens
- The spring animation (`type: 'spring'`) replaces BloomeeTunes' `AnimationController`-based slide, but provides similar feel

---

## 5. Detail View Layout Adaptation

### BloomeeTunes Approach (with file refs)
- Every detail view screen uses `LayoutBuilder` with `maxWidth < 750` to switch between column (mobile/tablet) and row (desktop) header layout
- `lib/screens/screen/chart/chart_widget.dart` — Adaptive header with `isMobile` flag
- `lib/screens/screen/library_views/playlist_screen.dart` — Similar pattern
- Headers: art on left, metadata on right (row) / art on top, metadata below (column)

### MoonPlayer Current State (with file refs)
- `src/views/pages/PlaylistView.jsx` — No adaptive header; one layout for all sizes
- No `AlbumView`, `ArtistView`, or `ChartView` exist yet

### The Gap
No reusable `DetailHeader` component. Each future detail view would need to re-implement the same responsive pattern. BloomeeTunes' `LayoutBuilder maxWidth < 750` pattern is not used anywhere.

### Implementation Steps

**Step 1: Create `src/components/common/DetailHeader/DetailHeader.jsx`**
```jsx
import { React, useMemo } from 'react';

export const DetailHeader = React.memo(function DetailHeader({
  imageUrl,
  title,
  subtitle,
  metadata,
  actions,
  fallbackImage = '/default-album-art.png',
  isCompact: forceCompact,
  children,
}) {
  const { isMobile } = useBreakpoint();
  const isCompact = forceCompact !== undefined ? forceCompact : isMobile;

  return (
    <div className={`detail-header ${isCompact ? 'detail-header--compact' : 'detail-header--expanded'}`}>
      <div className="detail-header__art">
        <img
          src={imageUrl || fallbackImage}
          alt={title}
          className="detail-header__image"
        />
      </div>
      <div className="detail-header__info">
        {subtitle && <span className="detail-header__subtitle">{subtitle}</span>}
        <h1 className="detail-header__title">{title}</h1>
        {metadata && <p className="detail-header__metadata">{metadata}</p>}
        {actions && <div className="detail-header__actions">{actions}</div>}
        {children}
      </div>
    </div>
  );
});
```

**Step 2: Create `src/components/common/DetailHeader/DetailHeader.css`**
```css
.detail-header {
  display: flex;
  gap: var(--space-6);
  padding: var(--space-6);
}

.detail-header--compact {
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.detail-header--expanded {
  flex-direction: row;
  align-items: flex-end;
}

.detail-header__art {
  flex-shrink: 0;
}

.detail-header--compact .detail-header__art {
  width: 200px;
  max-width: 60vw;
}

.detail-header--expanded .detail-header__art {
  width: 280px;
}

.detail-header__image {
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--radius-lg);
  object-fit: cover;
  box-shadow: var(--shadow-lg);
}

.detail-header__info {
  min-width: 0;
}

.detail-header--expanded .detail-header__info {
  flex: 1;
  padding-bottom: var(--space-2);
}

.detail-header__subtitle {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
  font-weight: 600;
}

.detail-header__title {
  font-size: var(--text-3xl);
  font-weight: 700;
  margin: var(--space-1) 0;
  line-height: 1.15;
}

.detail-header--compact .detail-header__title {
  font-size: var(--text-2xl);
}

.detail-header__metadata {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.detail-header__actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.detail-header--compact .detail-header__actions {
  justify-content: center;
}
```

**Step 3: Apply `DetailHeader` to `PlaylistView`**
- File: `src/views/pages/PlaylistView.jsx`
```jsx
import { DetailHeader } from '../../components/common/DetailHeader/DetailHeader';

export function PlaylistView() {
  // ... existing logic
  return (
    <div className="playlist-view">
      <DetailHeader
        imageUrl={playlist.coverUrl}
        title={playlist.name}
        subtitle="Playlist"
        metadata={`${playlist.trackCount} songs`}
        actions={<PlayButton onClick={handlePlayAll} />}
      />
      {/* track list */}
    </div>
  );
}
```

**Step 4: Apply `DetailHeader` to new views (AlbumView, ArtistView, ChartView)**
- `AlbumView`: subtitle="Album", metadata={`${album.year} · ${album.trackCount} tracks`}
- `ArtistView`: image centered, subtitle="Artist", metadata={`${albumCount} albums · ${monthlyListeners} monthly listeners`}
- `ChartView`: subtitle="Chart", metadata={`Top ${chart.itemCount}`}

### Files to Create
- `src/components/common/DetailHeader/DetailHeader.jsx`
- `src/components/common/DetailHeader/DetailHeader.css`

### Files to Modify
- `src/views/pages/PlaylistView.jsx` — Use DetailHeader
- `src/views/pages/AlbumView.jsx` — Use DetailHeader
- `src/views/pages/ArtistView.jsx` — Use DetailHeader
- `src/views/pages/ChartView.jsx` — Use DetailHeader

### Integration Notes
- BloomeeTunes uses `LayoutBuilder(maxWidth < 750)` — the prop-based `forceCompact` achieves the same thing without inline LayoutBuilder
- BloomeeTunes applies this pattern per-screen, but extracting to a reusable component reduces duplication across 4+ views
- The `actions` slot accepts JSX for play buttons, shuffle buttons, follow buttons, etc.

---

## 6. Player Position & Navigation Integration

### BloomeeTunes Approach (with file refs)
- `lib/screens/widgets/global_footer.dart:86-94` — MiniPlayerWidget at bottom, then HorizontalNavBar below it on mobile
- `lib/screens/widgets/mini_player_widget.dart:160` — Swipe-up gesture on MiniPlayer shows full player overlay (`PlayerOverlayCubit.showPlayer()`)
- `lib/screens/widgets/player_overlay_wrapper.dart:107-122` — SlideTransition + FadeTransition from bottom (300ms)
- UpNextPanel as side panel on desktop (managed by cubit), not rendered in GlobalFooter

### MoonPlayer Current State (with file refs)
- `src/components/player/GlobalPlayer/GlobalPlayer.jsx:24-34` — MiniPlayer (mobile) / BottomPlaybar (desktop) in GlassPanel
- `src/components/player/MiniPlayer/MiniPlayer.jsx:25-33` — `onDragEnd` with swipe-up expands FullscreenPlayer via `onExpand` callback
- `src/components/player/FullscreenPlayer/FullscreenPlayer.jsx:184-196` — Spring-based slide-up overlay with drag-to-dismiss
- BottomPlaybar sits at the bottom of the page, MiniPlayer overlays content

### The Gap
FullscreenPlayer is mounted/unmounted by `AnimatePresence` in `GlobalPlayer.jsx:36-40`. After Section 4 changes, FullscreenPlayer moves to `PlayerOverlayWrapper`. MiniPlayer and BottomPlaybar need to be separated from FullscreenPlayer management. Queue panel positioning differs between mobile (should be fullscreen) and desktop (sidebar).

### Implementation Steps

**Step 1: Restructure GlobalPlayer to only render persistent bar**
- File: `src/components/player/GlobalPlayer/GlobalPlayer.jsx`
```jsx
export function GlobalPlayer() {
  const { currentTrack } = usePlayerStore();
  const { isMobile } = useBreakpoint();

  if (!currentTrack) return null;

  return isMobile ? <MiniPlayer /> : <BottomPlaybar />;
}
```
- Remove `isFullscreen` state and `FullscreenPlayer` — that's now in PlayerOverlayWrapper

**Step 2: Update MiniPlayer swipe-up to trigger isFullscreen in store**
- File: `src/components/player/MiniPlayer/MiniPlayer.jsx`
- Remove `onExpand` prop
- Import `usePlayerStore` and call `setFullscreen(true)` on swipe-up
```jsx
const { setFullscreen } = usePlayerStore();

const handleDragEnd = (event, info) => {
  const { offset } = info;
  if (offset.y < -50) {
    setFullscreen(true); // Opens PlayerOverlayWrapper
  } else if (offset.x < -50) {
    next();
  } else if (offset.x > 50) {
    prev();
  }
};
```

**Step 3: Update BottomPlaybar queue button**
- File: `src/components/player/BottomPlaybar/BottomPlaybar.jsx`
- Queue button already calls `toggleQueueVisibility()` from `usePlayerStore`
- On desktop: QueuePanel appears as right sidebar
- On mobile: QueuePanel appears as fullscreen overlay (handled by QueuePanel component after Section 4 changes)

**Step 4: Add `usePlayerStore.persist` exclusion for UI-only state**
- File: `src/store/playerStore.js`
- Ensure `isFullscreen`, `isQueueVisible` are NOT persisted (add to `partialize` exclude list if needed)
- Currently at line 348-359 — `isFullscreen` and `isLyricsVisible` ARE persisted. Change to exclude them:
```js
partialize: (state) => ({
  currentTrack: state.currentTrack,
  queue: state.queue,
  queueIndex: state.queueIndex,
  volume: state.volume,
  loopMode: state.loopMode,
  isShuffled: state.isShuffled,
  isMuted: state.isMuted,
  previousVolume: state.previousVolume,
  // Remove isFullscreen, isLyricsVisible — UI state, not persistent
}),
```

### Files to Modify
- `src/components/player/GlobalPlayer/GlobalPlayer.jsx` — Simplify to bar-only
- `src/components/player/MiniPlayer/MiniPlayer.jsx` — Use store directly instead of onExpand prop
- `src/store/playerStore.js` — Remove UI state from persistence
- `src/components/layout/ShellLayout/ShellLayout.jsx` — Integrate PlayerOverlayWrapper

### Integration Notes
- BloomeeTunes' UpNextPanel is equivalent to MoonPlayer's QueuePanel
- Desktop: QueuePanel as right sidebar (width ~320px), toggled via queue button in BottomPlaybar
- Mobile: QueuePanel as fullscreen overlay with slide-up + drag handle, triggered from MiniPlayer
- The `isFullscreen` zustand flag becomes the single source of truth for PlayerOverlayWrapper visibility

---

## 7. Page Transition Refinement

### BloomeeTunes Approach (with file refs)
- `lib/screens/widgets/global_footer.dart:138-203` — `_AnimatedPageView` with `AnimationController` (250ms), `FadeTransition(opacity)` + `ScaleTransition(scale: 0.96→1.0)`, `Curves.easeOutCubic`
- Only applies on tab switch (not sub-route navigation)
- Subtle and fast — designed for a music app where frequent tab switching should feel snappy

### MoonPlayer Current State (with file refs)
- `src/components/layout/PageTransition/PageTransition.jsx` — Framer Motion variants with `y: 10→0`, `ease: 'anticipate'`, `duration: 0.3`
- `AnimatePresence mode="wait"` in `src/App.jsx:36` applies exit animations
- Translation-based transition is more pronounced and slightly slower than needed for tab switching

### The Gap
MoonPlayer applies page transitions to every navigation (including tab switches), but the `translateY` effect feels sluggish for a music app. BloomeeTunes' fade+scale is faster (250ms vs 300ms) and smoother (easeOutCubic vs anticipate).

### Implementation Steps

**Step 1: Update `PageTransition` with fade+scale pattern**
- File: `src/components/layout/PageTransition/PageTransition.jsx`
```jsx
import { m } from 'framer-motion';

const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.96,
  },
  in: {
    opacity: 1,
    scale: 1,
  },
  out: {
    opacity: 0,
    scale: 0.96,
  }
};

const pageTransition = {
  type: 'tween',
  ease: [0.25, 0.46, 0.45, 0.94], // easeOutCubic CSS equivalent
  duration: 0.25
};

export function PageTransition({ children }) {
  return (
    <m.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      style={{ minHeight: '100%', width: '100%' }}
    >
      {children}
    </m.div>
  );
}
```

**Step 2: Move `AnimatePresence` from `App.jsx` to `ShellLayout`**
- Each page component already wraps in `PageTransition`
- `ShellLayout` wraps the content area in `AnimatePresence mode="wait"` with `key={location.pathname}`
- But because we now preserve tab state (Section 1), tab switches do NOT re-mount — page transition is skipped for tabs
- Sub-route navigations (`/playlist/:id`, `/album/:id`) still trigger transitions because they aren't in `renderedTabs`

**Step 3: Apply `PageTransition` only to non-tab routes**
- File: `src/components/layout/ShellLayout/ShellLayout.jsx`
```jsx
import { AnimatePresence } from 'framer-motion';

// In the content area, wrap non-tab routes:
{!isTabRoute && (
  <AnimatePresence mode="wait">
    <div key={location.pathname}>
      {children}
    </div>
  </AnimatePresence>
)}
```

### Files to Modify
- `src/components/layout/PageTransition/PageTransition.jsx` — Scale+opacity, easeOutCubic, 250ms
- `src/components/layout/ShellLayout/ShellLayout.jsx` — Selective AnimatePresence
- `src/App.jsx` — Remove outer AnimatePresence (optional; can keep as fallback)

### Integration Notes
- BloomeeTunes' transition fires on tab switch via `_previousIndex` tracking in `didUpdateWidget`. MoonPlayer's tab visibility approach skips re-mount, so no animation needed on tab switch
- Only sub-route navigation (detail views) gets the transition
- The CSS cubic-bezier `[0.25, 0.46, 0.45, 0.94]` matches Flutter's `Curves.easeOutCubic` closely

---

## 8. Scroll Position Management

### BloomeeTunes Approach (with file refs)
- `StatefulShellRoute.indexedStack` inherently preserves scroll position per tab
- Each tab's Navigator stack maintains its own scroll state via `PageView` children that never unmount
- No manual scroll restoration needed

### MoonPlayer Current State (with file refs)
- Each navigation re-mounts the page, causing scroll to reset to top
- No `ScrollRestoration` component used

### The Gap
Without tab state preservation, scroll position is lost on every navigation. Even with the visibility-based preservation from Section 1, sub-routes (navigating to a detail view and back) will reset scroll.

### Implementation Steps

**Step 1: Ensure tab state preservation (Section 1) covers scroll position**
- The `display: none` approach in `ShellLayout` already preserves scroll — hidden divs keep their scroll offset in the DOM
- Test that scrolling to position X on tab A, switching to tab B, and switching back to tab A shows the same scroll position

**Step 2: Add scroll position restoration for sub-route navigation**
- File: `src/hooks/useScrollRestoration.js`
```jsx
import { useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useScrollRestoration(scrollContainerRef) {
  const location = useLocation();
  const scrollPositions = useRef({});

  useEffect(() => {
    const el = scrollContainerRef?.current;
    if (!el) return;

    const key = location.pathname + location.search;

    // Restore scroll on mount
    if (scrollPositions.current[key] !== undefined) {
      requestAnimationFrame(() => {
        el.scrollTop = scrollPositions.current[key];
      });
    }

    // Save scroll on unmount/navigate away
    return () => {
      scrollPositions.current[key] = el.scrollTop;
    };
  }, [location.pathname, location.search, scrollContainerRef]);
}
```

**Step 3: Apply to scrollable views**
- File: `src/views/pages/Home.jsx` (and other pages with scrolling content)
```jsx
import { useRef } from 'react';
import { useScrollRestoration } from '../../hooks/useScrollRestoration';

export function Home() {
  const scrollRef = useRef(null);
  useScrollRestoration(scrollRef);

  return (
    <div ref={scrollRef} style={{ overflowY: 'auto', height: '100%' }}>
      {/* content */}
    </div>
  );
}
```

### Files to Create
- `src/hooks/useScrollRestoration.js`

### Files to Modify
- `src/views/pages/Home.jsx` — Add scroll ref + useScrollRestoration
- `src/views/pages/Library.jsx` — Add scroll ref + useScrollRestoration
- `src/views/pages/Search.jsx` — Add scroll ref + useScrollRestoration
- `src/views/pages/LocalMusic.jsx` — Add scroll ref + useScrollRestoration
- `src/views/pages/Offline.jsx` — Add scroll ref + useScrollRestoration

### Integration Notes
- BloomeeTunes' indexedStack handles this automatically — MoonPlayer's manual approach is an equivalent pattern
- The `scrollPositions` ref persists across renders, so navigating away and back restores the exact scroll position
- The `requestAnimationFrame` wrapper ensures DOM layout is complete before restoring scroll

---

## 9. Navigation Item Expansion

### BloomeeTunes Approach (with file refs)
- `lib/screens/widgets/global_footer.dart:215-273` — 5 tabs: Explore, Library, Search, Local Music, Offline
- `NavigationRail` (desktop) with 5 `NavigationRailDestination` items
- `GNav` (mobile) with 5 `GButton` tabs
- Local Music and Offline are fully implemented screens with download management and local file scanning

### MoonPlayer Current State (with file refs)
- `src/components/layout/BottomNavigation/BottomNavigation.jsx:6-11` — 4 items: Home (/, House), Search (/search, MagnifyingGlass), Library (/library, Books), Settings (/settings, Gear)
- `src/components/layout/Sidebar/Sidebar.jsx:7-11` — 3 items (no Settings in nav group), Settings in separate bottom group

### The Gap
Only 4 nav items, missing Local Music and Offline tabs. Settings is a bottom-group item in sidebar but a first-class tab in bottom nav — inconsistent. Sidebar and bottom nav have different item sets.

### Implementation Steps

**Step 1: Update BottomNavigation to 5 items**
- File: `src/components/layout/BottomNavigation/BottomNavigation.jsx`
```jsx
import { House, MagnifyingGlass, Books, FolderOpen, Download } from '@phosphor-icons/react';
import { HOME, SEARCH, LIBRARY, LOCAL_MUSIC, OFFLINE } from '../../../routes/routeConstants';

const TABS = [
  { path: HOME, label: 'Home', icon: House },
  { path: SEARCH, label: 'Search', icon: MagnifyingGlass },
  { path: LIBRARY, label: 'Library', icon: Books },
  { path: LOCAL_MUSIC, label: 'Local Music', icon: FolderOpen },
  { path: OFFLINE, label: 'Offline', icon: Download },
];
```

**Step 2: Update Sidebar to match (5 items + Settings in bottom group)**
- File: `src/components/layout/Sidebar/Sidebar.jsx`
```jsx
import { House, MagnifyingGlass, Books, FolderOpen, Download, Gear } from '@phosphor-icons/react';

const NAV_ITEMS = [
  { path: HOME, label: 'Home', icon: House },
  { path: SEARCH, label: 'Search', icon: MagnifyingGlass },
  { path: LIBRARY, label: 'Your Library', icon: Books },
  { path: LOCAL_MUSIC, label: 'Local Music', icon: FolderOpen },
  { path: OFFLINE, label: 'Offline', icon: Download },
];
```
- Keep Settings in `sidebar__nav-group--bottom` as before, referencing `SETTINGS` constant

**Step 3: Create stub pages for Local Music and Offline**
- `src/views/pages/LocalMusic.jsx`:
```jsx
import { PageTransition } from '../../components/layout/PageTransition/PageTransition';
import { FolderOpen } from '@phosphor-icons/react';
import { usePreferenceStore } from '../../store/preferenceStore';

export function LocalMusic() {
  const { dataSaverEnabled } = usePreferenceStore();
  return (
    <PageTransition>
      <div className="stub-page">
        <FolderOpen size={48} />
        <h2>Local Music</h2>
        <p>Scan your device for local music files.</p>
      </div>
    </PageTransition>
  );
}
```
- `src/views/pages/Offline.jsx` — Same pattern with `Download` icon, text: "Downloaded tracks will appear here."

**Step 4: Ensure sidebar width accommodates 5 items**
- File: `src/components/layout/Sidebar/Sidebar.css`
- BloomeeTunes' VerticalNavBar has `minWidth: 70` per item — ensure MoonPlayer sidebar has enough min-width for 5 items + Settings
- Current sidebar likely works but verify `--collapsed` width (72px) still shows icons only

### Files to Create
- `src/views/pages/LocalMusic.jsx`
- `src/views/pages/Offline.jsx`

### Files to Modify
- `src/components/layout/BottomNavigation/BottomNavigation.jsx` — 5 tabs
- `src/components/layout/Sidebar/Sidebar.jsx` — 5 nav items
- `src/App.jsx` — Add LocalMusic and Offline routes

### Integration Notes
- Local Music and Offline are stubs — their full implementation depends on `DownloadService` and local file scanning (future work)
- The nav items are now consistent across sidebar and bottom nav, fixing the current inconsistency where Settings was a tab in bottom nav but a bottom-group link in sidebar
- BloomeeTunes has Settings as a header icon (gear in TopBar) rather than a nav tab — consider moving Settings there in future

---

## 10. Safe Area & System UI Integration

### BloomeeTunes Approach (with file refs)
- `lib/main.dart:153` — `WidgetsFlutterBinding.ensureInitialized()` and `setHighRefreshRate()`
- Material Scaffold handles `SafeArea` automatically via `bottomNavigationBar` SafeArea wrapper in `global_footer.dart:82`
- Immersive mode for fullscreen player: Android system UI visibility managed via `SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky)` in player screen
- Notch/cutout handling via Flutter's built-in `MediaQuery.of(context).padding`

### MoonPlayer Current State (with file refs)
- `src/components/layout/AppShell/AppShell.css:39` — Only `env(safe-area-inset-bottom, 0px)` in CSS `padding-bottom`
- `src/components/layout/BottomNavigation/BottomNavigation.css` — No safe area padding
- `src/components/player/FullscreenPlayer/FullscreenPlayer.jsx` — No immersive mode
- No Capacitor StatusBar plugin usage
- No system back gesture handling (Android hardware back)

### The Gap
CSS `env(safe-area-inset-*)` only covers iPhone X+ notch devices, not Android status bars/nav bars. No immersive mode for fullscreen player. No Capacitor native status bar management. System back gesture on Android is unhandled (browser back only).

### Implementation Steps

**Step 1: Install Capacitor StatusBar plugin**
```bash
npm install @capacitor/status-bar
npx cap sync
```

**Step 2: Create StatusBar management hook**
- File: `src/hooks/useStatusBar.js`
```jsx
import { useEffect, useCallback } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { isPlatform } from '@capacitor/core';

export function useStatusBar() {
  const setImmersive = useCallback(async (immersive) => {
    if (!isPlatform('capacitor')) return;
    try {
      if (immersive) {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setOverlaysWebView({ overlay: true });
        // Hide status bar on Android for fullscreen
        if (isPlatform('android')) {
          await StatusBar.hide();
        }
      } else {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setOverlaysWebView({ overlay: false });
        if (isPlatform('android')) {
          await StatusBar.show();
        }
      }
    } catch (e) {
      console.warn('StatusBar plugin error:', e);
    }
  }, []);

  return { setImmersive };
}
```

**Step 3: Integrate immersive mode into FullscreenPlayer**
- File: `src/components/player/FullscreenPlayer/FullscreenPlayer.jsx`
```jsx
import { useStatusBar } from '../../../hooks/useStatusBar';

export function FullscreenPlayer({ onClose }) {
  const { setImmersive } = useStatusBar();

  useEffect(() => {
    setImmersive(true);
    return () => { setImmersive(false); };
  }, [setImmersive]);

  // ... rest of component
}
```

**Step 4: Add Capacitor-safe safe area handling**
- File: `src/index.css`
```css
:root {
  --safe-area-top: env(safe-area-inset-top, 0px);
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-left: env(safe-area-inset-left, 0px);
  --safe-area-right: env(safe-area-inset-right, 0px);
}
```
- File: `src/components/layout/BottomNavigation/BottomNavigation.css`
```css
.bottom-nav {
  padding-bottom: var(--safe-area-bottom);
}
```

**Step 5: Handle Android system back gesture**
- File: `src/hooks/useBackHandler.js` (from Section 2, Step 4)
- Add Capacitor `App.addListener('backButton')` for hardware back on Android
```jsx
import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { isPlatform } from '@capacitor/core';

// Inside the existing useBackHandler effect:
useEffect(() => {
  if (!isPlatform('capacitor')) return;

  const handler = App.addListener('backButton', () => {
    // Same 5-level priority logic
    if (isFullscreen) {
      setFullscreen(false);
      return;
    }
    if (isQueueVisible) {
      setQueueVisibility(false);
      return;
    }
    if (location.pathname !== '/') {
      navigate('/');
      return;
    }
    App.exitApp();
  });

  return () => { handler.then(h => h.remove()); };
}, [isFullscreen, isQueueVisible, location.pathname]);
```

**Step 6: Update `ShellLayout.css` to use CSS safe area vars**
```css
.shell-layout__content {
  padding-top: var(--safe-area-top);
  padding-bottom: var(--safe-area-bottom);
  padding-left: var(--safe-area-left);
  padding-right: var(--safe-area-right);
}
```

### Files to Create
- `src/hooks/useStatusBar.js`

### Files to Modify
- `src/components/player/FullscreenPlayer/FullscreenPlayer.jsx` — Call useStatusBar
- `src/hooks/useBackHandler.js` — Add Capacitor backButton listener
- `src/index.css` — Add safe area CSS variables
- `src/components/layout/BottomNavigation/BottomNavigation.css` — Use safe-area-bottom
- `src/components/layout/ShellLayout/ShellLayout.css` — Use safe area padding

### Integration Notes
- BloomeeTunes handles safe areas natively via Flutter's `SafeArea` widget. MoonPlayer needs manual CSS + Capacitor plugin approach
- `env(safe-area-inset-*)` CSS functions require viewport-fit=cover in meta viewport tag (already set in `index.html`)
- Capacitor's `StatusBar.hide()` only works on Android; iOS requires `StatusBar.setOverlaysWebView({ overlay: true })` instead
- The backButton listener replaces the `popstate` listener on Capacitor platforms, since HashRouter doesn't fire popstate for hardware back
- BloomeeTunes' immersive mode is used for fullscreen lyrics (`SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky)`) — MoonPlayer should apply this to both FullscreenPlayer and the future LyricsView
