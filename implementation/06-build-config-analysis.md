# MoonPlayer Build Configuration & Project Analysis

> **Audit Date**: 2026-05-30
> **Scope**: Build config, ESLint, tests, dependencies, PWA, security, performance, mobile, environment

---

## 1. Build Configuration Issues

### 1.1 VitePWA missing Workbox caching strategy
- **Category**: Build Configuration / PWA
- **File**: `vite.config.js`
- **Line**: 14-32
- **Severity**: **high**
- **Issue**: `VitePWA` plugin is configured with only `registerType: 'autoUpdate'`, `includeAssets`, and `manifest`. No `workbox` configuration block is provided. This means the generated service worker will use Workbox's defaults (precache only, no runtime caching). Audio streams, API responses, and static assets fetched at runtime will not be cached for offline use.
- **Suggestion**: Add a `workbox` configuration with runtime caching strategies:
  ```js
  workbox: {
    globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
    runtimeCaching: [
      { urlPattern: /^https:\/\/saavn\.dev\/api\//, handler: 'NetworkFirst', options: { cacheName: 'api-cache' } },
      { urlPattern: /^https:\/\/.*\.(mp3|m4a|aac)/, handler: 'CacheFirst', options: { cacheName: 'audio-cache' } },
      { urlPattern: /^https:\/\/lrclib\.net\/api\//, handler: 'NetworkFirst', options: { cacheName: 'lyrics-cache' } },
    ]
  }
  ```

### 1.2 PWA manifest lacks PNG icons
- **Category**: Build Configuration / PWA
- **File**: `vite.config.js`
- **Line**: 24-30
- **Severity**: **high**
- **Issue**: The PWA manifest declares only an SVG icon: `favicon.svg` with sizes `192x192 512x512`. SVG icons are not universally supported for PWA installation across all platforms (e.g., Chrome on Android requires PNG icons of specific sizes). This can prevent the "Add to Home Screen" prompt from appearing on some devices.
- **Suggestion**: Add PNG icons of standard sizes (48x48, 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512) to `public/` and reference them in the manifest array. Include `purpose: 'any maskable'` for better adaptive icon support.

### 1.3 No `build.target` specified
- **Category**: Build Configuration
- **File**: `vite.config.js`
- **Line**: 43
- **Severity**: **low**
- **Issue**: The `build` block does not specify a `target`. Vite defaults to `'modules'` which targets browsers supporting ES modules. This is fine for modern browsers, but if Android WebView targets are needed (Capacitor), a more explicit target like `es2021` may improve compatibility and transpilation.
- **Suggestion**: Add `target: 'es2021'` or `['es2021', 'chrome89', 'safari15']` for broader compatibility, especially for Capacitor Android WebView.

### 1.4 `build.sourcemap` not explicitly configured
- **Category**: Build Configuration
- **File**: `vite.config.js`
- **Line**: 43
- **Severity**: **low**
- **Issue**: Sourcemap generation is not explicitly set. Vite defaults to `false` in production, but without explicit configuration, a future version change could alter behavior. For production builds, explicit `sourcemap: false` (or `'hidden'` for debugging) is preferable.
- **Suggestion**: Add `sourcemap: false` in the `build` block for production builds.

### 1.5 Missing `chunkSizeWarningLimit`
- **Category**: Build Configuration / Performance
- **File**: `vite.config.js`
- **Line**: 43
- **Severity**: **medium**
- **Issue**: No `chunkSizeWarningLimit` is configured. The Vite default of 500 KB may be too low for an audio player app with libraries like framer-motion and howler. This can cause noisy build warnings.
- **Suggestion**: Add `chunkSizeWarningLimit: 1000` (1 MB) or tune based on actual bundle analysis.

### 1.6 Missing bundle analyzer integration
- **Category**: Build Configuration / Performance
- **File**: `vite.config.js`
- **Line**: 12-33
- **Severity**: **low**
- **Issue**: No bundle visualizer/analyzer plugin (e.g., `rollup-plugin-visualizer`) is configured. Without it, it's difficult to identify large dependencies, duplicate code, or optimization opportunities in the bundle.
- **Suggestion**: Add `vite-plugin-rollup-plugin-visualizer` as a dev dependency and conditionally enable it via an env flag or npm script.

