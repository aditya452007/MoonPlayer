/**
 * @typedef {Object} Track
 * @property {string} id
 * @property {string} title
 * @property {string[]} artistNames
 * @property {string[]} artistIds
 * @property {string} albumId
 * @property {string} albumName
 * @property {number} duration
 * @property {string} streamUrl
 * @property {string} imageUrl
 * @property {string|null} lyricsId
 */

/**
 * @typedef {Object} Playlist
 * @property {string} id
 * @property {string} name
 * @property {string|null} description
 * @property {Track[]} tracks
 * @property {string|null} coverImage
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {number} trackCount
 */

/**
 * @typedef {'network'|'api'|'audio'|'storage'|'unknown'} ErrorCategory
 */

/**
 * @typedef {Object} AppError
 * @property {string} message
 * @property {ErrorCategory} category
 * @property {boolean} recoverable
 * @property {number} timestamp
 * @property {string} [stack]
 */

/**
 * Data Ownership Map:
 *
 * ┌─────────────────────┬──────────────────────────────┬─────────────────────────┐
 * │ Data Type           │ Source of Truth              │ Consumers               │
 * ├─────────────────────┼──────────────────────────────┼─────────────────────────┤
 * │ currentTrack        │ playerStore                  │ BottomPlaybar, Controls │
 * │ isPlaying           │ playerStore                  │ Controls, Fullscreen    │
 * │ queue, queueIndex   │ queueStore                   │ QueuePanel, next/prev   │
 * │ playlists           │ libraryStore                 │ Library page, Playlist  │
 * │ likedSongs          │ likesStore                   │ TrackCard, TrackRow     │
 * │ recentlyPlayed      │ historyStore                 │ Home recommendations    │
 * │ preferences         │ preferenceStore              │ Settings, AudioEngine   │
 * │ toasts              │ toastStore                   │ ToastContainer          │
 * │ usageStats          │ usageStore                   │ Recommendations only    │
 * │ streamUrl cache     │ StreamURLCache (cache table)  │ TrackResolver           │
 * └─────────────────────┴──────────────────────────────┴─────────────────────────┘
 *
 * Cross-Store Synchronization Rules:
 * 1. When a track is played → playerStore.currentTrack updates,
 *    historyStore.addTrack() fires, usageStore.recordPlay() fires
 * 2. When likedSongs changes → no other store needs to update directly
 *    (likes are consumed via useLikesStore selector)
 * 3. When queue changes → PreResolver subscribes to queueStore
 * 4. When recentlyPlayed changes → HomeCache invalidates (already in recommendationService)
 * 5. playerStore.volume is source of truth; AudioEngine.setVolume is a side effect
 */
