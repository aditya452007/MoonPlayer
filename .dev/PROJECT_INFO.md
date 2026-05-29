# MoonPlayer -- Project Info

> **Project Name**: MoonPlayer
> **Type**: Premium Music Streaming Application
> **API**: JioSaavn (via saavn.dev public API)
> **Owner**: Private project

---

## What Is MoonPlayer?

MoonPlayer is a premium music streaming application with a moon/space aesthetic theme. It streams music from the JioSaavn catalog via a public API, providing a beautiful, feature-rich listening experience with:

- Celestial dark UI with moonlight design language
- Interactive VibeTune audio visualizer (5 types)
- Companion pet character (astronaut/space animal)
- Smart recommendation engine (hybrid API + local logic)
- Full queue management with auto-queue
- Synchronized lyrics
- Cross-platform: Web (PWA) + Android (APK via CapacitorJS)

---

## Technology Stack

| Layer | Technology | Version |
|:---|:---|:---|
| Build Tool | Vite | Latest |
| UI Library | React | 18+ |
| State Management | Zustand | Latest |
| Routing | React Router v6 | HashRouter |
| Local Database | Dexie.js (IndexedDB) | Latest |
| CSS Architecture | Vanilla CSS + Custom Properties | N/A |
| Icons | Phosphor Icons (Light) | Latest |
| Typography | Space Grotesk + Inter | Google Fonts |
| Page Transitions | Framer Motion | Latest |
| Visualizer Engine | GSAP + Web Audio API | Latest |
| Pet Runtime | Rive (rive-react) | Latest |
| Android Wrapper | CapacitorJS | Latest |
| Testing | Vitest + Testing Library + Playwright | Latest |

---

## Design Philosophy

**"The moon floating in a dark universe."**

- Near-black backgrounds with the faintest cool blue-grey undertone
- Moonlight silver-white for text and illumination
- Calm, restrained, celestial aesthetic
- No neon colors, no purple/indigo gradients
- Glassmorphism only where there's visual content to blur
- Subtle moonlight glow effects on interactive elements
- Premium feel -- every detail intentional

---

## API Source

- **Provider**: JioSaavn (Indian music streaming platform)
- **API Wrapper**: `saavn.dev` (public, unofficial)
- **Base URL**: `https://saavn.sumit.co/docs` (or self-hosted)
- **Auth**: None required (public API)
- **Rate Limiting**: Token Bucket (20 burst, 2/sec refill) -- client-side
- **No SLA**: Third-party API, may change or go down

---

## Platform Targets

| Platform | Min Version | Distribution |
|:---|:---|:---|
| Chrome (Web) | 90+ | Vercel/Firebase hosting |
| Firefox (Web) | 90+ | Same host |
| Safari (Web) | 14+ | Same host |
| Android (APK) | 10 (API 29)+ | GitHub Releases |
| iOS | Not supported | N/A |
