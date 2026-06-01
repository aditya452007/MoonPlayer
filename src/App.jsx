import { HashRouter, Routes, Route, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { LazyMotion, domMax, domMin, useReducedMotion } from 'framer-motion';
import { ShellLayout } from './components/layout/ShellLayout/ShellLayout';
import { ThemeProvider } from './context/ThemeContext';
import { ResponsiveProvider } from './hooks/useResponsiveContext';

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
const ChartView = lazy(() => import('./views/pages/ChartView').then(m => ({ default: m.ChartView })));
const EqualizerView = lazy(() => import('./views/pages/EqualizerView').then(m => ({ default: m.EqualizerView })));
const ImportExportView = lazy(() => import('./views/pages/ImportExportView').then(m => ({ default: m.ImportExportView })));
const LocalMusic = lazy(() => import('./views/pages/LocalMusic').then(m => ({ default: m.LocalMusic })));
const Offline = lazy(() => import('./views/pages/Offline').then(m => ({ default: m.Offline })));
const LyricsView = lazy(() => import('./views/pages/LyricsView').then(m => ({ default: m.LyricsView })));

// Route constants
import {
  SEARCH,
  LIBRARY,
  LOCAL_MUSIC,
  OFFLINE,
  PLAYLIST_VIEW,
  ALBUM_VIEW,
  ARTIST_VIEW,
  CHART_VIEW,
  SONG_VIEW,
  SETTINGS,
  LYRICS_VIEW
} from './routes/routeConstants';

import { usePreferenceStore } from './store/preferenceStore';
import { useLibraryStore } from './store/libraryStore';
import { useDownloadStore } from './store/downloadStore';
import { usePlayerStore } from './store/playerStore';
import { discordService } from './core/api/discordService';
import { SmartReplaceDialog } from './components/common/SmartReplaceDialog/SmartReplaceDialog';

import { Skeleton } from './components/common/Skeleton/Skeleton';
import { ChangelogReader } from './components/common/ChangelogReader/ChangelogReader';
import { CHANGELOG, APP_VERSION } from './constants/changelog';

const PageFallback = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-6)', height: '100%', boxSizing: 'border-box' }}>
    <Skeleton variant="text" width="40%" height="32px" style={{ marginBottom: 'var(--space-4)' }} />
    <Skeleton variant="rect" width="100%" height="160px" style={{ borderRadius: 'var(--radius-md)' }} />
    <Skeleton variant="text" width="80%" height="20px" />
    <Skeleton variant="text" width="60%" height="20px" />
  </div>
);

import { initQueueService } from './core/audio/queueService';

import { PetContainer } from './components/pet/PetContainer/PetContainer';
import { ToastContainer } from './components/common/GlassToast/ToastContainer';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { ShortcutOverlay } from './components/common/ShortcutOverlay/ShortcutOverlay';
import { GestureGuideOverlay } from './components/common/GestureGuideOverlay/GestureGuideOverlay';
import { InstallPrompt } from './components/common/InstallPrompt/InstallPrompt';
import { updateService } from './core/updater/UpdateService';

import { useBackHandler } from './hooks/useBackHandler';

