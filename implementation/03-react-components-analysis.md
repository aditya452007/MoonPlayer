# React Components Analysis

## Executive Summary

Analyzed 20 React component files across the MoonPlayer project. Found **15 issues** spanning error handling, React anti-patterns, performance, accessibility, state management, and event handling.

---

## Top-Level Components

### 1. App.jsx

- **Category**: Component Architecture
- **File**: `src/App.jsx`
- **Line**: 43
- **Severity**: medium
- **Issue**: `initQueueService()` is called at module level before React mounts. This side effect runs on import regardless of whether the component ever renders, which could cause issues in test environments or SSR contexts.
- **Suggestion**: Move `initQueueService()` into a `useEffect` inside `App`:

```jsx
useEffect(() => {
  initQueueService();
}, []);
```

- **Category**: Error Handling Issues
- **File**: `src/App.jsx`
- **Line**: 62
- **Severity**: low
- **Issue**: `UpdateService.checkForUpdates()` is called without await or try/catch. If it returns a promise and rejects, it will cause an unhandled promise rejection.
- **Suggestion**: Wrap in try/catch or add `.catch()`:

```jsx
UpdateService.checkForUpdates()?.catch(console.warn);
```

---

### 2. main.jsx

- **Category**: Error Handling Issues
- **File**: `src/main.jsx`
- **Line**: 9
- **Severity**: low
- **Issue**: `registerSW({ immediate: true })` is called at module level with no error handling. Service worker registration can fail (e.g., in private browsing, offline-first scenarios).
- **Suggestion**: Wrap in try/catch or add a `.catch()` handler to gracefully handle registration failures.

---

## Context Menu Components

### 3. ContextMenu.jsx

- **Category**: Performance Issues
- **File**: `src/components/common/ContextMenu/ContextMenu.jsx`
- **Line**: 10-11
- **Severity**: low
- **Issue**: `adjustedX`/`adjustedY` are stored as state but only recalculated via `useEffect` when `isOpen`, `x`, or `y` change. If the menu is open and the viewport resizes, the position becomes stale.
- **Suggestion**: Add a `resize` event listener (with cleanup) to recalculate position when viewport changes:

```jsx
useEffect(() => {
  if (!isOpen) return;
  const recalc = () => { /* recalc logic */ };
  window.addEventListener('resize', recalc);
  return () => window.removeEventListener('resize', recalc);
}, [isOpen, x, y]);
```

---

### 4. ContextMenuItems.jsx

- **Category**: Event Handler Issues
- **File**: `src/components/common/ContextMenu/ContextMenuItems.jsx`
- **Line**: 5-8
- **Severity**: high
- **Issue**: `onClick` is invoked without a null guard. If the parent omits the `onClick` prop, calling `onClick()` will throw a runtime error.
- **Suggestion**: Guard the call:

```jsx
onClick={(e) => {
  e.stopPropagation();
  onClick?.();
}}
```

---

### 5. TrackContextMenu.jsx

- **Category**: Error Handling Issues
- **File**: `src/components/common/ContextMenu/TrackContextMenu.jsx`
- **Line**: 43-50
- **Severity**: high
- **Issue**: `downloadService.downloadTrack(track)` and `shareService.shareTrack(track)` are called without try/catch. If either service rejects (e.g., network error, sharing API unavailable), the error bubbles up unhandled.
- **Suggestion**: Wrap each call in try/catch and optionally show a toast on failure.

- **Category**: Code Duplication
- **File**: `src/components/common/ContextMenu/TrackContextMenu.jsx`
- **Line**: 100-103
- **Severity**: low
- **Issue**: The Cancel button and the backdrop overlay both duplicate the same logic: `setShowPlaylistSelector(false); onClose();`. This logic appears three times (lines 64-66, 100-102, and implicitly in handlePlaylistSelect).
- **Suggestion**: Extract into a shared `handleCancel` function:

```jsx
const handleCancel = () => {
  setShowPlaylistSelector(false);
  onClose();
};
```

- **Category**: Component Architecture
- **File**: `src/components/common/ContextMenu/TrackContextMenu.jsx`
- **Line**: 55-110
- **Severity**: medium
- **Issue**: The playlist selector modal is inlined with extensive inline styles (lines 59-108). This modal duplicates styling patterns that should use CSS classes. It also makes the component ~80 lines heavier than necessary.
- **Suggestion**: Extract the playlist selector into a separate component with its own CSS file. Replace inline styles with class references.

- **Category**: React Anti-patterns
- **File**: `src/components/common/ContextMenu/TrackContextMenu.jsx`
- **Line**: 16
- **Severity**: low
- **Issue**: `isLiked` is derived from `likedSongs` on every render. While not expensive, it's a derived value that could be memoized with `useMemo` if `likedSongs` is large.
- **Suggestion**: Consider `useMemo` if `likedSongs` grows large:

