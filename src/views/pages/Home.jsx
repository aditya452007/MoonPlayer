import { useState } from 'react';
import { PageTransition } from '../../components/layout/PageTransition/PageTransition';
import { SolidPanel } from '../../components/common/SolidPanel/SolidPanel';
import { Button } from '../../components/common/Button/Button';
import { Play, Pause } from '@phosphor-icons/react';
import { MusicService } from '../../core/api/MusicService';
import { usePlayerStore } from '../../store/playerStore';
import { usePreferenceStore } from '../../store/preferenceStore';

export function Home() {
  const { play, pause, isPlaying, currentTrack } = usePlayerStore();
  const { streamQuality, dataSaverEnabled } = usePreferenceStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTestPlay = async () => {
    if (isPlaying && currentTrack) {
      pause();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Fetch trending songs from JioSaavn
      const tracks = await MusicService.getTrending(streamQuality, dataSaverEnabled);
      
      if (tracks && tracks.length > 0) {
        // Play the first trending track
        const trackToPlay = tracks[0];
        
        // JIT Resolution for the stream URL just before playing
        // (If the stream URL is already resolved in search results, we can use it directly,
        // but for robustness we fetch fresh details to ensure the URL isn't expired).
        const freshTrack = await MusicService.getTrackDetails(trackToPlay.id, streamQuality, dataSaverEnabled);
        play(freshTrack);
      } else {
        setError('No trending tracks found.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch track from MusicService.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--space-4)' }}>
        <h1 style={{ marginBottom: 'var(--space-6)' }}>Dashboard</h1>
        
        <SolidPanel style={{ padding: 'var(--space-6)' }}>
          <h3>Phase 4: Music Engine Verification</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            This tests the JioSaavn API integration and Howler.js audio playback engine.
          </p>
          
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Button 
              variant="primary" 
              icon={isPlaying ? Pause : Play}
              onClick={handleTestPlay}
              loading={loading}
            >
              {isPlaying ? 'Pause Test Track' : 'Play Test Track'}
            </Button>
          </div>

          {error && <p style={{ color: 'var(--accent-moon)', marginTop: 'var(--space-2)' }}>{error}</p>}
          
          {currentTrack && (
            <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
              <img 
                src={currentTrack.imageUrl} 
                alt="Album Art" 
                style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-sm)' }} 
              />
              <div>
                <h4 style={{ margin: 0 }}>{currentTrack.title}</h4>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{currentTrack.artistNames.join(', ')}</p>
              </div>
            </div>
          )}
        </SolidPanel>
      </div>
    </PageTransition>
  );
}
