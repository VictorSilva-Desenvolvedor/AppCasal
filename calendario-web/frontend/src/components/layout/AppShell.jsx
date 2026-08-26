import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';
import { useMediaQuery } from '../../hooks/useMediaQuery.js';
import { useTheme } from '../../hooks/useTheme.js';
import { useFcmRegistration } from '../../hooks/useFcmRegistration.js';
import { useHardwareBackButton } from '../../hooks/useHardwareBackButton.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { CalendarDataProvider } from '../../context/CalendarDataContext.jsx';
import { HeartLoader } from '../ui/HeartLoader.jsx';
import { getAppSection } from './appSections.js';

const MOBILE_QUERY = '(max-width: 768px)';

// A URL vai direto para dentro de `url("...")` num style inline, então só
// aceitamos endereços http(s)/data sem aspas, parênteses ou espaços — assim
// nada consegue "escapar" do valor e injetar outras declarações CSS.
const SAFE_BACKGROUND_URL = /^(https?:\/\/|data:image\/)[^"'()\\\s]+$/i;

function toCssBackgroundImage(url) {
  const value = (url || '').trim();
  return SAFE_BACKGROUND_URL.test(value) ? `url("${value}")` : null;
}

function AppMainContent() {
  const { loading } = useCalendarData();
  return loading ? <HeartLoader label="Carregando seus dados..." /> : <Outlet />;
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const { sidebarCollapsed: collapsed, setSidebarCollapsed: setCollapsed, background } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  useFcmRegistration();
  useHardwareBackButton();

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
    !['financeiro', 'atualizacoes', 'resumo', 'veiculos'].includes(getAppSection(location.pathname)) &&
    !location.pathname.startsWith('/app/atividades');

  function handleQuickNewEvent() {
    navigate('/app/calendario', { state: { quickNewEvent: true } });
  }

  const backgroundImage = toCssBackgroundImage(background);

  return (
    <CalendarDataProvider>
      <div
        className={`app-shell${backgroundImage ? ' has-custom-background' : ''}`}
        style={backgroundImage ? { '--app-background-image': backgroundImage } : undefined}
      >
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
          <AppMainContent />
        </main>
      </div>
    </CalendarDataProvider>
  );
}
