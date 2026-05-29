# MoonPlayer -- User Flows

> Status: RESTORED FROM MEMORY
> Date: 2026-05-28

## 1. Onboarding Flow

**First-Time User (Web & Mobile)**
1. App Launches -> Renders `SplashScreen` (1.5s animation, logo slides up).
2. Renders `UsernameInput` -> User types name or skips (defaults to "guest").
3. Renders `LanguageArtistPicker` -> User selects at least 1 language, optionally selects artists.
4. User clicks "Get Started".
5. App saves preferences to `preferenceStore` (Dexie.js).
6. Redirects to `Home`.

**Returning User (Web & Mobile)**
1. App Launches -> Renders `SplashScreen` (0.5s quick flash).
2. App detects `isOnboardingComplete` in `preferenceStore`.
3. Redirects to `Home`.

## 2. Search & Playback Flow

1. User focuses `SearchBar`.
2. User types "Arijit".
3. `debounce(300ms)` waits for typing to stop.
4. Search bar displays `shimmer` background if rate limiter is queued.
5. `MusicService.searchAll("Arijit")` executes.
6. User clicks a Track from results.
7. `playerStore.play(track)` is called.
8. `MusicService.getTrackDetails(id)` is called to JIT-resolve the `.mp4`/`.aac` stream URL.
9. Audio begins playing.
10. Auto-queue logic kicks in, fetching 10 similar songs.

## 3. Playlist Creation Flow

1. User clicks the "More" (3-dot) menu on a Track.
2. Context menu opens (Dropdown on Desktop, Bottom Sheet on Mobile).
3. User selects "Add to Playlist".
4. User clicks "Create New Playlist".
5. Prompt asks for Playlist Name.
6. Playlist is created in `libraryStore` (Dexie.js).
7. Track is appended to the Playlist.
8. Toast notification appears: "Added to [Playlist Name]".
