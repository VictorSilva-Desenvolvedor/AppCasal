import { createContext, useCallback, useState } from 'react';
import { api } from '../services/api.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => api.getCurrentUser());

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
    login,
    register,
    logout,
    updateCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