### 1.7 `manualChunks` vendor condition is fragile
- **Category**: Build Configuration
- **File**: `vite.config.js`
- **Line**: 46-59
- **Severity**: **low**
- **Issue**: The `manualChunks` function uses `id.includes()` string matching which is fragile. For example, `id.includes('react')` could also match unrelated packages. Additionally, the `vendor` chunk name is generic — it only captures React, Zustand, and Dexie; Howler and framer-motion get separate chunks, but any other node_modules dependency falls into the generic `deps` chunk.
- **Suggestion**: Use more precise path matching or consider using `splitVendorChunkPlugin` from Vite. Alternatively, group by dependency type: `vendor` for UI framework, `utils` for smaller utility libs, etc.

---

## 2. ESLint Issues

### 2.1 Missing `react` plugin rules for JSX
- **Category**: ESLint
- **File**: `eslint.config.js`
- **Line**: 10-19
- **Severity**: **medium**
- **Issue**: The config extends `reactHooks.configs.flat.recommended` for hooks but does not include the core `eslint-plugin-react` or its recommended rules. Rules like `react/jsx-no-target-blank`, `react/no-unescaped-entities`, `react/no-unknown-property` are missing. React 19 does not require `react-in-jsx-scope`, but other valuable JSX rules are absent.
- **Suggestion**: Install `eslint-plugin-react` and add `react.configs.flat.recommended` to the extends array.

### 2.2 No `no-unused-vars` rule
- **Category**: ESLint
- **File**: `eslint.config.js`
- **Line**: 10-19
- **Severity**: **medium**
- **Issue**: No `no-unused-vars` or `@typescript-eslint/no-unused-vars` rule is configured. Unused imports and variables will not be flagged, leading to dead code accumulation.
- **Suggestion**: Add `'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]` or use the equivalent from `@stylistic/eslint-plugin`.

### 2.3 No `no-console` rule
- **Category**: ESLint
- **File**: `eslint.config.js`
- **Line**: 10-19
- **Severity**: **low**
- **Issue**: `console.warn`, `console.error`, and `console.log` are used extensively throughout the codebase (e.g., 16+ usages in audio/core modules). There is no `no-console` rule, even as a warning, to encourage a structured logging approach.
- **Suggestion**: Add `'no-console': ['warn', { allow: ['warn', 'error'] }]` or migrate to a structured logger.

### 2.4 Missing browser/node globals split
- **Category**: ESLint
- **File**: `eslint.config.js`
- **Line**: 17
- **Severity**: **medium**
- **Issue**: `languageOptions.globals` is set to `globals.browser` only. Config files like `vite.config.js` and `eslint.config.js` (which run in Node.js) will get false positives for Node globals (e.g., `process`, `__dirname`, `module`). The scope `['**/*.{js,jsx}']` catches everything including config files.
- **Suggestion**: Use separate config objects: one for `src/**/*.{js,jsx}` with `globals.browser`, and another for config files (root-level `*.js`) with `globals.node`.

### 2.5 No import ordering rules
- **Category**: ESLint
- **File**: `eslint.config.js`
- **Line**: 10-19
- **Severity**: **low**
- **Issue**: There are no rules enforcing import ordering (e.g., `import/order` from `eslint-plugin-import` or `simple-import-sort`). Imports across the codebase are inconsistently ordered.
- **Suggestion**: Add `eslint-plugin-simple-import-sort` or `eslint-plugin-import` with ordering rules.

### 2.6 `react-refresh` rule not configured for severity
- **Category**: ESLint
- **File**: `eslint.config.js`
- **Line**: 14
- **Severity**: **low**
- **Issue**: `reactRefresh.configs.vite` is extended but the rule severity is inherited from its defaults. The `react-refresh/only-export-components` rule may need explicit configuration to allow certain component patterns.
- **Suggestion**: Explicitly configure `react-refresh/only-export-components` with `allowConstantExport: true` if needed.

---

## 3. Test Coverage Issues

### 3.1 Critically low test coverage
- **Category**: Testing
- **File**: (project-wide)
- **Line**: N/A
- **Severity**: **high**
- **Issue**: Only 2 test files exist (`playerStore.test.js` and `AudioEngine.test.js`) for ~65 source files covering stores, audio engine, API services, utilities, and 40+ UI components. This represents <3% test coverage. Critical modules with zero tests:
  - `libraryStore.js`, `preferenceStore.js`, `toastStore.js`
  - `recommendationService.js`, `lyricsService.js`, `queueService.js`
  - `VisualizerEngine.js`, `UpdateService.js`, `MusicService.js`
  - `colorExtractor.js`, `debounce.js`, `formatTime.js`
  - `downloadService.js`, `shareService.js`
  - All 40+ UI components
