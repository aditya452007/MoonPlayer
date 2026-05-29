# MoonPlayer -- Rate Limiting & Resilience

> Status: RESTORED FROM MEMORY
> Date: 2026-05-28

## Token Bucket Algorithm

The JioSaavn CDN requires strict client-side rate limiting to prevent IP bans or 429 Too Many Requests errors.

**Configuration:**
- **Bucket Capacity**: 20 tokens (burst allowance for dashboard parallel loading).
- **Refill Rate**: 2 tokens per second (1 token per 500ms).
- **Queue Limit**: Maximum of 10 requests can be queued waiting for a token.

**Implementation Details:**
- Every API call via `MusicService` must first `await rateLimiter.acquire()`.
- If the queue exceeds 10, the limiter immediately throws a `RateLimitExceededError` rather than hanging the UI indefinitely.

## UI Feedback (Shimmer)

- **No Blocking Modals**: When the rate limiter is throttling (queue > 0), the UI MUST NOT show a blocking alert or full-screen spinner.
- **Search Bar Shimmer**: Instead, the search input field or affected component displays a subtle CSS `shimmer` animation (`background-position` shift) to indicate to the user that the system is busy but functioning.

## Error Recovery (403 Forbidden)

- Stream URLs expire quickly on the JioSaavn CDN.
- If the `AudioEngine` encounters an HTTP 403 mid-playback, it catches the error, calls `MusicService.getTrackDetails()` to get a fresh URL, sets the new URL to the audio `src`, advances the `currentTime` to the last known position, and resumes playback seamlessly.
- Maximum of 3 retries before aborting to the next track.
