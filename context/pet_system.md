# MoonPlayer -- Pet System Specification

> Status: RESTORED FROM MEMORY
> Date: 2026-05-28

## Architecture

The Pet System is an interactive, floating character overlay that responds to music playback and user interactions.
- **Engine**: Rive (`@rive-app/react-canvas`) or a robust custom CSS Sprite sheet implementation.
- **Characters**: 
  1. Astronaut (Humanoid)
  2. Space Animal (Cat/Dog/Rabbit in space suit)
- **Positioning**: Fixed overlay, draggable by the user, coordinates saved to `preferenceStore` (Dexie.js).

## State Machine (Behaviors)

The Pet subscribes to `playerStore` and reacts accordingly:
1. **Idle**: Blinking, subtle breathing. (When app is active but music is paused).
2. **Sleeping**: Zzz animation. (Triggered after 5+ minutes of inactivity/pause).
3. **Dancing**: Bobbing to the beat. (Triggered when music is playing).
4. **Tempo-Reactive**: Animation speed scales with the audio BPM (or a generic fast/slow heuristic based on the song genre).
5. **Greeting**: Waving animation + in-app toast saying "Hi [username]!" upon app launch.
6. **Action-Reactive**: Thumbs up or celebration animation when the user "Likes" a track or creates a playlist.

## Toasts & Interaction

- The Pet can display small text bubbles (toasts) next to its position.
- Clicking the Pet directly will trigger a random fun toast ("Great taste!", "Let's vibe!") or suggest a random song from the recommendation pool.
- Users can disable the Pet entirely in the Settings page (which fully unmounts the component to save CPU).
