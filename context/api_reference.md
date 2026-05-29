# MoonPlayer API Reference and Integration Specification

> Status: FINAL
> Date: 2026-05-28
> Scope: Enterprise Technical Reference

This document serves as the authoritative reference for all API interactions between the MoonPlayer client application and the JioSaavn gateway. It defines the endpoint contracts, `MusicService` abstraction architecture, stream resolution strategy, error handling matrix, and network state machine governing client behavior.

---

## 1. API Endpoint Catalog

All requests target the public base URL `https://saavn.dev`. Every endpoint uses the `GET` method and returns JSON payloads. No authentication headers are required.

### 1.1 Endpoint Summary Table

| Endpoint | Method | Primary Parameters | Response Shape |
|:---|:---:|:---|:---|
| `/api/search` | `GET` | `query` (string, required) | `{ success, data: { songs, albums, artists, playlists, topQuery } }` |
| `/api/search/songs` | `GET` | `query` (string, required), `page` (int), `limit` (int) | `{ success, data: { total, start, results: Song[] } }` |
| `/api/search/albums` | `GET` | `query` (string, required), `page` (int), `limit` (int) | `{ success, data: { total, start, results: Album[] } }` |
| `/api/search/artists` | `GET` | `query` (string, required), `page` (int), `limit` (int) | `{ success, data: { total, start, results: ArtistSummary[] } }` |
| `/api/songs/{id}` | `GET` | `id` (string, path, required) | `{ success, data: Song[] }` |
| `/api/songs/{id}/lyrics` | `GET` | `id` (string, path, required) | `{ success, data: { lyrics, snippet, copyright } }` |
| `/api/albums/{id}` | `GET` | `id` (string, path, required) | `{ success, data: { id, name, songs: Song[], songCount, ... } }` |
| `/api/artists/{id}` | `GET` | `id` (string, path, required) | `{ success, data: { id, name, image, followerCount, ... } }` |
| `/api/artists/{id}/songs` | `GET` | `id` (string, path), `page` (int), `limit` (int) | `{ success, data: { total, results: Song[] } }` |
| `/api/artists/{id}/albums` | `GET` | `id` (string, path), `page` (int), `limit` (int) | `{ success, data: { total, results: Album[] } }` |
| `/api/playlists` | `GET` | `id` (string, query, required) | `{ success, data: { id, name, songs: Song[], songCount, ... } }` |

### 1.2 Error Response Envelope

All endpoints return errors in a uniform envelope:

```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

---

## 2. MusicService Abstraction Architecture

MoonPlayer enforces a strict **Service Layer architecture**. Components and stores must NEVER interact with HTTP clients, raw endpoints, or static adapters directly. All network activity is mediated through the `MusicService` singleton.

### 2.1 Core Principles

1. **Total Isolation**: Components call methods like `MusicService.searchSongs(query)` and receive strongly typed entities. They remain entirely unaware of JioSaavn.
2. **Pluggability**: If the JioSaavn gateway becomes unavailable, swapping the data source only requires rewriting the internal implementation of `MusicService`, with zero changes to React components or Zustand stores.
3. **Internal Normalization**: `MusicService` internally handles all HTML decoding, image resolution, and stream link extraction before returning data to the stores.

### 2.2 MusicService Contract

```typescript
interface IMusicService {
  searchSongs(query: string, page?: number, limit?: number): Promise<Track[]>;
  searchArtists(query: string, page?: number, limit?: number): Promise<Artist[]>;
  getTrackDetails(id: string, preferredQuality: string): Promise<Track>;
  getTrackLyrics(id: string): Promise<Lyrics>;
  getArtistDetails(id: string): Promise<Artist>;
  getArtistTopSongs(id: string, page?: number, limit?: number): Promise<Track[]>;
  getAlbumDetails(id: string): Promise<Album>;
  getPlaylistDetails(id: string): Promise<Playlist>;
}
```

---

## 3. Rate Limiting Architecture

The application implements a client-side Token Bucket algorithm within the `MusicService` layer to self-regulate outbound traffic.

### 3.1 Token Bucket Parameters

- **Bucket Capacity**: 20 tokens (allows initial burst for dashboard population)
- **Refill Rate**: 2 tokens/second
- **Queue Limit**: 10 requests FIFO
- **Timeout Strategy**: Wait indefinitely if queued, reject immediately if queue is full.

### 3.2 User Feedback

When requests are queued due to rate limiting, the UI provides non-blocking feedback.
- **Search Bar**: A subtle shimmer animation on the search bar background indicates rate limiting.
- **No Blocking Dialogs**: Requests queue silently behind the shimmer. No full-screen loaders or blocking overlays are used.

---

## 4. Stream URL Resolution Strategy

JioSaavn CDN stream URLs are time-limited tokens that expire shortly after generation. MoonPlayer uses a Just-In-Time (JIT) resolution pattern.

### 4.1 Resolution Flow

1. **Storage Constraint**: Stream URLs are NEVER persisted to the Dexie.js database. Only metadata is cached.
2. **JIT Fetch**: The `MusicService.getTrackDetails(songId, preferredQuality)` method is invoked at the exact moment the user presses Play.
3. **Single-Use**: Each playback session resolves a fresh URL. Replaying a song in "Loop One" mode reuses the valid cached URL, but skipping triggers a new resolution.
4. **Quality Cascade**: The service applies the user's quality preference from settings. Fallback sequence: `320kbps > 192kbps > 160kbps > 96kbps > 48kbps > 12kbps`.
5. **Data Saver Override**: If Data Saver is enabled in Settings, the cascade is capped at `96kbps` regardless of the explicit quality preference.

### 4.2 Stream Expiry Recovery

If a `403 Forbidden` response occurs mid-stream (indicating CDN token expiry), the audio engine automatically asks `MusicService` for a fresh URL and hot-swaps the source without resetting the user's progress.

---

## 5. Caching Strategy (Dexie.js)

All local caching relies exclusively on **Dexie.js**. No `localForage` or raw IndexedDB API usage is permitted.

### 5.1 Cache TTL Definitions

| Data Type | Cache Location | TTL | Eviction Strategy |
|:---|:---|:---:|:---|
| Song Metadata (No URLs) | Dexie.js `tracks` table | 30 days | LRU |
| Lyrics | Dexie.js `lyrics` table | 30 days | LRU |
| Artist Metadata & Albums | Dexie.js `artists` table | 7 days | LRU |
| Playlist Data | Dexie.js `playlists` table | 7 days | LRU |
| Search Results | Memory store only | Session | Cleared on exit |
| Recommendation Seed Pool | Memory store only | Session | Cleared on exit |

**CRITICAL**: Audio data / binary blobs are explicitly EXCLUDED from caching. MoonPlayer is a streaming-only application.

---

## 6. Error Response Handling Matrix

Every HTTP error condition is mapped to a standard recovery action.

| HTTP Status | Client Action | User-Facing Toast Message | Retry Strategy |
|:---|:---|:---|:---|
| `400` Bad Request | Log malformed parameters | "Search failed. Please try again." | No retry. |
| `403` Forbidden | Trigger JIT re-resolution (stream) | None (silent recovery) | 1 automatic retry for streams. |
| `404` Not Found | Invalidate Dexie.js cache entry | "This track is unavailable." | No retry. |
| `429` Too Many Requests | Apply shimmer to UI, pause bucket | None | Backoff inside Token Bucket. |
| `500`/`502` Server Error | Alert UI, fallback to cache if available | "Server error. Retrying..." | Max 3 retries (uniform). |
| Network Loss | Continue buffered playback | "Offline connection." (when buffer ends) | Wait for `online` event. |

Global React Error Boundary catches fatal application crashes to display: "Something went wrong, tap to reload".

---

## 7. Network State Machine

The client application tracks network connectivity to gracefully degrade features.

### 7.1 State Definitions

| State | Entry Condition | Available Features |
|:---|:---|:---|
| **Online** | `navigator.onLine === true` | Full streaming, search, lyrics, recommendations. |
| **Offline** | `navigator.onLine === false` | Cached metadata browsing only. NO offline playback. |

In the Offline state, playback controls are disabled and the application relies exclusively on data fetched from Dexie.js tables for browsing. User playlists are visible but tracks cannot be played.