```jsx
const isLiked = useMemo(
  () => likedSongs.some((t) => t.id === track.id),
  [likedSongs, track.id]
);
```

---

## Error Boundary

### 6. ErrorBoundary.jsx

- **Category**: Error Handling Issues
- **File**: `src/components/common/ErrorBoundary/ErrorBoundary.jsx`
- **Line**: 15-17
- **Severity**: low
- **Issue**: `componentDidCatch` only logs to console. In production, this provides no feedback to the user beyond the fallback UI, and no telemetry for debugging.
- **Suggestion**: Consider sending error details to a logging endpoint or at least triggering a toast notification with more context.

---

## Overlay Components

### 7. GestureGuideOverlay.jsx

- **Category**: Accessibility Issues
- **File**: `src/components/common/GestureGuideOverlay/GestureGuideOverlay.jsx`
- **Line**: 18-78
- **Severity**: medium
- **Issue**: No keyboard support. The overlay has no focus trap, no `Escape` key handler, and no close button. Users relying on keyboard navigation cannot dismiss it.
- **Suggestion**: Add a `useEffect` that listens for `Escape` key, and a close button. Consider adding `role="dialog"` and `aria-modal="true"`.

---

### 8. InstallPrompt.jsx

- **Category**: Error Handling Issues
- **File**: `src/components/common/InstallPrompt/InstallPrompt.jsx`
- **Line**: 29-39
- **Severity**: high
- **Issue**: `handleInstallClick` is async but has no try/catch. If `deferredPrompt.prompt()` or `deferredPrompt.userChoice` rejects (e.g., user cancels, API not supported), it causes an unhandled promise rejection.
- **Suggestion**: Wrap in try/catch:

```jsx
const handleInstallClick = async () => {
  if (!deferredPrompt) return;
  try {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
  } catch (err) {
    console.warn('Install prompt failed:', err);
  }
  setDeferredPrompt(null);
};
```

- **Category**: React Anti-patterns
- **File**: `src/components/common/InstallPrompt/InstallPrompt.jsx`
- **Line**: 10
- **Severity**: low
- **Issue**: `sessionStorage.getItem('installPromptDismissed')` is read during state initialization. If `sessionStorage` is unavailable (e.g., private browsing in some browsers), this throws.
- **Suggestion**: Wrap the lazy initializer in try/catch:

```jsx
const [isDismissed, setIsDismissed] = useState(() => {
  try { return !!sessionStorage.getItem('installPromptDismissed'); } 
  catch { return false; }
});
```

---

## Track Display Components

### 9. TrackCard.jsx

- **Category**: Effect Cleanup
- **File**: `src/components/common/TrackCard/TrackCard.jsx`
- **Line**: 25, 38-46
- **Severity**: high
- **Issue**: `longPressTimer` is a `useRef` + `setTimeout` without a cleanup effect on unmount. If the component unmounts during the 500ms long-press delay, `setMenuOpen(true)` fires on an unmounted component.
- **Suggestion**: Add a `useEffect` cleanup that clears the timer on unmount:

```jsx
useEffect(() => {
  return () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };
}, []);
```

- **Category**: Event Handler Issues
- **File**: `src/components/common/TrackCard/TrackCard.jsx`
- **Line**: 36-37
- **Severity**: medium
- **Issue**: `e.clientX` can be `0` (valid mouse position at left edge), which is falsy. The fallback `||` will incorrectly use `e.touches[0].clientX` when `clientX` is `0`.
- **Suggestion**: Use nullish coalescing or explicit undefined check:

```jsx
const clientX = e.clientX ?? (e.touches?.[0]?.clientX) ?? window.innerWidth / 2;
const clientY = e.clientY ?? (e.touches?.[0]?.clientY) ?? window.innerHeight / 2;
```

- **Category**: React Anti-patterns
- **File**: `src/components/common/TrackCard/TrackCard.jsx`
- **Line**: 14-21
- **Severity**: low
- **Issue**: Incomplete if-branch with a "Maybe handle pause here" comment. This is dead code that suggests missing functionality.
- **Suggestion**: Remove dead branch or implement intended pause behavior.

- **Category**: Performance Issues
- **File**: `src/components/common/TrackCard/TrackCard.jsx`
- **Line**: 9
- **Severity**: medium
- **Issue**: `TrackCard` is used inside lists (e.g., `RecommendationCarousel`) but is not wrapped in `React.memo`. The component re-creates handlers (`handlePlayClick`, `handleCardClick`, etc.) on every render, causing child components (like `SolidPanel` and `IconButton`) to re-render.
- **Suggestion**: Wrap with `React.memo` and use `useCallback` for handlers that are passed as props if performance profiling shows issues.

---

### 10. TrackRow.jsx

