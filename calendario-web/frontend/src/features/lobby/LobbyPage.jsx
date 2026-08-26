import { Link } from 'react-router-dom';
import { Button, Icon, IconButton } from '../../components/ui/index.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useTheme } from '../../hooks/useTheme.js';
import { APP_MODULES } from '../../constants/appModules.js';

export function LobbyPage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === 'dark';

  return (
    <div className="lobby-page">
      <header className="lobby-header">
        <h1 className="lobby-greeting">{user ? `Olá, ${user.name}` : ''}</h1>
        <div className="lobby-header-actions">
          <IconButton
            className="lobby-icon-btn"
            title={isDark ? 'Usar tema claro' : 'Usar tema escuro'}
            aria-label={isDark ? 'Usar tema claro' : 'Usar tema escuro'}
            onClick={toggleTheme}
          >
            <Icon name={isDark ? 'sun' : 'moon'} />
          </IconButton>
          <Button variant="secondary" onClick={logout}>
            Sair
          </Button>
        </div>
      </header>

      <nav className="lobby-grid" aria-label="Seções do aplicativo">
        {APP_MODULES.map((app) => (
          <Link key={app.to} to={app.to} className="lobby-app-tile">
            <span className="lobby-app-icon">
              <Icon name={app.icon} />
            </span>
            <span className="lobby-app-label">{app.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
