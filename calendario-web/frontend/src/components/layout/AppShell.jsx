import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';
import { useMediaQuery } from '../../hooks/useMediaQuery.js';
import { useTheme } from '../../hooks/useTheme.js';
import { useFcmRegistration } from '../../hooks/useFcmRegistration.js';
import { CalendarDataProvider } from '../../context/CalendarDataContext.jsx';
import { getAppSection } from './appSections.js';

const MOBILE_QUERY = '(max-width: 768px)';

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const { sidebarCollapsed: collapsed, setSidebarCollapsed: setCollapsed } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  useFcmRegistration();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  function handleToggleSidebar() {
    if (isMobile) setMobileOpen((open) => !open);
    else setCollapsed(!collapsed);
  }

  const showFilterBar = location.pathname.startsWith('/app/calendario');
  const showSidebar =
    !['financeiro', 'atualizacoes'].includes(getAppSection(location.pathname)) &&
    !location.pathname.startsWith('/app/atividades');

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
