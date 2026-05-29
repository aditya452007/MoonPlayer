import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AppShell } from './components/layout/AppShell/AppShell';

// Placeholder Pages
import { Home } from './views/pages/Home';
import { Search } from './views/pages/Search';
import { Library } from './views/pages/Library';
import { Settings } from './views/pages/Settings';

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
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AnimatePresence>
  );
}

export function App() {
  const hydratePrefs = usePreferenceStore((state) => state.hydrate);
  const hydrateLibrary = useLibraryStore((state) => state.hydrate);

  useEffect(() => {
    // Hydrate local data on app mount
    hydratePrefs();
    hydrateLibrary();
  }, [hydratePrefs, hydrateLibrary]);

  return (
    <HashRouter>
      <AppShell>
        <AnimatedRoutes />
      </AppShell>
    </HashRouter>
  );
}
