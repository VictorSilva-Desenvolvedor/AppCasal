import { createContext, useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { api } from '../services/api.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => api.getCurrentUser());
  // No mobile empacotado, o localStorage pode ter sido despejado pelo
  // WebView desde a última abertura — enquanto isso, não deixamos as rotas
  // decidirem "não autenticado" ainda (ver ProtectedRoute/PublicOnlyRoute).
  const [loading, setLoading] = useState(() => Capacitor.isNativePlatform());

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    api
      .bootstrapSession()
      .then(() => setUser(api.getCurrentUser()))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async ({ name, password }) => {
    const data = await api.login({ name, password });
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async ({ name, password }) => {
    const data = await api.register({ name, password });
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
  }, []);

  const updateCurrentUser = useCallback((patch) => {
    const updated = api.updateCurrentUser(patch);
    setUser(updated);
    return updated;
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user && api.getToken()),
    loading,
    login,
    register,
    logout,
    updateCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
