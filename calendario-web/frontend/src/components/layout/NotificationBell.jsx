import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui/index.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { api } from '../../services/api.js';

function reminderLabel(diffDays) {
  if (diffDays === 0) return 'é hoje';
  return `é em ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
}

export function NotificationBell() {
  const { user } = useAuth();
  const { invitations } = useCalendarData();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [reminders, setReminders] = useState([]);
  const containerRef = useRef(null);

  const pendingInvitations = invitations.filter(
    (inv) => inv.status === 'pending' && inv.invitee?._id === user?._id,
  );

  useEffect(() => {
    let cancelled = false;

    async function loadReminders() {
      try {
        const data = await api.getUpcomingReminders();
        if (!cancelled) setReminders(data);
      } catch {
        if (!cancelled) setReminders([]);
      }
    }

    loadReminders();
    const intervalId = setInterval(loadReminders, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    function handleDocumentClick(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const totalCount = pendingInvitations.length + reminders.length;

  function handleInvitationClick() {
    setOpen(false);
    navigate('/app/convites');
  }

  return (
    <div className="notification-bell-wrapper" ref={containerRef}>
      <button
        type="button"
        className="notification-bell"
        title="Notificações"
        aria-label="Notificações"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Icon name="bell" />
        {totalCount > 0 && <span className="notification-bell-badge">{totalCount}</span>}
      </button>

      {open && (
        <div className="global-search-results notification-bell-panel">
          {totalCount === 0 && <p className="global-search-empty">Nenhuma notificação</p>}

          {pendingInvitations.map((inv) => (
            <button key={inv._id} type="button" className="global-search-result" onClick={handleInvitationClick}>
              <span>Convite pendente: {inv.event?.title}</span>
            </button>
          ))}

          {reminders.map((reminder) => (
            <div key={`${reminder.eventId}-${reminder.occurrenceDate}`} className="global-search-result">
              <span>
                🔔 "{reminder.title}" {reminderLabel(reminder.diffDays)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
