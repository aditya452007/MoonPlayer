import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AnimatePresence, LazyMotion, domMax } from 'framer-motion';
import { AppShell } from './components/layout/AppShell/AppShell';

import { lazy, Suspense } from 'react';
import { ErrorBoundary } from './components/common/ErrorBoundary/ErrorBoundary';

// Lazy loaded Pages
const Home = lazy(() => import('./views/pages/Home').then(m => ({ default: m.Home })));
const Search = lazy(() => import('./views/pages/Search').then(m => ({ default: m.Search })));
const Library = lazy(() => import('./views/pages/Library').then(m => ({ default: m.Library })));
const Settings = lazy(() => import('./views/pages/Settings').then(m => ({ default: m.Settings })));
const PlaylistView = lazy(() => import('./views/pages/PlaylistView').then(m => ({ default: m.PlaylistView })));
const SongRedirectView = lazy(() => import('./views/pages/SongRedirectView').then(m => ({ default: m.SongRedirectView })));
const AlbumView = lazy(() => import('./views/pages/AlbumView').then(m => ({ default: m.AlbumView })));
const ArtistView = lazy(() => import('./views/pages/ArtistView').then(m => ({ default: m.ArtistView })));

import { usePreferenceStore } from './store/preferenceStore';
import { useLibraryStore } from './store/libraryStore';

import { Skeleton } from './components/common/Skeleton/Skeleton';

const PageFallback = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-6)', height: '100%', boxSizing: 'border-box' }}>
    <Skeleton variant="text" width="40%" height="32px" style={{ marginBottom: 'var(--space-4)' }} />
    <Skeleton variant="rect" width="100%" height="160px" style={{ borderRadius: 'var(--radius-md)' }} />
    <Skeleton variant="text" width="80%" height="20px" />
    <Skeleton variant="text" width="60%" height="20px" />
  </div>
);

// Wrap routes with AnimatePresence to enable exit animations
function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Suspense fallback={<PageFallback />}><Home /></Suspense>} />
        <Route path="/search" element={<Suspense fallback={<PageFallback />}><Search /></Suspense>} />
        <Route path="/library" element={<Suspense fallback={<PageFallback />}><Library /></Suspense>} />
        <Route path="/playlist/:id" element={<Suspense fallback={<PageFallback />}><PlaylistView /></Suspense>} />
        <Route path="/album/:id" element={<Suspense fallback={<PageFallback />}><AlbumView /></Suspense>} />
        <Route path="/artist/:id" element={<Suspense fallback={<PageFallback />}><ArtistView /></Suspense>} />
        <Route path="/song/:id" element={<Suspense fallback={<PageFallback />}><SongRedirectView /></Suspense>} />
        <Route path="/settings" element={<Suspense fallback={<PageFallback />}><Settings /></Suspense>} />
      </Routes>
    </AnimatePresence>
  );
}

import { initQueueService } from './core/audio/queueService';

import { PetContainer } from './components/pet/PetContainer/PetContainer';
import { ToastContainer } from './components/common/GlassToast/ToastContainer';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { ShortcutOverlay } from './components/common/ShortcutOverlay/ShortcutOverlay';
import { GestureGuideOverlay } from './components/common/GestureGuideOverlay/GestureGuideOverlay';
import { InstallPrompt } from './components/common/InstallPrompt/InstallPrompt';
import { updateService } from './core/updater/UpdateService';

// AppInner must live inside <HashRouter> so useNavigate (via useKeyboardShortcuts) works.
function AppInner() {
  const { showShortcutOverlay, setShowShortcutOverlay } = useKeyboardShortcuts();

  return (
    <AppShell>
      <AnimatedRoutes />
      <PetContainer />
      <ToastContainer />
      <GestureGuideOverlay />
      <ShortcutOverlay isOpen={showShortcutOverlay} onClose={() => setShowShortcutOverlay(false)} />
      <InstallPrompt />
    </AppShell>
  );
}

export function App() {
  const hydratePrefs = usePreferenceStore((state) => state.hydrate);
  const hydrateLibrary = useLibraryStore((state) => state.hydrate);

  useEffect(() => {
    // Hydrate local data on app mount
    hydratePrefs();
    hydrateLibrary();
    // Run queue service on mount (App side-effect optimization)
    initQueueService();
    // Check for APK updates (silent fail if none)
    updateService.checkForUpdates().catch((err) => {
      console.warn('Silent update check failure:', err);
    });
  }, [hydratePrefs, hydrateLibrary]);

  return (
    <ErrorBoundary>
      <LazyMotion features={domMax}>
        <HashRouter>
          <AppInner />
        </HashRouter>
      </LazyMotion>
    </ErrorBoundary>
  );
}
