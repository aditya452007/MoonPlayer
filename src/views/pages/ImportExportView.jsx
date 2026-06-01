import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CaretLeft, Upload, FileCsv, Export } from '@phosphor-icons/react';
import { PageTransition } from '../../components/layout/PageTransition/PageTransition';
import { useLibraryStore } from '../../store/libraryStore';
import { importExportService } from '../../core/api/importExportService';
import './ImportExportView.css';

export function ImportExportView() {
  const navigate = useNavigate();
  const { playlists } = useLibraryStore();
  const jsonInputRef = useRef(null);
  const m3uInputRef = useRef(null);
  const [status, setStatus] = useState(null);

  const showStatus = (msg, type = 'success') => {
    setStatus({ msg, type });
    setTimeout(() => setStatus(null), 4000);
  };

  const handleImportJson = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await importExportService.importPlaylistFromJson(file);
      showStatus(`Imported ${result.imported} playlist(s) successfully`, 'success');
    } catch (err) {
      showStatus(err.message, 'error');
    }
    e.target.value = '';
  };

  const handleImportM3U = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await importExportService.importFromM3U(file);
      showStatus(`Imported ${result.imported} track(s) from M3U`, 'success');
    } catch (err) {
      showStatus(err.message, 'error');
    }
    e.target.value = '';
  };

  return (
    <PageTransition>
      <div className="import-export-view">
        <div className="import-export-view__header">
          <button type="button" className="import-export-view__back-btn" onClick={() => navigate(-1)} aria-label="Go back">
            <CaretLeft size={22} />
          </button>
          <h1 className="import-export-view__title">Import / Export</h1>
        </div>

        {status && (
          <div className={`import-export-view__status import-export-view__status--${status.type}`}>
            {status.msg}
          </div>
        )}

        <div className="import-export-view__section">
          <h2 className="import-export-view__section-title">Export Library</h2>
          <p className="import-export-view__section-desc">Download your playlists and liked songs as a JSON file.</p>
          <div className="import-export-view__actions">
            <button
              type="button"
              className="import-export-view__btn import-export-view__btn--primary"
              onClick={() => {
                importExportService.exportAllPlaylistsAsJson();
                showStatus('Library exported as JSON', 'success');
              }}
            >
              <Export size={18} />
              Export All Playlists (JSON)
            </button>
          </div>

          {playlists.length > 0 && (
            <>
              <p className="import-export-view__section-desc">Or export individual playlists:</p>
              <div className="import-export-view__playlist-list">
                {playlists.map(pl => (
                  <div key={pl.id} className="import-export-view__playlist-item">
                    <span className="import-export-view__playlist-name">{pl.name}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span className="import-export-view__playlist-count">{pl.tracks?.length || 0} tracks</span>
                      <button
                        type="button"
                        className="import-export-view__btn import-export-view__btn--secondary"
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                        onClick={() => importExportService.exportPlaylistAsJson(pl)}
                      >
                        JSON
                      </button>
                      <button
                        type="button"
                        className="import-export-view__btn import-export-view__btn--secondary"
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                        onClick={() => importExportService.exportToM3U(pl)}
                      >
                        M3U
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="import-export-view__section">
          <h2 className="import-export-view__section-title">Import Playlists</h2>
          <p className="import-export-view__section-desc">Import playlists from a JSON or M3U file.</p>
          <div className="import-export-view__actions">
            <input
              ref={jsonInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImportJson}
            />
            <button
              type="button"
              className="import-export-view__btn import-export-view__btn--secondary"
              onClick={() => jsonInputRef.current?.click()}
            >
              <Upload size={18} />
              Import from JSON
            </button>

            <input
              ref={m3uInputRef}
              type="file"
              accept=".m3u,.m3u8"
              style={{ display: 'none' }}
              onChange={handleImportM3U}
            />
            <button
              type="button"
              className="import-export-view__btn import-export-view__btn--secondary"
              onClick={() => m3uInputRef.current?.click()}
            >
              <FileCsv size={18} />
              Import from M3U
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

export default ImportExportView;
