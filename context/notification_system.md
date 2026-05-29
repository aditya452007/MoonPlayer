# MoonPlayer -- Notification System

> Status: RESTORED FROM MEMORY
> Date: 2026-05-28

## Dual Architecture

MoonPlayer employs two separate layers for notifications, depending on the platform and app state.

### 1. In-App Toasts (Foreground)
- **Technology**: Custom React component using `framer-motion` for slide-in animations.
- **Styling**: Uses the Glassmorphism matrix (`backdrop-filter`, subtle moonlight border).
- **Triggers**: Song changes, playlist additions ("Added to Liked Songs"), download progress, error states, and Pet text bubbles.
- **Behavior**: Auto-dismisses after 3 seconds. Queue-managed by `toastStore` to prevent overlapping.

### 2. System Notifications (Background / OS)
- **Technology (Web)**: standard HTML5 `Media Session API` (shows up in browser controls and OS lockscreen on desktop).
- **Technology (Android)**: Capacitor `Local Notifications` plugin combined with a foreground service to maintain audio focus and display rich media controls.
- **Features**: Includes Play/Pause, Skip, Previous buttons. Shows the current album art (animated if supported by the OS).
- **Triggers**: Active playback in the background, download completion, and "Rate Limit Reached" warnings if severely throttled while backgrounded.
