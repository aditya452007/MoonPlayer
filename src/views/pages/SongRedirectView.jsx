import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MusicService } from '../../core/api/MusicService';
import { usePlayerStore } from '../../store/playerStore';
import { usePreferenceStore } from '../../store/preferenceStore';
import { useToastStore } from '../../store/toastStore';
import { PageTransition } from '../../components/layout/PageTransition/PageTransition';
import { Spinner } from '@phosphor-icons/react';
import './SongRedirectView.css';

/**
 * SongRedirectView Page Component
 * Handles direct deep links to shared tracks, resolves audio settings
 * according to user preference bitrates, and schedules playback before routing home.
 */
export function SongRedirectView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { play, addToQueue } = usePlayerStore();
  const { addToast } = useToastStore();
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;

    async function fetchAndPlay() {
      try {
        // Fetch quality and saver preferences from store to respect user data/bandwidth (Issue #26)
        const { streamQuality, dataSaverEnabled } = usePreferenceStore.getState();
        const track = await MusicService.getTrackDetails(id, streamQuality, dataSaverEnabled);
        
        if (isMounted) {
          addToast(`Playing ${track.title} via shared link`, 'success');
          
          // Add to queue and play
          addToQueue(track);
          play(track);
          
          // Redirect to home dashboard
          navigate('/', { replace: true });
        }
      } catch (err) {
        console.error('Failed to resolve shared song:', err);
        if (isMounted) {
          setError('Could not find or play this song. It may be unavailable.');
          addToast('Failed to load shared song', 'error');
          // Navigate home after a short delay
          timeoutId = setTimeout(() => {
            if (isMounted) navigate('/', { replace: true });
          }, 3000);
        }
      }
    }

    if (id) {
      fetchAndPlay();
    } else {
      navigate('/', { replace: true });
    }

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [id, navigate, play, addToQueue, addToast]);

  return (
    <PageTransition>
      <div className="song-redirect-view">
        {error ? (
          <div className="song-redirect-view__error">
            <h2>Oops!</h2>
            <p>{error}</p>
          </div>
        ) : (
          <div className="song-redirect-view__loading">
            <Spinner className="song-redirect-view__spinner" size={48} weight="bold" />
            <p>Loading shared song…</p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