- **Category**: Effect Cleanup
- **File**: `src/components/common/TrackRow/TrackRow.jsx`
- **Line**: 17, 36-44
- **Severity**: high
- **Issue**: Same long-press timer cleanup issue as `TrackCard`. No `useEffect` cleanup on unmount.
- **Suggestion**: Add cleanup effect:

```jsx
useEffect(() => {
  return () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };
}, []);
```

- **Category**: Event Handler Issues
- **File**: `src/components/common/TrackRow/TrackRow.jsx`
- **Line**: 34-35
- **Severity**: medium
- **Issue**: Same falsy-zero `e.clientX`/`e.clientY` bug as `TrackCard`.
- **Suggestion**: Use nullish coalescing.

- **Category**: Performance Issues
- **File**: `src/components/common/TrackRow/TrackRow.jsx`
- **Line**: 54
- **Severity**: medium
- **Issue**: Uses `m.div` (framer-motion) with `drag` enabled. Each `TrackRow` in a list creates a motion component with drag physics, which adds significant overhead. Combined with no `React.memo`, list re-renders will recalculate framer-motion animations.
- **Suggestion**: Wrap in `React.memo`. Consider lazy-initializing drag only on actual gesture start rather than always enabling it.

- **Category**: Accessibility Issues
- **File**: `src/components/common/TrackRow/TrackRow.jsx`
- **Line**: 65-66
- **Severity**: medium
- **Issue**: The row has `role="button"` and `tabIndex={0}` but no `aria-label` or `aria-describedby`. Screen readers will announce "button" without context about which track it controls. Also missing `aria-current="true"` when `isCurrentTrack` is true.
- **Suggestion**: Add `aria-label={Play ${track.title}}` and `aria-current={isCurrentTrack ? 'true' : undefined}`.

---

## Shared UI Components

### 11. Button.jsx

- **Category**: Props/Interface Issues
- **File**: `src/components/common/Button/Button.jsx`
- **Line**: 15
- **Severity**: low
- **Issue**: `...props` is spread onto the `<button>` element without filtering. This passes through arbitrary attributes (including potentially invalid HTML attributes, React-specific props, etc.).
- **Suggestion**: Accept only known HTML button attributes explicitly, or use a prop filter utility.

---

### 12. IconButton.jsx

- **Category**: Accessibility Issues
- **File**: `src/components/common/IconButton/IconButton.jsx`
- **Line**: 24
- **Severity**: high
- **Issue**: `ariaLabel` is required for accessibility but has no default or validation. If a consumer omits `ariaLabel`, the icon button renders with no accessible label, making it invisible to screen readers.
- **Suggestion**: Make `ariaLabel` required in documentation and add a console warning in development:

```jsx
if (process.env.NODE_ENV === 'development' && !ariaLabel) {
  console.warn('IconButton requires an ariaLabel prop for accessibility');
}
```

---

### 13. ShortcutOverlay.jsx

- **Category**: Accessibility Issues
- **File**: `src/components/common/ShortcutOverlay/ShortcutOverlay.jsx`
- **Line**: 31-63
- **Severity**: high
- **Issue**: No focus trap. When the overlay is open, keyboard focus can tab to elements behind it. No `Escape` key handler to close the overlay. The backdrop has `onClick` (pointer users) but keyboard users have no way to dismiss.
- **Suggestion**: Implement focus trapping (e.g., `useFocusTrap` hook), add an `Escape` key listener, and set `role="dialog"` with `aria-modal="true"`.

- **Category**: React Anti-patterns
- **File**: `src/components/common/ShortcutOverlay/ShortcutOverlay.jsx`
- **Line**: 54
- **Severity**: low
- **Issue**: Array index used as key (`key={idx}`). While acceptable for a static list, it's conventionally discouraged.
- **Suggestion**: Use a stable ID from each shortcut entry or derive from `shortcut.key`:

```jsx
{shortcuts.map((shortcut) => (
  <div key={shortcut.key} className="shortcut-item">
```

---

### 14. GlassToast.jsx

- **Category**: Performance Issues
- **File**: `src/components/common/GlassToast/GlassToast.jsx`
- **Line**: 6-15
- **Severity**: low
- **Issue**: `getIcon` is re-created on every render. For a toast that only renders once, this is negligible, but the function definition is unnecessary overhead.
- **Suggestion**: Replace with a lookup object:

```jsx
const ICONS = {
  success: <CheckCircle size={20} weight="fill" style={{ color: 'var(--primary)' }} />,
  error:   <WarningCircle size={20} weight="fill" style={{ color: '#ef4444' }} />,
  default: <Info size={20} weight="fill" style={{ color: 'var(--text-secondary)' }} />,
};

const icon = ICONS[type] || ICONS.default;
```

---

### 15. ToastContainer.jsx

