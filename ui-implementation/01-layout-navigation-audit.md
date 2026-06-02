# Layout & Navigation Audit

## 1. Shell Layout Architecture

**File:** `src/components/layout/ShellLayout/ShellLayout.jsx`

### Tab Caching Anti-Pattern (Critical)
```
TAB_PATHS = ['/', '/search', '/library', '/local-music', '/offline'];
```
`renderedTabs` is a `useRef` accumulating every visited tab permanently. All 5 tabs remain in the DOM indefinitely with `display: block/none` toggling. Effects, timers, and subscriptions in hidden tabs continue running.

**Fix:** Implement LRU cache with max 3 entries, use `visibility: hidden` + `position: absolute` instead of `display: none` to preserve scroll position without layout cost.

### Empty Media Queries (Low)
`ShellLayout.css:43-61` — three breakpoint blocks (481px, 801px, 1441px) contain only comments, no CSS.

**Fix:** Remove or populate with meaningful responsive rules.

---

## 2. Sidebar

**Files:** `Sidebar.jsx`, `Sidebar.css`

### Critical: Missing Tooltips on Collapse (WCAG Violation)
`Sidebar.css:117-119` — when a track plays, sidebar collapses to 72px mini-rail via `isCollapsed = currentTrack !== null`. Labels hidden with `display: none`. No tooltips.

**Fix:** Add `title` attributes to NavLink or wrap in a Tooltip component.

### Unexpected Collapse Behavior (Medium)
`Sidebar.jsx:18` — sidebar collapses on ANY track play, not on user action. User cannot control this.

**Fix:** Add a collapse toggle button, collapse only on user action.

### Deprecated NavLink Pattern (Low)
`Sidebar.jsx:34-39` — uses children-as-function render-prop which React Router v7 deprecates.

**Fix:** Use `className` callback + `useMatch()` for active detection.

---

## 3. Bottom Navigation

**Files:** `BottomNavigation.jsx`, `BottomNavigation.css`

### CRITICAL: Settings Missing on Mobile
`BottomNavigation.jsx:7-13` — 5 tabs defined: Home, Search, Library, Local Music, Offline. **No Settings tab.** Mobile users have zero navigation paths to Settings sidebar is hidden on mobile.

**Fix pathways:**
- Option A: Add 6th tab to bottom nav (crowded at 5)
- Option B (**recommended**): Add Settings gear icon to TopBar right side on mobile
- Option C: Make profile/settings accessible via long-press on Library or avatar icon

### Bottom Nav Overlays Content (High)
`BottomNavigation.css:2` — `position: absolute; bottom: 0;` with 80px height. Shell content has only `padding-bottom: var(--safe-area-bottom)` which may be < 80px.

**Fix:** Account for bottom nav height in content padding.

---

## 4. TopBar

**Files:** `TopBar.jsx`, `TopBar.css`

### CRITICAL: Empty Titles on Most Routes
`TopBar.jsx:14-22` — `getPageTitle()` switch only handles `/`, `/search`, `/library`, `/settings`. Returns `''` for: local-music, offline, playlist/:id, album/:id, artist/:id, chart/:id, equalizer, import-export.

### Missing Title on Sub-Route Back View (Medium)
`TopBar.jsx:27-34` — when showing back button, title is completely absent. On `/playlist/123`, user sees only a back arrow with no context.

**Fix:** Show page title alongside back button e.g., `<` + "Playlist Name" breadcrumb.

### Non-Functional User Icon (Medium)
`TopBar.jsx:55-57` — `User` icon has `ariaLabel="User profile"` but no onClick handler.

**Fix:** Either implement profile menu or remove the icon.

### Search Hint Desktop-Only (Medium)
`TopBar.css:44-52` — search hint is `display: none` by default, only visible at `>=768px`. Mobile users never see it.

**Fix:** Show search hint on mobile too, or wire it to open search page.

---

## 5. Responsive Breakpoint Issues

### Sidebar on Small Tablets (High)
`ShellLayout.jsx:29` — sidebar shown on tablets starting at 481px. At 481px, a ~240px sidebar leaves only 241px for content — essentially phone-sized.

**Fix:** Add a collapsed/hamburger sidebar variant for tablet (481-800px).

### Breakpoint Gap (Low)
TopBar uses 768px breakpoint (`TopBar.css:13`), but responsive context uses 481/801/1441. 768-801px gap creates inconsistent behavior.

**Fix:** Align all breakpoints.

---

## 6. Route Navigation Gaps

### Routes Without Constants (Medium)
`App.jsx:127-128` — equalizer and import-export routes are hardcoded strings, not from `routeConstants.js`.

### Route Constant Coverage

| Route | Path | Sidebar? | Bottom Nav? | Mobile Accessible? |
|-------|------|----------|-------------|-------------------|
| Home | `/` | Home | Home | Yes |
| Search | `/search` | Search | Search | Yes |
| Library | `/library` | Your Library | Library | Yes |
| Local Music | `/local-music` | Local Music | Local Music | Yes |
| Offline | `/offline` | Offline | Offline | Yes |
| **Settings** | **`/settings`** | **Settings** | **MISSING** | **NO** |
| Playlist | `/playlist/:id` | No direct link | No direct link | Via links |
| Album | `/album/:id` | No direct link | No direct link | Via links |
| Artist | `/artist/:id` | No direct link | No direct link | Via links |
| Chart | `/chart/:id` | No direct link | No direct link | Via links |
| Song | `/song/:id` | No direct link | No direct link | Via links |
| Lyrics | `/lyrics` | No direct link | No direct link | Via links |
| Equalizer | `/equalizer` | No direct link | No direct link | Via links |
| Import/Export | `/import-export` | No direct link | No direct link | Via links |

### Back Button Risk (Low)
`TopBar.jsx:31` — `navigate(-1)` could navigate out of the app if there's no previous in-app history.

**Fix:** Check `window.history.length > 1` first, fallback to `'/'`.

---

## Recommendations

1. Add Settings access on mobile via TopBar gear icon
2. Fix `getPageTitle()` with dynamic entity names for detail routes
3. Add collapsed sidebar variant for tablet breakpoint
4. Add tooltips to collapsed sidebar icons
5. Update content bottom padding to account for bottom nav height
6. Remove empty media query blocks from ShellLayout.css
7. Implement LRU tab caching (max 3) with proper cleanup
8. Use route constants for ALL routes
