import { HashRouter, Routes, Route } from 'react-router-dom';

/* Placeholder page components -- replaced in later phases */
function PlaceholderPage({ title }) {
  return (
    <main
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
      <h1>{title}</h1>
      <p>Phase 0 -- route is working.</p>
    </main>
  );
}

function HomePage() {
  return <PlaceholderPage title="Home" />;
}

function SearchPage() {
  return <PlaceholderPage title="Search" />;
}

function LibraryPage() {
  return <PlaceholderPage title="Library" />;
}

function PlaylistDetailPage() {
  return <PlaceholderPage title="Playlist" />;
}

function SettingsPage() {
  return <PlaceholderPage title="Settings" />;
}

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/library/:playlistId" element={<PlaylistDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </HashRouter>
  );
}
