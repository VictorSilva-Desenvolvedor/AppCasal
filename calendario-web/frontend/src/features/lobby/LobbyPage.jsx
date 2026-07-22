import { useNavigate } from 'react-router-dom';
import { Button, Icon } from '../../components/ui/index.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useTheme } from '../../hooks/useTheme.js';

const LOBBY_APPS = [
  { to: '/app/calendario', icon: 'calendar', label: 'Calendário' },
  { to: '/app/financeiro', icon: 'wallet', label: 'Financeiro' },
  { to: '/app/emocoes', icon: 'smile', label: 'Emoções do Dia' },
  { to: '/app/galeria', icon: 'image', label: 'Galeria' },
  { to: '/app/atividades', icon: 'clock', label: 'Atividades' },
  { to: '/app/atualizacoes', icon: 'tool', label: 'Atualizações' },
  { to: '/app/configuracoes', icon: 'settings', label: 'Configurações' },
];

export function LobbyPage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="lobby-page">
      <header className="lobby-header">
        <div className="lobby-greeting">{user ? `Olá, ${user.name}` : ''}</div>
        <div className="lobby-header-actions">
          <button
            type="button"
            className="icon-btn lobby-icon-btn"
            title="Alternar tema"
            aria-label="Alternar tema"
            onClick={toggleTheme}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          <Button variant="secondary" onClick={logout}>
            Sair
          </Button>
        </div>
      </header>

      <div className="lobby-grid">
        {LOBBY_APPS.map((app) => (
          <button
            key={app.to}
            type="button"
            className="lobby-app-tile"
            onClick={() => navigate(app.to)}
          >
            <span className="lobby-app-icon">
              <Icon name={app.icon} />
            </span>
            <span className="lobby-app-label">{app.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
