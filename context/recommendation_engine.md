# MoonPlayer -- Recommendation Engine & Auto-Queue

> Status: RESTORED FROM MEMORY
> Date: 2026-05-28

## Hybrid Recommendation Architecture

MoonPlayer uses a hybrid system because it lacks a dedicated machine learning backend. It relies on JioSaavn's API for "seed" data, and local client-side logic to rank and display the results.

### 1. Seed Data (API)
- The system fetches bulk raw data from:
  - `/api/artists/{id}/songs` (More from favorite artists)
  - `/api/search/songs?query={language}` (Language-based discovery)
  - `/api/albums/{id}` (Same album relations)

### 2. Local Ranking & Pool (Client-Side)
- **Session History**: The app tracks the last 20 played tracks *in memory* (cleared on app close).
- **User Preferences**: The app reads `liked songs`, selected `languages`, and selected `artists` from Dexie.js.
- **Ranking Engine**: The `recommendationService` assigns weight to the API seed data based on the user's history and preferences, randomizing slightly for variety.

## Auto-Queue

- **Trigger 1 (Immediate)**: When a user clicks a single song, the auto-queue immediately fetches and appends 10 similar tracks.
- **Trigger 2 (Lazy Load)**: When the queue drops to 3 remaining tracks, the engine silently fetches 10 more tracks and appends them.
- **Empty State**: If the queue ever completely empties, the system will pull directly from the Recommendation Pool to seamlessly continue playback without stopping.
