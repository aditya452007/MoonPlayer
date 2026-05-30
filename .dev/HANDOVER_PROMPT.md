# MoonPlayer Handover Prompt

**Welcome, Agent!** You are picking up the development of the MoonPlayer web application.

## 1. Project Context
MoonPlayer is a premium, streaming-only music application built with React (Vite).
- **Core Principles**: Dark-only theme, premium glassmorphism UI, "streaming-only" (no audio blob caching).
- **Tech Stack**: React, React Router, Zustand (Global State), Dexie.js (IndexedDB Caching), Howler.js (Audio Engine), Vanilla CSS (Design Tokens, NO CSS-in-JS).
- **API Source**: Unofficial JioSaavn API (`https://sumit.saavn.dev`).

## 2. Progress So Far
We have successfully completed **Phases 0 through 5**:
- **Phase 0**: Scaffolding, Vite config, CSS Design Tokens (`index.css`), global utilities.
- **Phase 1 (Design System)**: Built reusable vanilla CSS components (`GlassPanel`, `SolidPanel`, `Button`, `IconButton`, `Skeleton`).
- **Phase 2 (Layout System)**: Responsive `AppShell` with `framer-motion` page transitions, Desktop Sidebar, and Mobile Bottom Navigation.
- **Phase 3 (State & Storage)**: Zustand stores (`playerStore`, `preferenceStore`, `libraryStore`) synchronized with Dexie.js (`src/core/db/schema.js`).
- **Phase 4 (Music Engine)**: Abstract `MusicService` wrapping JioSaavn, and a fully decoupled `AudioEngine` powered by `Howler.js`.
- **Phase 5 (Global Player UI)**: Persistent floating player at the bottom of the screen (`GlobalPlayer`, `Controls`, `ProgressBar`, `VolumeControl`).

## 3. Your Immediate Task: Start Phase 6 (Core Views)
The user requires you to strictly follow the `PROGRESS.md` and `DEVELOPMENT_PHASES.md` files. Please open `c:\Users\Hp\MoonPlayer\.dev\PROGRESS.md` to verify the current state.

Your job is to implement **Phase 6**:
1. **Reusable Track Cards**: Build `TrackCard.jsx` and `TrackRow.jsx` to display songs using our Design System components.
2. **Home/Dashboard (`src/views/pages/Home.jsx`)**: Fetch trending/top tracks using `MusicService.getTrending()` and display them in a responsive CSS Grid. Add skeleton loaders for the loading state.
3. **Search View (`src/views/pages/Search.jsx`)**: Create a search input with a debounced query. Hook it up to `MusicService.searchSongs(query)` and render the results using `TrackRow.jsx`.
4. **Library View (`src/views/pages/Library.jsx`)**: Display the user's liked songs and custom playlists by reading from the `useLibraryStore`.

## 4. Strict Rules
- **No Tailwind CSS**. All styles must be written in standard CSS files using the CSS variables defined in `src/styles/index.css`.
- **One thing at a time**: Tackle Phase 6 entirely, verify it works by running `npm run dev -- --host 0.0.0.0`, and commit the changes before moving on.
- **Read the Context**: If you are unsure about API shapes, read `context/api_abstraction.md` and `context/api_reference.md`.
- **State Management**: Use the existing Zustand stores (`usePlayerStore`, `usePreferenceStore`, `useLibraryStore`).

**To begin your work:** Read this prompt, check `PROGRESS.md`, and generate your Implementation Plan for Phase 6. Let's build something beautiful!
