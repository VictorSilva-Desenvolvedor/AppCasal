import { Link } from 'react-router-dom';
import { Icon, Button } from '../ui/index.js';
import { SidebarNavItem } from './SidebarNavItem.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useTheme } from '../../hooks/useTheme.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { UpcomingEventsList } from '../../features/calendar/UpcomingEventsList.jsx';
import { personColorFor } from '../../features/calendar/calendarUtils.js';

const NAV_ITEMS = [
  { to: '/app/calendario', icon: 'calendar', label: 'Calendário' },
  { to: '/app/galeria', icon: 'image', label: 'Galeria' },
  { to: '/app/atividades', icon: 'clock', label: 'Atividades' },
  { to: '/app/atualizacoes', icon: 'tool', label: 'Atualizações' },
  { to: '/app/convites', icon: 'user-plus', label: 'Convites' },
  { to: '/app/configuracoes', icon: 'settings', label: 'Configurações' },
];

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
  const { theme, toggleTheme } = useTheme();
  const { users } = useCalendarData();

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
          Nosso Calendário
        </Link>
        <div className="sidebar-user-row">
          <div
            className="sidebar-avatar"
            style={user && users.length ? { background: personColorFor(users, user._id) } : undefined}
          >
            {user ? initialsOf(user.name) : ''}
          </div>
          <div className="sidebar-user">{user ? `Olá, ${user.name}` : ''}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem key={item.to} to={item.to} icon={item.icon} onClick={onCloseMobile}>
            {item.label}
          </SidebarNavItem>
        ))}
      </nav>

      <div className="sidebar-section">
        <h3>Atalhos</h3>
        <Button block onClick={onQuickNewEvent}>
          <Icon name="plus" />
          Novo evento
        </Button>
        <Button variant="secondary" block onClick={toggleTheme}>
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          Alternar tema
        </Button>
      </div>

      <div className="sidebar-section">
        <h3>Próximos eventos</h3>
        <UpcomingEventsList />
      </div>

      <Button variant="secondary" block onClick={logout}>
        Sair
      </Button>
    </aside>
  );
}
