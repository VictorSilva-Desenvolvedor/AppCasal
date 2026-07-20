import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';
import { useMediaQuery } from '../../hooks/useMediaQuery.js';
import { CalendarDataProvider } from '../../context/CalendarDataContext.jsx';
import { getAppSection } from './appSections.js';

const SIDEBAR_COLLAPSED_KEY = 'calendario_sidebar_collapsed';
const MOBILE_QUERY = '(max-width: 768px)';

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1',
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  function handleToggleSidebar() {
    if (isMobile) setMobileOpen((open) => !open);
    else setCollapsed((value) => !value);
  }

  const showFilterBar = location.pathname.startsWith('/app/calendario');
  const showSidebar = getAppSection(location.pathname) !== 'financeiro';

  function handleQuickNewEvent() {
    navigate('/app/calendario', { state: { quickNewEvent: true } });
  }

  return (
    <CalendarDataProvider>
      <div className="app-shell">
        {showSidebar && (
          <>
            <Sidebar
              collapsed={collapsed}
              mobileOpen={mobileOpen}
              onCloseMobile={() => setMobileOpen(false)}
              onQuickNewEvent={handleQuickNewEvent}
            />
            <div
              className={`sidebar-backdrop${mobileOpen ? ' is-visible' : ''}`}
              onClick={() => setMobileOpen(false)}
            />
          </>
        )}

        <main className="main-content">
          <Topbar
            onToggleSidebar={handleToggleSidebar}
            showFilterBar={showFilterBar}
            showSidebarToggle={showSidebar}
          />
          <Outlet />
        </main>
      </div>
    </CalendarDataProvider>
  );
}