- **Suggestion**: Implement a systematic test plan prioritizing core business logic (stores, audio engine, API services) before UI components. Aim for >60% coverage on core modules.

### 3.2 AudioEngine tests are fundamentally broken
- **Category**: Testing
- **File**: `src/core/audio/__tests__/AudioEngine.test.js`
- **Line**: 1-45
- **Severity**: **critical**
- **Issue**: The test file does not mock the `howler` module. The `setupTests.js` file sets `global.Howl` and `global.Howler` as mock classes, but `AudioEngine.js` imports `{ Howl, Howler }` from the `'howler'` package via ES module import. The global mock is completely bypassed by the ES import. The `vi.spyOn(global.Howl.prototype, 'play')` spies on the mock class, but `AudioEngine.playTrack()` calls the real Howler's Howl constructor and `play()` method. All test assertions that check spy calls or mock behavior are testing the wrong object — they will give false positives or false negatives.
- **Suggestion**: Replace global mocks with proper `vi.mock('howler', () => ({ Howl: mockHowl, Howler: mockHowler }))` at the top of each test file, or use a shared Vitest setup to hoist the module mock before all imports.

### 3.3 playerStore tests are incomplete
- **Category**: Testing
- **File**: `src/store/__tests__/playerStore.test.js`
- **Line**: 1-54
- **Severity**: **high**
- **Issue**: Only 2 tests exist covering `play`/`playNext` and `setSleepTimer`. The following actions have zero test coverage:
  - `pause()`, `resume()`, `next()`, `prev()` (including loop mode edge cases)
  - `toggleMute()`, `setVolume()`, `seek()`
  - `toggleLoop()` (all transitions: none→all→one→none)
  - `addToQueue()` (single track, array of tracks, duplicates)
  - `removeFromQueue()`, `clearQueue()`, `reorderQueue()`, `shuffleQueue()`
  - `toggleQueueVisibility()`, `toggleFullscreen()`, `toggleLyrics()`
- **Suggestion**: Add comprehensive tests for each action, including edge cases (empty queue, single item, last item with different loop modes).

### 3.4 No error/edge case testing
- **Category**: Testing
- **File**: (all test files)
- **Line**: N/A
- **Severity**: **high**
- **Issue**: Neither test file covers error paths or edge cases:
  - What happens when `AudioEngine.playTrack` is called with an invalid/null URL?
  - What happens when the queue is empty and `next()` or `prev()` is called?
  - What happens when IndexedDB (Dexie) fails during hydration?
  - What happens when the network is offline and API calls fail?
  - Sleep timer edge cases: negative values, extremely large values, timer firing mid-song
- **Suggestion**: Add `describe('error handling')` and `describe('edge cases')` blocks to all test suites.

### 3.5 No UI component tests
- **Category**: Testing
- **File**: (all `src/components/**/*.jsx`)
- **Line**: N/A
- **Severity**: **high**
- **Issue**: None of the 40+ UI components have tests. Critical interactive components like `BottomPlaybar`, `FullscreenPlayer`, `VolumeControl`, `ProgressBar`, `Controls`, `TrackContextMenu`, and the `App` shell have no rendering, interaction, or accessibility tests.
- **Suggestion**: Start with smoke tests for each component (renders without crashing), then add interaction tests for the most critical user-facing components using `@testing-library/react`.

### 3.6 No integration tests
- **Category**: Testing
- **File**: (project-wide)
- **Line**: N/A
- **Severity**: **medium**
- **Issue**: There are no integration tests that verify the interaction between stores, AudioEngine, and the UI. For example: does clicking "play" in a TrackRow component correctly update the player store, start audio playback, and update the UI? The `queueService` (which auto-queues tracks by subscribing to store changes) has zero coverage.
- **Suggestion**: Write integration tests for critical user flows: play a track → progress updates → skip to next → toggle loop → pause.

### 3.7 `setupTests.js` uses anti-pattern global mocks
- **Category**: Testing
- **File**: `src/setupTests.js`
- **Line**: 3-29
- **Severity**: **medium**
- **Issue**: Global mocks are set on `global.Howler` and `global.Howl` for Howler.js. However:
  1. These globals are ineffective because `AudioEngine.js` uses ES imports (`import { Howl } from 'howler'`), not the global scope.
  2. The mock `Howl` class does not implement all methods used by `AudioEngine` (e.g., `_sounds`, `_node`, `rate()` is stub but `_setupEqualizer` accesses `_sounds[0]._node`).
  3. `fake-indexeddb/auto` is imported but the test for `playerStore` doesn't test any Dexie operations (playerStore uses localStorage via zustand persist).
