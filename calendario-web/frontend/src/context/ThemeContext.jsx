import { createContext, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../hooks/useAuth.js';

export const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [theme, setTheme] = useState('light');
  const [colorTheme, setColorThemeState] = useState('indigo');
  const [background, setBackground] = useState('');
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(false);
  const [notificationChannel, setNotificationChannelState] = useState('both');
  const [remindersMuted, setRemindersMutedState] = useState(false);
  const [notifyOnInvite, setNotifyOnInviteState] = useState(true);
  const [hidePastEventsByDefault, setHidePastEventsByDefaultState] = useState(false);
  const [financeDefaultScope, setFinanceDefaultScopeState] = useState('self');
  const [activityLogLimit, setActivityLogLimitState] = useState(200);

  // Fora da área autenticada (login/registro) o app legado nunca aplica tema
  // salvo — sempre indigo/claro. Só carregamos as configurações reais depois
  // do login, e voltamos ao padrão ao deslogar (sem isso, o tema "vazaria"
  // para a tela de login já que é uma SPA sem reload de página).
  useEffect(() => {
    if (!isAuthenticated) {
      setTheme('light');
      setColorThemeState('indigo');
      setSidebarCollapsedState(false);
      return;
    }

    api
      .getSettings()
      .then((settings) => {
        setTheme(settings.theme || 'light');
        setColorThemeState(settings.colorTheme || 'indigo');
        setBackground(settings.background || '');
        setSidebarCollapsedState(settings.sidebarCollapsed || false);
        setNotificationChannelState(settings.notificationChannel || 'both');
        setRemindersMutedState(settings.remindersMuted || false);
        setNotifyOnInviteState(settings.notifyOnInvite !== false);
        setHidePastEventsByDefaultState(settings.hidePastEventsByDefault || false);
        setFinanceDefaultScopeState(settings.financeDefaultScope || 'self');
        setActivityLogLimitState(settings.activityLogLimit || 200);
      })
      .catch((err) => console.error('Não foi possível carregar as configurações:', err.message));
  }, [isAuthenticated]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-color-theme', colorTheme);
  }, [colorTheme]);

  async function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    try {
      await api.updateSettings({ theme: next });
    } catch (err) {
      console.error('Não foi possível salvar o tema:', err.message);
    }
  }

  async function setColorTheme(name) {
    setColorThemeState(name);
    await api.updateSettings({ colorTheme: name });
  }

  async function saveThemeAndBackground(nextTheme, nextBackground) {
    const settings = await api.updateSettings({ theme: nextTheme, background: nextBackground });
    setTheme(settings.theme);
    setBackground(settings.background || '');
    return settings;
  }

  async function setSidebarCollapsed(value) {
    setSidebarCollapsedState(value);
    try {
      await api.updateSettings({ sidebarCollapsed: value });
    } catch (err) {
      console.error('Não foi possível salvar a preferência da barra lateral:', err.message);
    }
  }

  async function updatePreferences(partial) {
    const settings = await api.updateSettings(partial);
    if (partial.notificationChannel !== undefined) setNotificationChannelState(settings.notificationChannel);
    if (partial.remindersMuted !== undefined) setRemindersMutedState(settings.remindersMuted);
    if (partial.notifyOnInvite !== undefined) setNotifyOnInviteState(settings.notifyOnInvite);
    if (partial.hidePastEventsByDefault !== undefined) setHidePastEventsByDefaultState(settings.hidePastEventsByDefault);
    if (partial.financeDefaultScope !== undefined) setFinanceDefaultScopeState(settings.financeDefaultScope);
    if (partial.activityLogLimit !== undefined) setActivityLogLimitState(settings.activityLogLimit);
    return settings;
  }

  const value = {
    theme,
    setTheme,
    colorTheme,
    setColorTheme,
    toggleTheme,
    background,
    saveThemeAndBackground,
    sidebarCollapsed,
    setSidebarCollapsed,
    notificationChannel,
    remindersMuted,
    notifyOnInvite,
    hidePastEventsByDefault,
    financeDefaultScope,
    activityLogLimit,
    updatePreferences,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
