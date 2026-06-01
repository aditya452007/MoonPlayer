import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../../components/layout/PageTransition/PageTransition';
import { SolidPanel } from '../../components/common/SolidPanel/SolidPanel';
import { Button } from '../../components/common/Button/Button';
import { Switch } from '../../components/common/Switch/Switch';
import { usePreferenceStore } from '../../store/preferenceStore';
import { useToastStore } from '../../store/toastStore';
import { AudioEngine } from '../../core/audio/AudioEngine';
import { backupService } from '../../core/api/backupService';
import './Settings.css';

export function Settings() {
  const navigate = useNavigate();
  const { 
    username,
    streamQuality,
    dataSaverEnabled, 
    vibeTuneEnabled,
    visualizerType,
    petEnabled,
    petCharacter,
    crossfade,
    equalizerPreset,
    notificationsEnabled,
    updatePreference,
    clearCache,
    isHydrated 
  } = usePreferenceStore();

  const addToast = useToastStore((state) => state.addToast);
  const usernameRef = useRef(null);
  const [cacheSize, setCacheSize] = useState('Calculating…');

  useEffect(() => {
    async function getCacheSize() {
      if (navigator.storage && navigator.storage.estimate) {
        try {
          const estimate = await navigator.storage.estimate();
          const mb = (estimate.usage / (1024 * 1024)).toFixed(2);
          setCacheSize(`${mb} MB`);
        } catch {
          setCacheSize('Unknown');
        }
      } else {
        setCacheSize('Unknown');
      }
    }
    getCacheSize();
  }, []);

  const handleSaveUsername = () => {
    if (usernameRef.current) {
      updatePreference('username', usernameRef.current.value);
      addToast('Username saved!', 'success');
    }
  };

  const handleClearCache = async () => {
    const success = await clearCache();
    if (success) {
      setCacheSize('0.00 MB');
      addToast('Cache cleared successfully!', 'success');
    } else {
      addToast('Failed to clear cache.', 'error');
    }
  };


  if (!isHydrated) {
    return <div className="settings-page__loading">Loading settings…</div>;
  }

  return (
    <PageTransition>
      <div className="settings-page">
        <h1 className="settings-page__title">Settings</h1>
        
        {/* Profile Section */}
        <SolidPanel className="settings-section">
          <h3 className="settings-section__header">Profile</h3>
          <p className="settings-section__desc">Set your username for greetings and interactions.</p>
          <div className="settings-profile-input-container">
            <input 
              type="text" 
              defaultValue={username} 
              ref={usernameRef}
              placeholder="Username"
              className="settings-profile-input"
            />
            <Button variant="primary" onClick={handleSaveUsername}>Save</Button>
          </div>
        </SolidPanel>
 
        {/* Streaming & Data Section */}
        <SolidPanel className="settings-section">
          <div className="settings-row">
            <div>
              <h3 className="settings-section__header">Data Saver</h3>
              <p className="settings-section__desc" style={{ marginBottom: 0 }}>
                Limits audio quality to 96kbps and disables visualizers to save bandwidth.
              </p>
            </div>
            <Switch
              checked={dataSaverEnabled}
              onChange={(val) => updatePreference('dataSaverEnabled', val)}
            />
          </div>

          <div style={{ opacity: dataSaverEnabled ? 0.5 : 1, pointerEvents: dataSaverEnabled ? 'none' : 'auto' }}>
            <h4 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-sm)' }}>Streaming Quality</h4>
            <div className="settings-section__quality-container">
              {['320kbps', '160kbps', '96kbps'].map(q => (
                <Button
                  key={q}
                  variant={streamQuality === q ? 'primary' : 'secondary'}
                  onClick={() => updatePreference('streamQuality', q)}
                >
                  {q.replace('kbps', ' kbps')}
                </Button>
              ))}
            </div>
          </div>
        </SolidPanel>

        {/* Audio Settings Section */}
        <SolidPanel className="settings-section">
          <h3 className="settings-section__header">Audio Settings</h3>
          <p className="settings-section__desc">Customize your listening experience.</p>

          <h4 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-sm)' }}>Crossfade Duration (Phase 20)</h4>
          <div className="settings-section__crossfade-container">
            {[0, 3, 5, 10].map(sec => (
              <Button
                key={sec}
                variant={crossfade === sec ? 'primary' : 'secondary'}
                onClick={() => updatePreference('crossfade', sec)}
              >
                {sec}s
              </Button>
            ))}
          </div>

          <h4 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-sm)' }}>Equalizer Preset</h4>
          <div className="settings-section__eq-container">
            {['Normal', 'Bass Boost', 'Vocal', 'Treble', 'Rock', 'Pop'].map(preset => (
              <Button
                key={preset}
                variant={equalizerPreset === preset ? 'primary' : 'secondary'}
                onClick={() => {
                  updatePreference('equalizerPreset', preset);
                  AudioEngine.setEqualizerPreset(preset);
                }}
              >
                {preset}
              </Button>
            ))}
          </div>

        </SolidPanel>

        {/* Visuals Section */}
        <SolidPanel className="settings-section">
          <div className="settings-row">
            <div>
              <h3 className="settings-section__header">VibeTune Visualizer</h3>
              <p className="settings-section__desc" style={{ marginBottom: 0 }}>
                Enable dynamic audio-reactive backgrounds in the Fullscreen Player.
              </p>
            </div>
            <Switch
              checked={vibeTuneEnabled}
              onChange={(val) => updatePreference('vibeTuneEnabled', val)}
              disabled={dataSaverEnabled}
            />
          </div>

          <div style={{ opacity: vibeTuneEnabled && !dataSaverEnabled ? 1 : 0.5, pointerEvents: vibeTuneEnabled && !dataSaverEnabled ? 'auto' : 'none', marginBottom: 'var(--space-4)' }}>
            <h4 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-sm)' }}>Visualizer Type</h4>
            <div className="settings-section__visualizer-container">
              <Button
                variant={visualizerType === 'aurora' ? 'primary' : 'secondary'}
                onClick={() => updatePreference('visualizerType', 'aurora')}
              >
                Aurora
              </Button>
              <Button
                variant={visualizerType === 'waveform' ? 'primary' : 'secondary'}
                onClick={() => updatePreference('visualizerType', 'waveform')}
              >
                Waveform
              </Button>
            </div>
          </div>

          <div className="settings-row">
            <div>
              <h3 className="settings-section__header">Virtual Pet</h3>
              <p className="settings-section__desc" style={{ marginBottom: 0 }}>
                A little floating companion that reacts to your music.
              </p>
            </div>
            <Switch
              checked={petEnabled}
              onChange={(val) => updatePreference('petEnabled', val)}
            />
          </div>

          <div style={{ opacity: petEnabled ? 1 : 0.5, pointerEvents: petEnabled ? 'auto' : 'none' }}>
            <h4 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-sm)' }}>Pet Character</h4>
            <div className="settings-section__pet-container">
              <Button
                variant={petCharacter === 'astronaut' ? 'primary' : 'secondary'}
                onClick={() => updatePreference('petCharacter', 'astronaut')}
              >
                Astronaut
              </Button>
              <Button
                variant={petCharacter === 'spacecat' ? 'primary' : 'secondary'}
                onClick={() => updatePreference('petCharacter', 'spacecat')}
              >
                Space Cat
              </Button>
            </div>
          </div>
        </SolidPanel>

        {/* General / App Behavior */}
        <SolidPanel className="settings-section">
          <div className="settings-row--general">
            <div>
              <h3 className="settings-section__header">Notifications</h3>
              <p className="settings-section__desc" style={{ marginBottom: 0 }}>
                Show in-app toasts for song changes and actions.
              </p>
            </div>
            <Switch
              checked={notificationsEnabled}
              onChange={(val) => updatePreference('notificationsEnabled', val)}
            />
          </div>
          
          <div className="settings-row--gesture">
            <div>
              <h3 className="settings-section__header">Gesture Guide</h3>
              <p className="settings-section__desc" style={{ marginBottom: 0 }}>
                Replay the gesture tutorial overlay.
              </p>
            </div>
            <Button variant="secondary" onClick={() => {
              updatePreference('hasSeenGestureGuide', false);
              addToast('Opening swipe & gesture guide...', 'success');
            }}>
              Show Guide
            </Button>
          </div>
        </SolidPanel>

        {/* Cache Management */}
        <SolidPanel className="settings-section">
          <div className="settings-row--cache">
            <div>
              <h3 className="settings-section__header">Storage & Cache</h3>
              <p className="settings-section__desc" style={{ marginBottom: 0 }}>
                Currently using approx <strong>{cacheSize}</strong> for data.
              </p>
            </div>
            <Button variant="secondary" onClick={handleClearCache}>
              Clear Cache
            </Button>
          </div>
        </SolidPanel>

        {/* Navigation to Advanced Views */}
        <SolidPanel className="settings-section">
          <h3 className="settings-section__header">Advanced</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
            <Button variant="secondary" onClick={() => navigate('/equalizer')} style={{ justifyContent: 'flex-start' }}>
              🎛️ Open Equalizer
            </Button>
            <Button variant="secondary" onClick={() => navigate('/import-export')} style={{ justifyContent: 'flex-start' }}>
              📤 Import / Export Playlists
            </Button>
            <Button variant="secondary" onClick={() => navigate('/local-music')} style={{ justifyContent: 'flex-start' }}>
              🎵 Local Music
            </Button>
          </div>
        </SolidPanel>

        {/* Backup & Restore */}
        <SolidPanel className="settings-section">
          <h3 className="settings-section__header">Backup & Restore</h3>
          <p className="settings-section__desc">Export your entire library and settings, or restore from a backup.</p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <Button variant="secondary" onClick={async () => {
              try {
                await backupService.exportBackup();
                addToast('Backup exported successfully', 'success');
              } catch (e) {
                addToast('Export failed: ' + e.message, 'error');
              }
            }}>
              Export Backup
            </Button>
            <label style={{ display: 'inline-block', cursor: 'pointer' }}>
              <input
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const result = await backupService.importBackup(file);
                    addToast(`Backup restored (${result.playlists} playlists)`, 'success');
                  } catch (err) {
                    addToast('Restore failed: ' + err.message, 'error');
                  }
                  e.target.value = '';
                }}
              />
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: 'var(--text-sm)',
                cursor: 'pointer',
              }}>
                Import Backup
              </span>
            </label>
          </div>
        </SolidPanel>

        {/* About Section */}
        <div className="settings-about">
          <h3>MoonPlayer</h3>
          <p>Version 0.0.1</p>
          <p style={{ fontSize: 'var(--text-sm)', margin: 0 }}>Made with ❤️ using React & Framer Motion</p>
        </div>

      </div>
    </PageTransition>
  );
}
export default Settings;