- **Suggestion**: Remove global mocks, use `vi.mock('howler')` in test files, and move `fake-indexeddb` setup to only the tests that need it (libraryStore, preferenceStore).

### 3.8 `playerStore.test.js` accesses `window._sleepTimerInterval`
- **Category**: Testing / Code Quality
- **File**: `src/store/__tests__/playerStore.test.js`
- **Line**: 10-14, 45, 49-50
- **Severity**: **medium**
- **Issue**: The test directly accesses `window._sleepTimerInterval`, which is a private implementation detail (not a state property). This couples the test to an internal variable convention rather than testing through the public API. If the internal implementation changes (e.g., using a ref or a different ID variable), the test breaks.
- **Suggestion**: Instead of checking `window._sleepTimerInterval`, test the observable behavior: after setting a sleep timer and advancing time past the end, verify that `isPlaying` is `false` and `sleepTimerEnd` is `null`.

---

## 4. Dependency Issues

### 4.1 Unused dependencies (`@types/react`, `@types/react-dom`)
- **Category**: Dependencies
- **File**: `package.json`
- **Line**: 33-34
- **Severity**: **medium**
- **Issue**: `@types/react` (^19.2.14) and `@types/react-dom` (^19.2.3) are listed as devDependencies, but the entire project uses `.jsx` (not `.tsx` / TypeScript). These type packages are never referenced by any file and add unnecessary install time and disk space.
- **Suggestion**: Remove both packages unless migrating to TypeScript.

### 4.2 `MusicService.js` ignores `VITE_API_BASE_URL`
- **Category**: Dependencies / Config
- **File**: `src/core/api/MusicService.js` (line 93)
- **Severity**: **high**
- **Issue**: `MusicService.js` hardcodes `this.baseUrl = 'https://saavn.dev'` instead of reading from `import.meta.env.VITE_API_BASE_URL`. The `.env` file defines `VITE_API_BASE_URL=https://saavn.dev/api`, but this is never consumed. This means:
  1. The base URL cannot be changed per environment without editing source code.
  2. The `.env` value `https://saavn.dev/api` has a trailing `/api` while the code appends `/api/...`, which may cause double `/api/api/...` paths if someone fixes the code to use the env var naively.
- **Suggestion**: Use `import.meta.env.VITE_API_BASE_URL || 'https://saavn.dev'` and adjust the `.env` URL to not include the `/api` path segment if the code appends it.

### 4.3 `lyricsService.js` hardcodes LRCLIB URL
- **Category**: Dependencies / Config
- **File**: `src/core/audio/lyricsService.js` (line 40)
- **Severity**: **medium**
- **Issue**: `lyricsService.js` hardcodes `https://lrclib.net/api/get` instead of using `import.meta.env.VITE_LRCLIB_BASE_URL` (defined as `https://lrclib.net/api` in `.env`).
- **Suggestion**: Use `import.meta.env.VITE_LRCLIB_BASE_URL` with a fallback: `const baseUrl = import.meta.env.VITE_LRCLIB_BASE_URL || 'https://lrclib.net/api'`.

### 4.4 `UpdateService.js` hardcodes version
- **Category**: Dependencies / Config
- **File**: `src/core/updater/UpdateService.js` (line 4)
- **Severity**: **medium**
- **Issue**: `CURRENT_VERSION` is hardcoded as `'v1.0.0'` and `GITHUB_REPO` as `'intellicia-public/moonplayer'`. The `.env` file defines `VITE_APP_VERSION=1.0.0` which is unused. This creates a maintenance burden where the version must be updated in two places (package.json and UpdateService.js).
- **Suggestion**: Use `import.meta.env.VITE_APP_VERSION || 'v1.0.0'` and read the GitHub repo from an env var for flexibility.

### 4.5 `@capacitor/android` listed as runtime dependency
- **Category**: Dependencies
- **File**: `package.json`
- **Line**: 16
- **Severity**: **low**
- **Issue**: `@capacitor/android` (^8.3.4) is in `dependencies` but is a platform-specific native library that is only used during native builds, not at runtime in the web layer. It should typically be a `devDependency`. The same applies to `@capacitor/core` which IS a runtime dependency (used via `window.Capacitor` checks).
- **Suggestion**: Move `@capacitor/android` to `devDependencies` (it is only referenced by the Android project, not imported in JS).

