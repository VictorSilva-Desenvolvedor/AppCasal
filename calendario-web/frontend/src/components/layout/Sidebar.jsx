import { Link, useLocation } from 'react-router-dom';
import { Icon, Button } from '../ui/index.js';
import { SidebarNavItem } from './SidebarNavItem.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { UpcomingEventsList } from '../../features/calendar/UpcomingEventsList.jsx';
import { personColorFor, personTextColorFor } from '../../features/calendar/calendarUtils.js';
import { getAppSection } from './appSections.js';
import { APP_MODULES } from '../../constants/appModules.js';

function initialsOf(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function Sidebar({ collapsed, mobileOpen, onCloseMobile, onQuickNewEvent }) {
  const { user, logout } = useAuth();
  const { users } = useCalendarData();
  const location = useLocation();
  const section = getAppSection(location.pathname);
  const isCalendarSection = section === 'calendario';

  const className = [
    'sidebar',
    collapsed && 'is-collapsed',
    mobileOpen && 'is-mobile-open',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <aside className={className}>
      <div className="sidebar-header">
        <Link to="/app" className="sidebar-title" title="Voltar para a tela inicial">
          <Icon name="heart" />
          AppCasal
        </Link>
        <div className="sidebar-user-row">
          <div
            className="sidebar-avatar"
            style={
              user && users.length
                ? {
                    background: personColorFor(users, user._id),
                    color: personTextColorFor(users, user._id),
                  }
                : undefined
            }
          >
            {user ? initialsOf(user.name) : ''}
          </div>
          <div className="sidebar-user">{user ? `Olá, ${user.name}` : ''}</div>
        </div>
      </div>

      <div className="sidebar-scroll">
        <nav className="sidebar-nav" aria-label="Módulos do aplicativo">
          {APP_MODULES.map((item) => (
            <SidebarNavItem key={item.to} to={item.to} icon={item.icon} onClick={onCloseMobile}>
              {item.label}
            </SidebarNavItem>
          ))}
        </nav>

        {isCalendarSection && (
          <div className="sidebar-section">
            <h3>Atalhos</h3>
            <Button block onClick={onQuickNewEvent}>
              <Icon name="plus" />
              Novo evento
            </Button>
          </div>
        )}

        {isCalendarSection && (
          <div className="sidebar-section">
            <h3>Próximos eventos</h3>
            <UpcomingEventsList />
          </div>
        )}
      </div>

      <Button variant="secondary" block onClick={logout}>
        Sair
      </Button>
    </aside>
  );
}
