import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AnimatePresence, LazyMotion, domAnimation } from 'framer-motion';
import { AppShell } from './components/layout/AppShell/AppShell';

// Placeholder Pages
import { Home } from './views/pages/Home';
import { Search } from './views/pages/Search';
import { Library } from './views/pages/Library';
import { Settings } from './views/pages/Settings';
import { PlaylistView } from './views/pages/PlaylistView';
import { SongRedirectView } from './views/pages/SongRedirectView';

import { usePreferenceStore } from './store/preferenceStore';
import { useLibraryStore } from './store/libraryStore';

// Wrap routes with AnimatePresence to enable exit animations
function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/library" element={<Library />} />
        <Route path="/playlist/:id" element={<PlaylistView />} />
        <Route path="/song/:id" element={<SongRedirectView />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AnimatePresence>
  );
}

import { initQueueService } from './core/audio/queueService';

// Run it once on module load or inside App mount. Actually, doing it globally is fine.
initQueueService();

import { PetContainer } from './components/pet/PetContainer/PetContainer';
import { ToastContainer } from './components/common/GlassToast/ToastContainer';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { ShortcutOverlay } from './components/common/ShortcutOverlay/ShortcutOverlay';
import { GestureGuideOverlay } from './components/common/GestureGuideOverlay/GestureGuideOverlay';
import { InstallPrompt } from './components/common/InstallPrompt/InstallPrompt';
import { UpdateService } from './core/updater/UpdateService';

export function App() {
  const hydratePrefs = usePreferenceStore((state) => state.hydrate);
  const hydrateLibrary = useLibraryStore((state) => state.hydrate);

  useEffect(() => {
    // Hydrate local data on app mount
    hydratePrefs();
    hydrateLibrary();
    // Check for APK updates (silent fail if none)
    UpdateService.checkForUpdates();
  }, [hydratePrefs, hydrateLibrary]);

  const { showShortcutOverlay, setShowShortcutOverlay } = useKeyboardShortcuts();

  return (
    <LazyMotion features={domAnimation}>
      <HashRouter>
        <AppShell>
          <AnimatedRoutes />
          <PetContainer />
          <ToastContainer />
          <GestureGuideOverlay />
          <ShortcutOverlay isOpen={showShortcutOverlay} onClose={() => setShowShortcutOverlay(false)} />
          <InstallPrompt />
        </AppShell>
      </HashRouter>
    </LazyMotion>
  );
}