---

## 5. PWA / Service Worker Issues

### 5.1 No runtime caching strategy
- **Category**: PWA / SW
- **File**: `vite.config.js`
- **Line**: 14-32
- **Severity**: **high**
- **Issue**: (Duplicate of 1.1 — listed here for category grouping) The generated service worker only precaches static assets. API responses, audio streams, and lyrics fetched at runtime are not cached. If the user goes offline, the app shell may load but no content will be available.
- **Suggestion**: See 1.1 for detailed recommendation.

### 5.2 `registerSW({ immediate: true })` may skip update flow
- **Category**: PWA / SW
- **File**: `src/main.jsx`
- **Line**: 9
- **Severity**: **low**
- **Issue**: `registerSW({ immediate: true })` activates the service worker immediately without giving the user a chance to see "update available" notifications. For a music player, background updates could interrupt playback if not handled carefully.
- **Suggestion**: Consider removing `immediate: true` and implementing a custom update notification (e.g., a "New version available — reload?" toast) using the `onNeedRefresh` callback from vite-plugin-pwa.

### 5.3 No splash screen or offline fallback page
- **Category**: PWA / SW
- **File**: `vite.config.js`
- **Line**: 14-32
- **Severity**: **medium**
- **Issue**: The PWA config does not define an offline fallback page or splash screen. While the app shell may be cached, there is no custom offline experience.
- **Suggestion**: Add `workbox.navigateFallback: '/offline.html'` and create an offline fallback page, or ensure the SPA handles offline state gracefully.

### 5.4 SVG-only icons for PWA
- **Category**: PWA / SW
- **File**: `vite.config.js` (line 24-30) and `public/icons.svg`
- **Severity**: **high**
- **Issue**: (Duplicate of 1.2 — listed here for category grouping) SVG icons are used exclusively. PNG icons are required for full cross-platform PWA support.
- **Suggestion**: See 1.2 for detailed recommendation.

---

## 6. Security Issues

### 6.1 Missing Content-Security-Policy
- **Category**: Security
- **File**: `index.html`
- **Line**: 4-8
- **Severity**: **high**
- **Issue**: No `<meta http-equiv="Content-Security-Policy">` tag is present. The app fetches from multiple external origins (`https://saavn.dev`, `https://lrclib.net`, `https://api.github.com`) and loads external images. Without a CSP, the app is vulnerable to XSS attacks if any user-controlled data is rendered unsafely.
- **Suggestion**: Add a strict CSP meta tag:
  ```html
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self' https://saavn.dev https://lrclib.net https://api.github.com; media-src 'self' https:; font-src 'self';">
  ```

### 6.2 No `referrerpolicy` or `crossorigin` on external fetches
- **Category**: Security
- **File**: `src/core/api/MusicService.js` (line 101), `src/core/audio/lyricsService.js` (line 40), `src/core/updater/UpdateService.js` (line 9)
- **Severity**: **medium**
- **Issue**: Multiple modules fetch from external APIs without specifying `referrerPolicy` or `credentials` options. API requests may leak the page URL via the Referer header. For the UpdateService, fetching from GitHub's unauthenticated API is rate-limited to 60 requests/hour per IP.
- **Suggestion**: Add `referrerPolicy: 'no-referrer-when-downgrade'` to fetch calls, and consider using a GitHub token (via env var) for the UpdateService to increase rate limits.

### 6.3 No Permissions-Policy or X-Content-Type-Options
- **Category**: Security
- **File**: `index.html`
- **Line**: 4-8
- **Severity**: **medium**
- **Issue**: No Permissions-Policy, X-Content-Type-Options, or X-Frame-Options meta tags are set. While these are typically set via HTTP headers, the SPA should at minimum include a `<meta http-equiv>` tag for policies that can be expressed inline.
- **Suggestion**: Add at minimum:
  ```html
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <meta http-equiv="X-Frame-Options" content="DENY">
  ```

