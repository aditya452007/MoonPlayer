import { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar';
import { BottomNavigation } from '../BottomNavigation/BottomNavigation';
import { TopBar } from '../TopBar/TopBar';
import { GlobalPlayer } from '../../player/GlobalPlayer/GlobalPlayer';
import { QueuePanel } from '../../player/QueuePanel/QueuePanel';
import { PlayerOverlayWrapper } from '../../player/PlayerOverlayWrapper/PlayerOverlayWrapper';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import { usePlayerStore } from '../../../store/playerStore';
import './ShellLayout.css';

const TAB_PATHS = ['/', '/search', '/library', '/local-music', '/offline'];

export function ShellLayout({ children, ambientStyle }) {
  const location = useLocation();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const renderedTabs = useRef({});
  const { isQueueVisible } = usePlayerStore();

  const isTabRoute = TAB_PATHS.includes(location.pathname);

  // If current route is a tab, store its rendered content
  if (isTabRoute) {
    /* eslint-disable-next-line react-hooks/refs */
    renderedTabs.current[location.pathname] = children;
  }

  const showSidebar = isDesktop || isTablet;
  const showBottomNav = isMobile;

  return (
    <div className={`shell-layout ${isQueueVisible && !isMobile ? 'shell-layout--queue-open' : ''}`} data-component="shell-layout">
      <div className="shell-layout__background" style={ambientStyle} aria-hidden="true"></div>

      {showSidebar && <Sidebar />}

      <div className="shell-layout__main-wrapper">
        <TopBar />

        <main className="shell-layout__content" id="main-content">
          {/* Always render all previously-visited tabs; toggle visibility */}
          {/* eslint-disable-next-line react-hooks/refs */}
          {Object.entries(renderedTabs.current).map(([path, content]) => (
            <div
              key={path}
              style={{
                display: path === location.pathname ? 'block' : 'none',
                height: '100%',
                width: '100%',
                overflowY: 'auto',
              }}
            >
              {content}
            </div>
          ))}
          {/* Non-tab routes (playlist/:id, settings, etc.) render directly */}
          {!isTabRoute && (
            <div style={{ height: '100%', width: '100%', overflowY: 'auto' }}>
              {children}
            </div>
          )}
        </main>
      </div>

      {isQueueVisible && <QueuePanel />}

      {showBottomNav && <BottomNavigation />}

      <GlobalPlayer />
      <PlayerOverlayWrapper />
    </div>
  );
}