- **Category**: State Management Issues
- **File**: `src/components/common/GlassToast/ToastContainer.jsx`
- **Line**: 6
- **Severity**: low
- **Issue**: Uses full `toast` object in zustand selector. If the toast store changes unrelated fields, `ToastContainer` won't re-render because the selector is stable. This is correct, but the selector returns a new reference each time (array). However, since `useToastStore` uses shallow comparison by default for the selected value... actually, zustand v4+ uses referential equality. If `toasts` array is re-created on unrelated changes, it will cause re-render.
- **Suggestion**: Verify the store returns a stable reference for `toasts`. If it creates new arrays unnecessarily, use a comparison function or selector that returns a stable reference.

---

### 16. Skeleton.jsx

- **Category**: React Anti-patterns
- **File**: `src/components/common/Skeleton/Skeleton.jsx`
- **Line**: 19
- **Severity**: low
- **Issue**: Array index `i` used as key in a loop. For a skeleton placeholder that renders once, this is safe, but conventionally should use a unique ID or concatenation.
- **Suggestion**: While acceptable for this case, consider prefixing the key:

```jsx
key={`skeleton-${i}`}
```

- **Category**: Props/Interface Issues
- **File**: `src/components/common/Skeleton/Skeleton.jsx`
- **Line**: 12-28
- **Severity**: low
- **Issue**: `...props` is spread onto each skeleton `<div>`. If `style` is passed in `props`, it's used via `...props.style` inside the explicit `style` object. But `...props` also spreads the full `style` object onto the div first (via JSX spread order), then the explicit `style` object overrides it. However, other props like `onClick`, `data-*`, etc. are passed through without validation.
- **Suggestion**: Either destructure `style` from `props` and don't spread `...props`, or be explicit about which props are forwarded.

---

### 17. GlassPanel.jsx

- **Category**: Props/Interface Issues
- **File**: `src/components/common/GlassPanel/GlassPanel.jsx`
- **Line**: 10
- **Severity**: low
- **Issue**: `blur` prop accepts arbitrary string values but only handles `'heavy'` and `'light'`. Unknown values silently render with default blur.
- **Suggestion**: Use PropTypes or TypeScript union type, or add fallback logic.

---

### 18. SolidPanel.jsx

No issues found. Clean component.

---

### 19. DownloadButton.jsx

- **Category**: Error Handling Issues
- **File**: `src/components/common/DownloadButton/DownloadButton.jsx`
- **Line**: 11
- **Severity**: high
- **Issue**: `downloadService.downloadTrack(track)` is called without try/catch. If the download fails (network error, API failure, storage full), the error is unhandled.
- **Suggestion**: Wrap in try/catch and optionally show error feedback (e.g., via toast):

```jsx
const handleDownload = async (e) => {
  e.stopPropagation();
  try {
    await downloadService.downloadTrack(track);
  } catch (err) {
    console.error('Download failed:', err);
  }
};
```

---

### 20. RecommendationCarousel.jsx

- **Category**: Performance Issues
- **File**: `src/components/common/RecommendationCarousel/RecommendationCarousel.jsx`
- **Line**: 14
- **Severity**: medium
- **Issue**: `TrackCard` components inside the carousel are not memoized, and the carousel itself is not wrapped in `React.memo`. If the parent re-renders (e.g., due to audio player state changes), every `TrackCard` re-renders — including their images, icons, and context menus.
- **Suggestion**: Wrap `RecommendationCarousel` with `React.memo`. Ensure `TrackCard` also uses `React.memo` as noted above.

---

## Summary Table

| Category | Count | Severity |
|---|---|---|
| Error Handling Issues | 6 | 4 high, 2 low |
| React Anti-patterns | 3 | 1 low, 2 low |
| Performance Issues | 4 | 3 medium, 1 low |
| Code Duplication | 1 | 1 low |
| Props/Interface Issues | 3 | 3 low |
| Accessibility Issues | 4 | 3 high, 1 medium |
| State Management Issues | 1 | 1 low |
| Effect Cleanup | 2 | 2 high |
| Event Handler Issues | 3 | 1 high, 2 medium |
| Component Architecture | 2 | 1 medium, 1 low |

**Total issues found: 29** (8 high, 8 medium, 13 low)

### Critical Findings (High Severity)

1. **ContextMenuItems.jsx:7** — `onClick` called without null guard
2. **TrackContextMenu.jsx:43-50** — Unhandled async errors in download/share
3. **InstallPrompt.jsx:29-39** — Unhandled promise rejection in install handler
4. **TrackCard.jsx:38-41** — Long-press timer causes state update on unmounted component
5. **TrackRow.jsx:36-38** — Same long-press timer issue
6. **IconButton.jsx:24** — Missing `ariaLabel` renders invisible icon button
7. **ShortcutOverlay.jsx:31-63** — No focus trap or Escape handler
8. **DownloadButton.jsx:11** — Unhandled download error
