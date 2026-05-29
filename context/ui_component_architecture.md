# MoonPlayer -- UI Component Architecture

> Status: RESTORED FROM MEMORY
> Date: 2026-05-28

## Component Hierarchy & Organization

- Components live in `src/components/` structured by feature domain (`common/`, `player/`, `search/`, `dashboard/`, `library/`).
- **Co-location**: Every component MUST have its own dedicated `.css` file next to its `.jsx` file. (e.g. `Button.jsx` and `Button.css`).
- **Isolation**: Components do NOT use global utility classes for layout, but can use them for simple modifiers like `.sr-only`. 
- **Data Attributes**: The root element of complex components MUST use `data-component="component-name"` for debugging and testing hooks.

## Export & Naming Rules

- **Named Exports Only**: `export function ComponentName() {}`. Default exports are strictly forbidden to ensure IDE refactoring reliability.
- **File Naming**: PascalCase for components (`SolidPanel.jsx`). CamelCase for utilities/hooks (`debounce.js`).

## CSS Patterns

- No CSS-in-JS. No Tailwind. Vanilla CSS only.
- All styles rely on CSS Custom Properties (`var(--bg-surface)`) defined in `index.css`.
- Class names should follow BEM-like scoping without strict double-underscores (e.g. `.search-bar` -> `.search-bar-input`).
- No `!important` tags.
