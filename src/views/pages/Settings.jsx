import { useState, useEffect, useRef } from 'react';
import { PageTransition } from '../../components/layout/PageTransition/PageTransition';
import { SolidPanel } from '../../components/common/SolidPanel/SolidPanel';
import { Button } from '../../components/common/Button/Button';
import { usePreferenceStore } from '../../store/preferenceStore';
import { useToastStore } from '../../store/toastStore';
import { AudioEngine } from '../../core/audio/AudioEngine';

const sectionStyle = { padding: 'var(--space-6)', marginBottom: 'var(--space-4)' };
const headerStyle = { margin: '0 0 var(--space-2) 0' };
const descStyle = { margin: '0 0 var(--space-4) 0', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' };
const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' };

export function Settings() {
  const { 
    username,
    streamQuality,
    dataSaverEnabled, 
    vibeTuneEnabled,
    visualizerType,
    petEnabled,
    petCharacter,
    playbackSpeed,
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

  const handlePlaybackSpeedChange = (speed) => {
    updatePreference('playbackSpeed', speed);
    AudioEngine.setPlaybackSpeed(speed);
  };

  if (!isHydrated) {
    return <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>Loading settings…</div>;
  }

  return (
    <PageTransition>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: 'var(--space-4)', paddingBottom: 'var(--space-8)' }}>
        <h1 style={{ marginBottom: 'var(--space-6)' }}>Settings</h1>
        
        {/* Profile Section */}
        <SolidPanel style={sectionStyle}>
          <h3 style={headerStyle}>Profile</h3>
          <p style={descStyle}>Set your username for greetings and interactions.</p>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <input 
              type="text" 
              defaultValue={username} 
              ref={usernameRef}
              placeholder="Username"
              style={{
                flex: 1, padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255,255,255,0.1)', background: 'var(--bg-highlight)',
                color: 'var(--text-primary)', outline: 'none'
              }}
            />
            <Button variant="primary" onClick={handleSaveUsername}>Save</Button>
          </div>
        </SolidPanel>

        {/* Streaming & Data Section */}
        <SolidPanel style={sectionStyle}>
          <div style={rowStyle}>
            <div>
              <h3 style={headerStyle}>Data Saver</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                Limits audio quality to 96kbps and disables visualizers to save bandwidth.
              </p>
            </div>
            <Button 
              variant={dataSaverEnabled ? 'primary' : 'secondary'}
              onClick={() => updatePreference('dataSaverEnabled', !dataSaverEnabled)}
            >
              {dataSaverEnabled ? 'Enabled' : 'Disabled'}
            </Button>
          </div>

          <div style={{ opacity: dataSaverEnabled ? 0.5 : 1, pointerEvents: dataSaverEnabled ? 'none' : 'auto' }}>
            <h4 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-sm)' }}>Streaming Quality</h4>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
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
        <SolidPanel style={sectionStyle}>
          <h3 style={headerStyle}>Audio Settings</h3>
          <p style={descStyle}>Customize your listening experience.</p>
          
          <h4 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-sm)' }}>Playback Speed</h4>
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            {[0.5, 1.0, 1.5, 2.0].map(speed => (
              <Button
                key={speed}
                variant={playbackSpeed === speed ? 'primary' : 'secondary'}
                onClick={() => handlePlaybackSpeedChange(speed)}
              >
                {speed}x
              </Button>
            ))}
          </div>

          <h4 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-sm)' }}>Crossfade Duration (Phase 20)</h4>
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
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

          <h4 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-sm)' }}>Equalizer Preset (Phase 20)</h4>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
            {['Normal', 'Bass Boost', 'Vocal', 'Treble', 'Rock', 'Pop'].map(preset => (
              <Button
                key={preset}
                variant={equalizerPreset === preset ? 'primary' : 'secondary'}
                onClick={() => updatePreference('equalizerPreset', preset)}
              >
                {preset}
              </Button>
            ))}
          </div>

          <div style={{ ...rowStyle, marginBottom: 0 }}>
            <div>
              <h4 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-sm)' }}>Sleep Timer (Phase 20)</h4>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                Automatically stop playback after a set time.
              </p>
            </div>
            <Button variant="secondary" onClick={() => addToast('Sleep timer coming in Phase 20!', 'info')}>
              Set Timer
            </Button>
          </div>
        </SolidPanel>

        {/* Visuals Section */}
        <SolidPanel style={sectionStyle}>
          <div style={rowStyle}>
            <div>
              <h3 style={headerStyle}>VibeTune Visualizer</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                Enable dynamic audio-reactive backgrounds in the Fullscreen Player.
              </p>
            </div>
            <Button 
              variant={vibeTuneEnabled ? 'primary' : 'secondary'}
              onClick={() => updatePreference('vibeTuneEnabled', !vibeTuneEnabled)}
              disabled={dataSaverEnabled}
            >
              {vibeTuneEnabled ? 'Enabled' : 'Disabled'}
            </Button>
          </div>

          <div style={{ opacity: vibeTuneEnabled && !dataSaverEnabled ? 1 : 0.5, pointerEvents: vibeTuneEnabled && !dataSaverEnabled ? 'auto' : 'none', marginBottom: 'var(--space-4)' }}>
            <h4 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-sm)' }}>Visualizer Type</h4>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
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

          <div style={rowStyle}>
            <div>
              <h3 style={headerStyle}>Virtual Pet</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                A little floating companion that reacts to your music.
              </p>
            </div>
            <Button 
              variant={petEnabled ? 'primary' : 'secondary'}
              onClick={() => updatePreference('petEnabled', !petEnabled)}
            >
              {petEnabled ? 'Enabled' : 'Disabled'}
            </Button>
          </div>

          <div style={{ opacity: petEnabled ? 1 : 0.5, pointerEvents: petEnabled ? 'auto' : 'none' }}>
            <h4 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-sm)' }}>Pet Character</h4>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
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
        <SolidPanel style={sectionStyle}>
          <div style={{ ...rowStyle, marginBottom: 'var(--space-4)' }}>
            <div>
              <h3 style={headerStyle}>Notifications</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                Show in-app toasts for song changes and actions.
              </p>
            </div>
            <Button 
              variant={notificationsEnabled ? 'primary' : 'secondary'}
              onClick={() => updatePreference('notificationsEnabled', !notificationsEnabled)}
            >
              {notificationsEnabled ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
          
          <div style={{ ...rowStyle, marginBottom: 0 }}>
            <div>
              <h3 style={headerStyle}>Gesture Guide</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                Replay the gesture tutorial overlay.
              </p>
            </div>
            <Button variant="secondary" onClick={() => addToast('Gesture guide replay coming in Phase 18!', 'info')}>
              Show Guide
            </Button>
          </div>
        </SolidPanel>

        {/* Cache Management */}
        <SolidPanel style={sectionStyle}>
          <div style={{ ...rowStyle, marginBottom: 0 }}>
            <div>
              <h3 style={headerStyle}>Storage & Cache</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                Currently using approx <strong>{cacheSize}</strong> for data.
              </p>
            </div>
            <Button variant="secondary" onClick={handleClearCache}>
              Clear Cache
            </Button>
          </div>
        </SolidPanel>

        {/* About Section */}
        <div style={{ textAlign: 'center', marginTop: 'var(--space-8)', color: 'var(--text-secondary)' }}>
          <h3>MoonPlayer</h3>
          <p>Version 0.0.1</p>
          <p style={{ fontSize: 'var(--text-sm)' }}>Made with ❤️ using React & Framer Motion</p>
        </div>

      </div>
    </PageTransition>
  );
}