function AppInner() {
  const { showShortcutOverlay, setShowShortcutOverlay } = useKeyboardShortcuts();
  const failedTrack = usePlayerStore((state) => state.failedTrack);
  const navigate = useNavigate();
  const play = usePlayerStore((state) => state.play);
  const location = useLocation();

  // Call back button prioritized navigation hook
  useBackHandler();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get('shared_url');
    if (sharedUrl) {
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);

      import('./core/api/urlResolverService').then(async ({ urlResolverService }) => {
        const res = await urlResolverService.resolveUrl(sharedUrl);
        if (res.status === 'success') {
          if (res.type === 'song' && res.track) {
            play(res.track);
          } else if (res.type === 'song' && res.id) {
            navigate(`/song/${res.id}`);
          } else if (res.type === 'album') {
            navigate(`/album/${res.id}`);
          } else if (res.type === 'artist') {
            navigate(`/artist/${res.id}`);
          } else if (res.type === 'playlist') {
            navigate(`/playlist/${res.id}`);
          }
        }
      }).catch((err) => {
        console.error('Failed to resolve shared url:', err);
      });
    }
  }, [navigate, play, location]);

  return (
    <>
      <Routes>
        <Route element={<ShellLayout><Outlet /></ShellLayout>}>
          <Route index element={<Suspense fallback={<PageFallback />}><Home /></Suspense>} />
          <Route path={SEARCH} element={<Suspense fallback={<PageFallback />}><Search /></Suspense>} />
          <Route path={LIBRARY} element={<Suspense fallback={<PageFallback />}><Library /></Suspense>} />
          <Route path={PLAYLIST_VIEW} element={<Suspense fallback={<PageFallback />}><PlaylistView /></Suspense>} />
          <Route path={ALBUM_VIEW} element={<Suspense fallback={<PageFallback />}><AlbumView /></Suspense>} />
          <Route path={ARTIST_VIEW} element={<Suspense fallback={<PageFallback />}><ArtistView /></Suspense>} />
          <Route path={CHART_VIEW} element={<Suspense fallback={<PageFallback />}><ChartView /></Suspense>} />
          <Route path={SONG_VIEW} element={<Suspense fallback={<PageFallback />}><SongRedirectView /></Suspense>} />
          <Route path={SETTINGS} element={<Suspense fallback={<PageFallback />}><Settings /></Suspense>} />
          <Route path={LOCAL_MUSIC} element={<Suspense fallback={<PageFallback />}><LocalMusic /></Suspense>} />
          <Route path={OFFLINE} element={<Suspense fallback={<PageFallback />}><Offline /></Suspense>} />
          <Route path="equalizer" element={<Suspense fallback={<PageFallback />}><EqualizerView /></Suspense>} />
          <Route path="import-export" element={<Suspense fallback={<PageFallback />}><ImportExportView /></Suspense>} />
        </Route>
        <Route path={LYRICS_VIEW} element={<Suspense fallback={<PageFallback />}><LyricsView /></Suspense>} />
      </Routes>
      <PetContainer />
      <ToastContainer />
      <GestureGuideOverlay />
      <ShortcutOverlay isOpen={showShortcutOverlay} onClose={() => setShowShortcutOverlay(false)} />
      <InstallPrompt />
      {failedTrack && (
        <SmartReplaceDialog 
          failedTrack={failedTrack} 
          onClose={() => usePlayerStore.setState({ failedTrack: null })} 
        />
      )}
    </>
  );
}

export function App() {
  const hydratePrefs = usePreferenceStore((state) => state.hydrate);
  const hydrateLibrary = useLibraryStore((state) => state.hydrate);
  const hydrateDownloads = useDownloadStore((state) => state.hydrate);
  const { lastSeenVersion, updatePreference, isHydrated } = usePreferenceStore();
  const prefersReducedMotion = useReducedMotion();

  const showChangelog = isHydrated && lastSeenVersion !== APP_VERSION;

  useEffect(() => {
    hydratePrefs();
    hydrateLibrary();
    hydrateDownloads();
    initQueueService();
    try {
      discordService.initialize();
    } catch {
      /* Ignored */
    }
    updateService.checkForUpdates().catch((err) => {
      console.warn('Silent update check failure:', err);
    });
  }, [hydratePrefs, hydrateLibrary, hydrateDownloads]);

  const handleCloseChangelog = () => {
    updatePreference('lastSeenVersion', APP_VERSION);
  };

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ResponsiveProvider>
          <LazyMotion features={prefersReducedMotion ? domMin : domMax}>
            <HashRouter>
              <AppInner />
              {showChangelog && (
                <ChangelogReader
                  changelog={CHANGELOG}
                  onClose={handleCloseChangelog}
                />
              )}
            </HashRouter>
          </LazyMotion>
        </ResponsiveProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
