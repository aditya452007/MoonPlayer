# MoonPlayer -- Glassmorphism & UI Design Rules

> Status: RESTORED FROM MEMORY
> Date: 2026-05-28

## Aesthetic Principles

- **Moon Theme**: Dark UI (`--bg-void: #0B0D10`), silver-white text (`#D4E0ED`), and celestial accents (`#6BA3D6`). No light mode allowed.
- **Glassmorphism Constraints**: Glassmorphism (`backdrop-filter: blur(12px)`) is computationally expensive and MUST be used selectively.

## Glass Surface Matrix

| Component | Style | Rationale |
|:---|:---|:---|
| **Fullscreen Player** | Full Glass | Allows dynamic blurred album art backgrounds to bleed through. |
| **Mini-player / Playbar** | Subtle Glass | Floats above content. |
| **Sidebar (Desktop)** | Glass | Gives depth over the app background. |
| **In-app Toasts/Modals** | Glass | Z-axis elevation. |
| **Track List Items** | Solid Panel | Too many rows of glass destroys performance. Use solid dark background with hover glows. |
| **Search Results** | Solid Panel | High element count, requires solid background. |
| **Settings / Library Cards** | Solid Panel | Standard cards (`var(--bg-surface)`). |

## Shadows and Glows

Instead of solid borders, focus states and active elements use a subtle `box-shadow` called the "Moonlight Glow" (`var(--shadow-glow)`). Neon glows (e.g. bright cyan/magenta) are strictly forbidden.
