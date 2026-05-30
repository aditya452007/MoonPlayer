import { useBreakpoint } from '../../../hooks/useBreakpoint';
import { usePlayerStore } from '../../../store/playerStore';
import { Sidebar } from '../Sidebar/Sidebar';
import { BottomNavigation } from '../BottomNavigation/BottomNavigation';
import { TopBar } from '../TopBar/TopBar';
import { GlobalPlayer } from '../../player/GlobalPlayer/GlobalPlayer';
import { QueuePanel } from '../../player/QueuePanel/QueuePanel';
import './AppShell.css';

/**
 * The master layout wrapper that houses the navigation and main content area.
 * It adapts based on the current screen breakpoint.
 */
export function AppShell({ children }) {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const { isQueueVisible } = usePlayerStore();
  
  // Sidebar is visible on desktop and tablet
  const showSidebar = isDesktop || isTablet;
  // Bottom nav is visible only on mobile
  const showBottomNav = isMobile;

  return (
    <div className={`app-shell ${isQueueVisible && !isMobile ? 'app-shell--queue-open' : ''}`} data-component="app-shell">
      {/* Background elements can go here (e.g. ambient gradient blobs) */}
      <div className="app-shell__background" aria-hidden="true"></div>

      {showSidebar && <Sidebar />}
      
      <div className="app-shell__main-wrapper">
        <TopBar />
        
        <main className="app-shell__content" id="main-content">
          {children}
        </main>
      </div>

      {isQueueVisible && <QueuePanel />}

      {showBottomNav && <BottomNavigation />}
      
      <GlobalPlayer />
    </div>
  );
}

