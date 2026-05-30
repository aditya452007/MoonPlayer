import { useLocation } from 'react-router-dom';
import { MagnifyingGlass, User } from '@phosphor-icons/react';
import { IconButton } from '../../common/IconButton/IconButton';
import './TopBar.css';

export function TopBar() {
  const location = useLocation();
  
  // Example of changing title based on route, though often we let 
  // the page content define its own header.
  const getPageTitle = () => {
    switch(location.pathname) {
      case '/': return 'Good evening';
      case '/search': return 'Search';
      case '/library': return 'Your Library';
      case '/settings': return 'Settings';
      default: return '';
    }
  };

  return (
    <header className="top-bar">
      <div className="top-bar__left">
        <h2 className="top-bar__title">{getPageTitle()}</h2>
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
