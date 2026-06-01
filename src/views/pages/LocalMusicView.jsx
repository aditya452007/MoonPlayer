import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CaretLeft, MusicNote, FolderOpen, Plus } from '@phosphor-icons/react';
import { PageTransition } from '../../components/layout/PageTransition/PageTransition';
import { useLocalMusicStore } from '../../store/localMusicStore';
import { usePlayerStore } from '../../store/playerStore';
import './LocalMusicView.css';

export function LocalMusicView() {
  const navigate = useNavigate();
  const { localTracks, isScanning, scanError, scanDirectory, scanFiles, clearLocalTracks } = useLocalMusicStore();
  const play = usePlayerStore(s => s.play);
  const addToQueue = usePlayerStore(s => s.addToQueue);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = localTracks.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasFSAPI = 'showDirectoryPicker' in window;

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <PageTransition>
      <div className="local-music-view">
        <div className="local-music-view__header">
          <button type="button" className="local-music-view__back-btn" onClick={() => navigate(-1)} aria-label="Go back">
            <CaretLeft size={22} />
          </button>
          <h1 className="local-music-view__title">Local Music</h1>
        </div>

        <div className="local-music-view__scan-panel">
          <div className="local-music-view__scan-info">
            <p className="local-music-view__scan-title">Browse Local Files</p>
            <p className="local-music-view__scan-desc">
              {hasFSAPI
                ? 'Pick a folder to scan for audio files, or select individual files.'
                : 'Select audio files to play from your device.'}
            </p>
          </div>
          <div className="local-music-view__scan-actions">
            {hasFSAPI && (
              <button
                type="button"
                className="local-music-view__scan-btn"
                disabled={isScanning}
                onClick={async () => {
                  try { await scanDirectory(); } catch { /* Ignored */ }
                }}
              >
                <FolderOpen size={18} />
                {isScanning ? 'Scanning…' : 'Open Folder'}
              </button>
            )}
            <button
              type="button"
              className="local-music-view__scan-btn local-music-view__scan-btn--secondary"
              disabled={isScanning}
              onClick={async () => {
                try { await scanFiles(); } catch { /* Ignored */ }
              }}
            >
              <Plus size={18} />
              Select Files
            </button>
            {localTracks.length > 0 && (
              <button
                type="button"
                className="local-music-view__scan-btn local-music-view__scan-btn--secondary"
                onClick={clearLocalTracks}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {scanError && (
          <div className="local-music-view__error">{scanError}</div>
        )}

        {localTracks.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="local-music-view__count">{localTracks.length} file{localTracks.length !== 1 ? 's' : ''} loaded</span>
              <input
                type="text"
                placeholder="Filter..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                  outline: 'none',
                  width: '180px',
                }}
              />
            </div>
            <div className="local-music-view__track-list">
              {filtered.map((track) => (
                <div
                  key={track.id}
                  className="local-music-view__track"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    const allWithQueue = filtered;
                    addToQueue(allWithQueue);
                    play(track);
                  }}
                  onKeyDown={e => e.key === 'Enter' && play(track)}
                >
                  <div className="local-music-view__track-icon">
                    <MusicNote size={20} />
                  </div>
                  <div className="local-music-view__track-info">
                    <p className="local-music-view__track-title">{track.title}</p>
                    <p className="local-music-view__track-meta">{track.fileName} · {formatSize(track.fileSize)}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!isScanning && localTracks.length === 0 && !scanError && (
          <div style={{ textAlign: 'center', padding: 'var(--space-10) 0', color: 'var(--text-secondary)' }}>
            <MusicNote size={48} style={{ marginBottom: 'var(--space-3)', opacity: 0.3 }} />
            <p>No local files loaded. Open a folder or select files above.</p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

export default LocalMusicView;