### 6.4 `.env` file checked into git (via `.env.example`)
- **Category**: Security
- **File**: `.env`, `.env.example`
- **Line**: 1-4 (both files)
- **Severity**: **low**
- **Issue**: `.env` and `.env.example` contain the same content with actual API URLs. While no secrets (API keys, tokens) are present, `.env.example` exposing the exact production endpoints is a minor information disclosure. The `.env` file itself is correctly gitignored.
- **Suggestion**: In `.env.example`, replace URLs with placeholder values (e.g., `https://your-api.example.com`) and keep actual URLs only in `.env`.

### 6.5 Hardcoded `crossOrigin = 'anonymous'` after audio load
- **Category**: Security
- **File**: `src/core/audio/AudioEngine.js`
- **Line**: 108-110
- **Severity**: **low**
- **Issue**: `AudioEngine._setupEqualizer()` sets `audioNode.crossOrigin = 'anonymous'` on the HTML5 Audio element after it has already started loading. The CORS attribute must be set before the resource is requested for it to take effect. Setting it after `play()` was called has no effect.
- **Suggestion**: Set `crossOrigin: 'anonymous'` in the `new Howl()` options or on the audio element before calling `play()`.

---

## 7. Performance / Build Issues

### 7.1 Release build has minification disabled for Android
- **Category**: Performance / Mobile
- **File**: `android/app/build.gradle`
- **Line**: 21
- **Severity**: **critical**
- **Issue**: `minifyEnabled false` in the release build type means the Android APK is not minified, obfuscated, or optimized. This results in a significantly larger APK and slower runtime performance. The WebView bundle is minified by Vite, but the native Java/Kotlin layer and resources are not.
- **Suggestion**: Set `minifyEnabled true` and ensure ProGuard rules (`proguard-rules.pro`) are properly configured to avoid stripping necessary classes.

### 7.2 No code splitting at the route level for Settings/Search
- **Category**: Performance
- **File**: `src/App.jsx`
- **Line**: 10-15
- **Severity**: **low**
- **Issue**: Lazy loading is correctly implemented for all page components (Home, Search, Library, Settings, etc.). However, Search and Settings import large sub-dependencies (MusicService, AudioEngine, etc.) which are loaded on first interaction. This is acceptable but could be further optimized by code-splitting services separately.
- **Suggestion**: This is already well-implemented; continue to monitor lazy-loaded chunk sizes via a bundle analyzer.

### 7.3 framer-motion `LazyMotion` with `domAnimation` is correct
- **Category**: Performance
- **File**: `src/App.jsx`
- **Line**: 69
- **Severity**: **info** (positive)
- **Note**: Good practice — `LazyMotion` with `domAnimation` (instead of `domMax`) reduces framer-motion's bundle size by only including animation features, not drag/gesture/layout features. This should be highlighted as a positive pattern.

### 7.4 `manualChunks` splits are reasonable but could be improved
- **Category**: Performance
- **File**: `vite.config.js`
- **Line**: 46-59
- **Severity**: **low**
- **Issue**: The chunk splitting strategy creates `vendor`, `framer`, `howler`, and `deps` chunks. However, `deps` catches all remaining node_modules in one large chunk. For a music app with many dependencies, this could be a single large file (~200-400 KB).
- **Suggestion**: Consider further splitting the `deps` chunk by category (e.g., `ui-utils` for `@phosphor-icons/react`, `db` for `dexie`). Monitor actual chunk sizes with a visualizer.

### 7.5 `vite-plugin-pwa` adds overhead to initial build
- **Category**: Performance
- **File**: `vite.config.js`
- **Line**: 14
- **Severity**: **low**
- **Issue**: The PWA plugin generates a service worker during build, which adds build time. This is expected and acceptable, but the `injectManifest` mode (custom SW) would allow finer control over precaching versus the generated SW approach.
- **Suggestion**: Monitor build times. If they become an issue, consider switching to `injectManifest` mode for more control.

---

## 8. Index.html Issues

### 8.1 Missing essential meta tags
- **Category**: HTML / SEO
- **File**: `index.html`
- **Line**: 4-8
- **Severity**: **high**
- **Issue**: The `<head>` section is extremely minimal. Missing tags:
  - `<meta name="description">` — critical for SEO and social sharing
  - `<meta name="theme-color">` — controls browser UI color on mobile
  - `<meta name="apple-mobile-web-app-capable" content="yes">` — iOS fullscreen
  - `<meta name="apple-mobile-web-app-status-bar-style">` — iOS status bar
  - `<meta property="og:title">`, `<meta property="og:description">`, `<meta property="og:image">` — social sharing previews
  - `<meta name="twitter:card">` — Twitter card format
