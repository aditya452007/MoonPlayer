# MoonPlayer -- Desktop & Mobile Features

> Status: RESTORED FROM MEMORY
> Date: 2026-05-28

## Desktop Layout (> 1024px)
- **3-Column Grid**: 250px Sidebar + Fluid Main Content + 320px Collapsible Queue Panel.
- **Playbar**: 80px fixed height at the bottom of the screen.
- **Interactions**: Drag-and-drop to reorder the queue. Right-click context menus for songs.
- **Keyboard Shortcuts**:
  - `Space` - Play/Pause
  - `Arrow Right/Left` - Skip +/- 10s
  - `Arrow Up/Down` - Volume +/-
  - `M` - Mute
  - `F` - Fullscreen player
  - `L` - Lyrics panel toggle
  - `Q` - Queue panel toggle
  - `P` - Pet visibility toggle
  - `Ctrl+L` - Focus search

## Mobile Layout (< 768px)
- **1-Column Grid**: Fluid Main Content with safe area padding.
- **Navigation**: Bottom Tabs (Home, Search, Library, Settings) replacing the sidebar.
- **Player**: Floating Mini-player above the bottom tabs.
- **Interactions**:
  - Swipe Up on Mini-player -> Expands to Fullscreen
  - Swipe Down on Fullscreen -> Collapses to Mini-player
  - Swipe Left/Right on Mini-player -> Next/Prev Track
  - Long-press -> Opens context menu (Bottom Sheet)
  - Swipe Right on track item -> Quick actions drawer
  - Double-tap album art -> Like song
