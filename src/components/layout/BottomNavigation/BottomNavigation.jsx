import { NavLink } from 'react-router-dom';
import { House, MagnifyingGlass, Books, FolderOpen, Download } from '@phosphor-icons/react';
import { GlassPanel } from '../../common/GlassPanel/GlassPanel';
import { HOME, SEARCH, LIBRARY, LOCAL_MUSIC, OFFLINE } from '../../../routes/routeConstants';
import './BottomNavigation.css';

const TABS = [
  { path: HOME, label: 'Home', icon: House },
  { path: SEARCH, label: 'Search', icon: MagnifyingGlass },
  { path: LIBRARY, label: 'Library', icon: Books },
  { path: LOCAL_MUSIC, label: 'Local Music', icon: FolderOpen },
  { path: OFFLINE, label: 'Offline', icon: Download },
];

export function BottomNavigation() {
  return (
    <GlassPanel as="nav" className="bottom-nav" blur="heavy">
      {TABS.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) => `bottom-nav__tab ${isActive ? 'bottom-nav__tab--active' : ''}`}
        >
          {({ isActive }) => (
            <>
              <tab.icon 
                weight={isActive ? 'fill' : 'regular'} 
                className="bottom-nav__icon" 
              />
              <span className="bottom-nav__label">{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </GlassPanel>
  );
}

export default BottomNavigation;