- **Suggestion**: Add comprehensive meta tags for SEO, social sharing, and mobile web app capabilities.

### 8.2 Missing apple-touch-icon
- **Category**: HTML / Mobile
- **File**: `index.html`
- **Line**: 4-8
- **Severity**: **medium**
- **Issue**: No `<link rel="apple-touch-icon">` is defined. iOS will not show a custom icon when the user adds the app to the home screen.
- **Suggestion**: Add a PNG apple-touch-icon link (at least 180x180) to the `<head>`.

### 8.3 Missing preconnect hints for external origins
- **Category**: HTML / Performance
- **File**: `index.html`
- **Line**: 4-8
- **Severity**: **medium**
- **Issue**: The app fetches from `https://saavn.dev`, `https://lrclib.net`, and `https://api.github.com`, but no `<link rel="preconnect">` or `<link rel="dns-prefetch">` hints are provided. This delays connection establishment for these third-party origins.
- **Suggestion**: Add preconnect hints:
  ```html
  <link rel="preconnect" href="https://saavn.dev">
  <link rel="preconnect" href="https://lrclib.net">
  <link rel="dns-prefetch" href="https://api.github.com">
  ```

### 8.4 Missing script `defer` (non-issue with module scripts)
- **Category**: HTML
- **File**: `index.html`
- **Line**: 13
- **Severity**: **info**
- **Note**: `<script type="module">` is used, which defers execution by default. This is correct and no change is needed. This is a positive pattern.

### 8.5 No loading animation or splash screen
- **Category**: HTML / UX
- **File**: `index.html`
- **Line**: 11-13
- **Severity**: **low**
- **Issue**: The `<div id="root"></div>` is empty until React hydrates. There is no inline CSS or loading indicator, so users may see a blank white page for a moment on slow connections or devices.
- **Suggestion**: Add an inline `<style>` block with a simple CSS loader animation targeting `#root` before the script loads.

---

## 9. Capacitor / Mobile Issues

### 9.1 `minifyEnabled false` in release build
- **Category**: Capacitor / Mobile
- **File**: `android/app/build.gradle`
- **Line**: 21
- **Severity**: **critical**
- **Issue**: (Also listed as 7.1) The release APK is not minified/obfuscated. This is a serious issue for production distribution — it increases APK size, leaves Java/Kotlin code readable via decompilation, and omits dead code elimination.
- **Suggestion**: Set `minifyEnabled true` and configure `proguard-rules.pro` to preserve Capacitor and any Cordova plugin classes:
  ```
  -keep class com.getcapacitor.** { *; }
  -keep class com.moonplayer.app.** { *; }
  ```

### 9.2 App version hardcoded in build.gradle
- **Category**: Capacitor / Mobile
- **File**: `android/app/build.gradle`
- **Line**: 10-11
- **Severity**: **medium**
- **Issue**: `versionCode 1` and `versionName "1.0"` are hardcoded. They should be derived from `package.json` (`"version": "0.0.0"`) or passed via CI/CD. Every release requires manual editing.
- **Suggestion**: Use Capacitor's auto-versioning or read from `package.json`:
  ```gradle
  def versionFile = file('../../package.json')
  def packageJson = new groovy.json.JsonSlurper().parseText(versionFile.text)
  versionCode = packageJson.versionCode ?: 1
  versionName = packageJson.version
  ```

### 9.3 Missing `POST_NOTIFICATIONS` permission for Android 13+
- **Category**: Capacitor / Mobile
- **File**: `android/app/src/main/AndroidManifest.xml`
- **Line**: 38-44
- **Severity**: **high**
- **Issue**: Android 13 (API 33+) requires the `POST_NOTIFICATIONS` runtime permission to show notifications. The app uses background audio playback and likely wants to show a media notification, but this permission is not declared. Without it, `Android Auto` or media notifications will be blocked on Android 13+.
- **Suggestion**: Add `<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />` to the manifest and handle runtime permission request in the app.

### 9.4 No Capacitor plugins beyond core
- **Category**: Capacitor / Mobile
- **File**: `package.json`, `capacitor.config.json`
- **Line**: N/A
- **Severity**: **medium**
- **Issue**: Only `@capacitor/core`, `@capacitor/android`, and `@capacitor/cli` are installed. No additional Capacitor plugins are used. For a music player, the following would be expected:
  - `@capacitor/filesystem` — for saving downloaded tracks
  - `@capacitor/splash-screen` — for controlled splash screen
  - `@capacitor/status-bar` — for controlling status bar styling
  - `@capacitor/local-notifications` — for media playback notifications
