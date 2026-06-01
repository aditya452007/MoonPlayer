import { useLocation, useNavigate } from 'react-router-dom';
import { MagnifyingGlass, User, Moon, CaretLeft } from '@phosphor-icons/react';
import { IconButton } from '../../common/IconButton/IconButton';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import { useSubRoute } from '../../../hooks/useSubRoute';
import './TopBar.css';

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const isSubRoute = useSubRoute();
  
  const getPageTitle = () => {
    switch(location.pathname) {
      case '/': return 'Home';
      case '/search': return 'Search';
      case '/library': return 'Your Library';
      case '/settings': return 'Settings';
      default: return '';
    }
  };

  return (
    <header className="top-bar">
      <div className="top-bar__left">
        {isSubRoute ? (
          <IconButton
            icon={CaretLeft}
            size="md"
            onClick={() => navigate(-1)}
            ariaLabel="Go back"
            className="top-bar__back-btn"
          />
        ) : isMobile && location.pathname === '/' ? (
          <div className="top-bar__logo-container">
            <Moon size={26} weight="fill" className="top-bar__logo-icon" />
            <span className="top-bar__brand-name">MoonPlayer</span>
          </div>
        ) : (
          <span className="top-bar__title" aria-current="page">{getPageTitle()}</span>
        )}
      </div>
      
      <div className="top-bar__right">
        {/* Placeholder for global search trigger on mobile, or full bar on desktop */}
        {location.pathname !== '/search' && (
          <div className="top-bar__search-hint" aria-hidden="true">
            <MagnifyingGlass weight="bold" />
            <span>Search for music…</span>
          </div>
        )}
        
        {/* Placeholder for Pet avatar / User profile */}
        <div className="top-bar__profile">
          <IconButton icon={User} size="sm" ariaLabel="User profile" />
        </div>
      </div>
    </header>
  );
}

