import { createContext, useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';

export const CalendarDataContext = createContext(null);

// Provido uma vez em AppShell (não por rota) para que tanto a sidebar (lista de
// "próximos eventos", visível em qualquer view) quanto as páginas de calendário/
// galeria compartilhem os mesmos dados sem refetch duplicado.
const DEFAULT_FILTERS = { search: '', creatorId: '', category: '', onlyWithAttachment: false };

export function CalendarDataProvider({ children }) {
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const refetchEvents = useCallback(async () => {
    const data = await api.getEvents();
    setEvents(data);
    return data;
  }, []);

  const refetchUsers = useCallback(async () => {
    const data = await api.getUsers();
    setUsers(data);
    return data;
  }, []);

  const refetchInvitations = useCallback(async () => {
    const data = await api.getInvitations();
    setInvitations(data);
    return data;
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([api.getEvents(), api.getUsers(), api.getInvitations()])
      .then(([eventsData, usersData, invitationsData]) => {
        if (cancelled) return;
        setEvents(eventsData);
        setUsers(usersData);
        setInvitations(invitationsData);
      })
      // Sem catch a falha virava rejeição não tratada; a tela carrega vazia e
      // cada seção já mostra o próprio estado de erro ao recarregar.
      .catch((err) => console.error('Falha ao carregar dados do calendário:', err.message))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = {
    events,
    users,
    invitations,
    loading,
    filters,
    setFilters,
    refetchEvents,
    refetchUsers,
    refetchInvitations,
  };

  return <CalendarDataContext.Provider value={value}>{children}</CalendarDataContext.Provider>;
}
