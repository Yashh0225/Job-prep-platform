import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router';

const menuItems = [
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/analyze', icon: '🔍', label: 'Resume Analyzer' },
  { path: '/roadmap', icon: '🗺️', label: 'Roadmap' },
  { path: '/mock-setup', icon: '🎤', label: 'Mock Interview' },
  { path: '/history', icon: '📋', label: 'History' },
];

const Sidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (isCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
    
    // Cleanup on unmount
    return () => document.body.classList.remove('sidebar-collapsed');
  }, [isCollapsed]);

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      height: 'calc(100vh - var(--navbar-height))',
      position: 'fixed',
      top: 'var(--navbar-height)',
      left: 0,
      borderRight: '1px solid var(--border-glass)',
      background: 'rgba(6, 6, 15, 0.6)',
      backdropFilter: 'blur(20px)',
      padding: '24px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      zIndex: 50,
      transition: 'width var(--transition)',
    }}>
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="btn btn-ghost"
        style={{ 
          alignSelf: isCollapsed ? 'center' : 'flex-end', 
          padding: '8px', 
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '36px',
          height: '36px',
        }}
        title={isCollapsed ? "Expand" : "Collapse"}
      >
        {isCollapsed ? '»' : '«'}
      </button>

      {menuItems.map(item => {
        const isActive = location.pathname === item.path || 
          (item.path === '/mock-setup' && location.pathname.startsWith('/mock'));

        return (
          <NavLink
            key={item.path}
            to={item.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: isCollapsed ? '0' : '12px',
              padding: isCollapsed ? '12px 0' : '12px 16px',
              borderRadius: 'var(--radius)',
              fontSize: '14px',
              fontWeight: isActive ? '600' : '400',
              color: isActive ? 'white' : 'var(--text-secondary)',
              background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
              transition: 'all var(--transition)',
              textDecoration: 'none',
              overflow: 'hidden',
              whiteSpace: 'nowrap'
            }}
            title={isCollapsed ? item.label : undefined}
          >
            <span style={{ fontSize: '18px', display: 'flex', justifyContent: 'center', minWidth: isCollapsed ? 'auto' : '24px' }}>
              {item.icon}
            </span>
            {!isCollapsed && <span>{item.label}</span>}
          </NavLink>
        );
      })}
    </aside>
  );
};

export default Sidebar;
