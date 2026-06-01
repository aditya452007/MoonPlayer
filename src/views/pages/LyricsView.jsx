import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CaretLeft, MicrophoneStage } from '@phosphor-icons/react';
import { usePlayerStore } from '../../store/playerStore';
import { PageTransition } from '../../components/layout/PageTransition/PageTransition';
import { LyricsPanel } from '../../components/player/LyricsPanel/LyricsPanel';
import { lyricsService } from '../../core/audio/lyricsService';
import { extractColorPalette } from '../../core/utils/colorExtractor';
import { IconButton } from '../../components/common/IconButton/IconButton';
import './LyricsView.css';

export function LyricsView() {
  const navigate = useNavigate();
  const { currentTrack, progress, seek } = usePlayerStore();
  const [lyricsData, setLyricsData] = useState(null);
  const [palette, setPalette] = useState(['rgb(26, 30, 37)']);

  useEffect(() => {
    const controller = new AbortController();
    if (currentTrack?.imageUrl) {
      extractColorPalette(currentTrack.imageUrl, controller.signal, 2).then((colors) => {
        setPalette(colors);
      });
    }
    if (currentTrack) {
      lyricsService.getLyrics(currentTrack, controller.signal)
        .then((data) => {
          setLyricsData(data);
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            setLyricsData(null);
          }
        });
    }
    return () => controller.abort();
  }, [currentTrack]);

  if (!currentTrack) {
    return (
      <PageTransition>
        <div className="lyrics-view lyrics-view--empty">
          <MicrophoneStage size={48} style={{ opacity: 0.3, marginBottom: 'var(--space-4)' }} />
          <h2>No track playing</h2>
          <p>Play some music to view lyrics here.</p>
        </div>
      </PageTransition>
    );
  }

  const backgroundStyle = {
    background: palette.length > 1
      ? `radial-gradient(ellipse at 50% 20%, ${palette[0]} 0%, ${palette[1]} 50%, var(--bg-void) 90%)`
      : `radial-gradient(ellipse at 50% 20%, ${palette[0]} 0%, var(--bg-void) 80%)`,
  };

  return (
    <PageTransition>
      <div className="lyrics-view" style={backgroundStyle}>
        <header className="lyrics-view__header">
          <IconButton 
            icon={CaretLeft} 
            size="lg" 
            ariaLabel="Go back" 
            onClick={() => navigate(-1)} 
          />
          <div className="lyrics-view__track-info">
            <h3 className="lyrics-view__track-title">{currentTrack.title}</h3>
            <p className="lyrics-view__track-artist">{currentTrack.artistNames?.join(', ')}</p>
          </div>
          <div style={{ width: 48 }} /> {/* Spacer to balance header */}
        </header>

        <main className="lyrics-view__content">
          <LyricsPanel 
            lyricsData={lyricsData} 
            currentTime={progress} 
            onSeek={seek} 
            lyricOffset={0}
          />
        </main>
      </div>
    </PageTransition>
  );
}

export default LyricsView;
