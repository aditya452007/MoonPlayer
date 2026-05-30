import { NavLink } from 'react-router-dom';
import { House, MagnifyingGlass, Books, Gear } from '@phosphor-icons/react';
import { usePlayerStore } from '../../../store/playerStore';
import { GlassPanel } from '../../common/GlassPanel/GlassPanel';
import './Sidebar.css';

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: House },
  { path: '/search', label: 'Search', icon: MagnifyingGlass },
  { path: '/library', label: 'Your Library', icon: Books },
];

export function Sidebar() {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isCollapsed = currentTrack !== null;

  return (
    <GlassPanel as="nav" className={`sidebar ${isCollapsed ? 'sidebar--collapsed' : ''}`} blur="default">
      <div className="sidebar__logo-container">
        {/* Placeholder for real logo SVGs */}
        <div className="sidebar__logo-icon"></div>
        <h1 className="sidebar__logo-text">MoonPlayer</h1>
      </div>
      
      <div className="sidebar__nav-group">
        {NAV_ITEMS.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
          >
            {({ isActive }) => (
              <>
                <item.icon weight={isActive ? 'fill' : 'regular'} className="sidebar__link-icon" />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
      
      <div className="sidebar__spacer" />

      <div className="sidebar__nav-group sidebar__nav-group--bottom">
        <NavLink 
          to="/settings" 
          className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
        >
          {({ isActive }) => (
            <>
              <Gear weight={isActive ? 'fill' : 'regular'} className="sidebar__link-icon" />
              <span>Settings</span>
            </>
          )}
        </NavLink>
      </div>
    </GlassPanel>
  );
}

