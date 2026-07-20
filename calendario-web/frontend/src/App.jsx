import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ProtectedRoute } from './components/layout/ProtectedRoute.jsx';
import { PublicOnlyRoute } from './components/layout/PublicOnlyRoute.jsx';
import { AppShell } from './components/layout/AppShell.jsx';
import { LobbyPage } from './features/lobby/LobbyPage.jsx';
import { LoginPage } from './features/auth/LoginPage.jsx';
import { RegisterPage } from './features/auth/RegisterPage.jsx';
import { CalendarPage } from './features/calendar/CalendarPage.jsx';
import { GalleryPage } from './features/gallery/GalleryPage.jsx';
import { ActivityPage } from './features/activity/ActivityPage.jsx';
import { UpdatesPage } from './features/updates/UpdatesPage.jsx';
import { InvitesPage } from './features/invites/InvitesPage.jsx';
import { SettingsPage } from './features/settings/SettingsPage.jsx';
import { useAuth } from './hooks/useAuth.js';

function RootRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? '/app' : '/login'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ThemeProvider>
          <Routes>
            <Route path="/" element={<RootRedirect />} />

            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/app" element={<LobbyPage />} />
              <Route element={<AppShell />}>
                <Route path="/app/calendario" element={<CalendarPage />} />
                <Route path="/app/galeria" element={<GalleryPage />} />
                <Route path="/app/atividades" element={<ActivityPage />} />
                <Route path="/app/atualizacoes" element={<UpdatesPage />} />
                <Route path="/app/convites" element={<InvitesPage />} />
                <Route path="/app/configuracoes" element={<SettingsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </ThemeProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
