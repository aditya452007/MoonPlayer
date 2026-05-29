# MoonPlayer API Abstraction & Data Normalization Engine

> Status: FINAL
> Date: 2026-05-28

This document defines the technical specifications for the data abstraction layer of MoonPlayer. The abstraction layer ensures that raw API payload signatures retrieved from the JioSaavn endpoint are fully decoupled from the UI rendering layer. All transformations are encapsulated entirely within the `MusicService` singleton.

---

## 1. Concrete Entity Models (TypeScript Specifications)

The client application defines strict, immutable core entity interfaces used uniformly by the state stores (Zustand), view controllers, and React components.

### 1.1. The **Track** Interface
```typescript
interface Track {
  id: string;               // Unique string identifier
  title: string;            // Normalized clean song title
  artistNames: string[];    // Array of principal performing artists
  artistIds: string[];      // Associated artist IDs for routing
  albumId: string;          // Parent album identifier
  albumName: string;        // Parent album name
  duration: number;         // Track length represented in seconds
  streamUrl: string;        // Verified direct media CDN streaming link (.mp4 / .aac)
  imageUrl: string;         // High-quality artwork URL (filtered to 500x500 or maximum resolution)
  lyricsId: string | null;  // Lyrics index pointer, null if unavailable
}
```
*Note: The `isOfflineCached` property has been explicitly removed as MoonPlayer operates as a streaming-only platform with no audio blob caching.*

### 1.2. The **Artist** Interface
```typescript
interface Artist {
  id: string;
  name: string;
  avatarUrl: string;        // Decoupled high-quality headshot artwork link (500x500 preferred)
  languages: string[];      // Primary recording languages associated with artist
  dominantLanguage: string; // The artist's most frequent language track
  followersCount: number;
}
```

### 1.3. The **Album** Interface
```typescript
interface Album {
  id: string;
  name: string;
  year: string;
  songCount: number;
  imageUrl: string;
  songs: Track[];
}
```

### 1.4. The **Lyrics** Interface
```typescript
interface LyricsLine {
  text: string;
  timestampMs: number;      // Line activation time in milliseconds
}

interface Lyrics {
  trackId: string;
  isSynced: boolean;        // True if lyrics contain accurate timestamps
  rawText: string;          // Plain fallback text
  syncedLines: LyricsLine[];
}
```

---

## 2. Data Normalization Mapping Rules

The `MusicService` encapsulates private mapping methods to parse the complex, nested JSON responses from JioSaavn and output the flattened structures defined in Section 1. Static adapter classes are **not** permitted; all mapping must occur within the service context.

### 2.1 Track Property Mapping Logic

| Raw JioSaavn API Property Path | Target Entity Property | Data Transform Logic |
| :--- | :--- | :--- |
| `data[0].id` | `Track.id` | Cast to string. |
| `data[0].name` | `Track.title` | Decode HTML entities via RegExp map. |
| `data[0].primaryArtists` / `.artists.all[]` | `Track.artistNames` | Extract string array of primary artist names, trim and decode. |
| `data[0].artists.all[].id` | `Track.artistIds` | Extract string array of artist IDs. |
| `data[0].album.id` | `Track.albumId` | Cast to string. |
| `data[0].album.name` | `Track.albumName` | Decode HTML entities via RegExp map. |
| `data[0].duration` | `Track.duration` | Parse to standard integer representing total seconds. |
| `data[0].downloadUrl[].link` | `Track.streamUrl` | Selected dynamically based on user quality preference (e.g., 320kbps fallback to 192kbps). |
| `data[0].image[].link` | `Track.imageUrl` | Extract 500x500 resolution, fallback to the highest available index. |
| `data[0].hasLyrics` | `Track.lyricsId` | If boolean `true` or string `"true"`, map to `Track.id` for lyrics pointer. |

---

## 3. DOM-Free HTML Decoding

Raw JioSaavn API strings frequently contain encoded HTML entities (e.g., `&quot;`, `&#039;`, `&amp;`).
**CRITICAL**: `dangerouslySetInnerHTML` and DOM-based decoding (`document.createElement('textarea')`) are strictly forbidden to prevent XSS vulnerabilities and ensure SSR compatibility.

### 3.1 Implementation Specification

All entity decoding must utilize a pure string replacement utility mapping function:

```javascript
/**
 * Safe, DOM-free HTML entity decoder.
 * Used internally by MusicService.
 */
function decodeHtmlEntities(text) {
  if (!text || typeof text !== 'string') return '';
  
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&#39;': "'",
    '&apos;': "'"
  };
  
  return text.replace(/&amp;|&lt;|&gt;|&quot;|&#039;|&#39;|&apos;/g, match => entities[match] || match);
}
```

---

## 4. URL Resolution Logic

The `MusicService` performs array filtration to ensure appropriate media quality.

### 4.1 Image Quality Extractor
```javascript
// Internal MusicService utility
function extractBestImage(imageArray) {
  if (!Array.isArray(imageArray) || imageArray.length === 0) return "";
  
  // Target high-res explicitly
  const target = imageArray.find(img => img.quality === "500x500");
  if (target) return target.link;
  
  // Fallback to highest index (assumed highest available)
  return imageArray[imageArray.length - 1].link;
}
```

### 4.2 Stream Quality Selector
Stream resolution considers the user's explicit quality settings (from `preferenceStore`) or the enforced Data Saver mode limit:

```javascript
// Internal MusicService utility
function extractStreamUrl(downloadUrlArray, userPreferenceQuality) {
  if (!Array.isArray(downloadUrlArray) || downloadUrlArray.length === 0) return "";
  
  const target = downloadUrlArray.find(url => url.quality === userPreferenceQuality);
  if (target) return target.link;
  
  // Standard fallback cascade if preferred is missing
  const cascade = ["320kbps", "192kbps", "160kbps", "96kbps", "48kbps", "12kbps"];
  for (const quality of cascade) {
    const matched = downloadUrlArray.find(url => url.quality === quality);
    if (matched) return matched.link;
  }
  
  return downloadUrlArray[downloadUrlArray.length - 1].link;
}
```
