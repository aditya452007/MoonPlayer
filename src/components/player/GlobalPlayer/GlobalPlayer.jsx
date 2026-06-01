import { usePlayerStore } from '../../../store/playerStore';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import { GlassPanel } from '../../common/GlassPanel/GlassPanel';
import { BottomPlaybar } from '../BottomPlaybar/BottomPlaybar';
import { MiniPlayer } from '../MiniPlayer/MiniPlayer';
import './GlobalPlayer.css';

export function GlobalPlayer() {
  const { currentTrack } = usePlayerStore();
  const { isMobile } = useBreakpoint();

  if (!currentTrack) {
    return null; // Don't render until a track is selected
  }

  return (
    <GlassPanel 
      className={`global-player ${isMobile ? 'global-player--mobile' : 'global-player--desktop'}`} 
      variant="miniplayer"
    >
      {isMobile ? (
        <MiniPlayer />
      ) : (
        <BottomPlaybar />
      )}
    </GlassPanel>
  );
}
export default GlobalPlayer;