- **Suggestion**: Evaluate and install relevant Capacitor plugins for production mobile deployment.

### 9.5 Capacitor config missing server configuration
- **Category**: Capacitor / Mobile
- **File**: `capacitor.config.json`
- **Line**: 1-6
- **Severity**: **low**
- **Issue**: No `server` configuration is present. For development with live reload, a `server.url` config would be needed. Without it, developers must manually configure the server URL each time.
- **Suggestion**: Add a development-specific `capacitor.config.json` override or use environment-based config:
  ```json
  "server": {
    "url": "http://192.168.1.x:5173",
    "cleartext": true
  }
  ```

### 9.6 No iOS platform configuration
- **Category**: Capacitor / Mobile
- **File**: (project-wide)
- **Line**: N/A
- **Severity**: **low**
- **Issue**: Only Android platform is configured. The project references `@capacitor/android` but has no `ios/` directory or iOS-specific configuration. The `musicplayer` app name implies eventual iOS support.
- **Suggestion**: Add iOS platform when ready via `npx cap add ios`.

---

## 10. Environment Configuration Issues

### 10.1 Environment variables defined but not consumed
- **Category**: Environment Config
- **File**: `.env`, `MusicService.js`, `lyricsService.js`, `UpdateService.js`
- **Line**: N/A
- **Severity**: **high**
- **Issue**: Three Vite environment variables are defined in `.env` but never read by the code:
  - `VITE_API_BASE_URL` → MusicService.js hardcodes `this.baseUrl = 'https://saavn.dev'`
  - `VITE_LRCLIB_BASE_URL` → lyricsService.js hardcodes `https://lrclib.net/api`
  - `VITE_APP_VERSION` → UpdateService.js hardcodes `CURRENT_VERSION = 'v1.0.0'`
- **Suggestion**: Globally replace hardcoded URLs/versions with `import.meta.env.VITE_*` calls with fallbacks.

### 10.2 No `.env.development` / `.env.production` split
- **Category**: Environment Config
- **File**: (project root)
- **Line**: N/A
- **Severity**: **low**
- **Issue**: Only a single `.env` file exists. For a production app with different API endpoints for development/staging/production, separate `.env.development` and `.env.production` files should be used.
- **Suggestion**: Create `.env.development` with local/staging endpoints and `.env.production` with production endpoints. Keep `.env` as the fallback with safe defaults.

### 10.3 `.gitignore` missing common environment patterns
- **Category**: Environment Config
- **File**: `.gitignore`
- **Line**: 27-30
- **Severity**: **low**
- **Issue**: The `.gitignore` has `.env` and `.env.*` entries but lacks explicit entries for:
  - `.env.local`, `.env.development.local`, `.env.production.local`
  - `*.tsbuildinfo` (if migrating to TypeScript)
  - `.vite/` (Vite cache directory)
- **Suggestion**: Add the missing patterns:
  ```
  .env.local
  .env.*.local
  *.tsbuildinfo
  .vite/
  ```

---

## Summary of Issues by Severity

| Severity | Count | Key Findings |
|----------|-------|-------------|
| Critical | 2 | AudioEngine tests broken (mock bypass); Release APK minification disabled |
| High | 12 | Low test coverage, missing CSP, PWA icons, env vars unused, Capacitor permissions, SW caching, `minifyEnabled` |
| Medium | 14 | ESLint rules missing, import ordering, hardcoded URLs, missing meta tags, preconnect hints, test gaps, Android permissions |
| Low | 10 | Bundle analyzer, sourcemap config, chunk splitting, iOS missing, .env.example hygiene |
| Info | 1 | LazyMotion/domAnimation pattern is correct |

**Actionable Next Steps**:
1. Fix the AudioEngine test mock (critical) — use `vi.mock('howler')` instead of global mocks
2. Enable `minifyEnabled true` in Android release build (critical)
3. Add Workbox runtime caching config to VitePWA (high)
4. Add PNG icons for PWA manifest (high)
5. Add CSP and essential meta tags to `index.html` (high)
6. Consume environment variables from `.env` instead of hardcoding (high)
7. Add `POST_NOTIFICATIONS` permission for Android 13+ (high)
8. Expand test coverage for stores and core services (high)
