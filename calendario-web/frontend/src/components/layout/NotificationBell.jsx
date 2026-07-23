import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui/index.js';
import { api } from '../../services/api.js';

function reminderLabel(diffDays) {
  if (diffDays === 0) return 'é hoje';
  return `é em ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
}

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [reminders, setReminders] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUnreadCount() {
      try {
        const data = await api.getUnreadNotificationCount();
        if (!cancelled) setUnreadCount(data.count);
      } catch {
        if (!cancelled) setUnreadCount(0);
      }
    }

    async function loadReminders() {
      try {
        const data = await api.getUpcomingReminders();
        if (!cancelled) setReminders(data);
      } catch {
        if (!cancelled) setReminders([]);
      }
    }

    loadUnreadCount();
    loadReminders();
    const unreadIntervalId = setInterval(loadUnreadCount, 60 * 1000);
    const remindersIntervalId = setInterval(loadReminders, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(unreadIntervalId);
      clearInterval(remindersIntervalId);
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

  async function handleToggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) {
      try {
        const data = await api.getNotifications(20);
        setNotifications(data);
      } catch {
        setNotifications([]);
      }
    }
  }

  async function handleNotificationClick(notification) {
    setOpen(false);
    if (!notification.read) {
      setUnreadCount((count) => Math.max(0, count - 1));
      api.markNotificationRead(notification._id).catch(() => {});
    }
    if (notification.link) navigate(notification.link);
  }

  async function handleMarkAllRead() {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.markAllNotificationsRead();
    } catch {
      /* badge já foi zerado otimisticamente; próxima carga corrige se falhar */
    }
  }

  const totalBadgeCount = unreadCount + reminders.length;

  return (
    <div className="notification-bell-wrapper" ref={containerRef}>
      <button
        type="button"
        className="notification-bell"
        title="Notificações"
        aria-label="Notificações"
        onClick={handleToggleOpen}
      >
        <Icon name="bell" />
        {totalBadgeCount > 0 && <span className="notification-bell-badge">{totalBadgeCount}</span>}
      </button>

      {open && (
        <div className="global-search-results notification-bell-panel">
          {notifications.length === 0 && reminders.length === 0 && (
            <p className="global-search-empty">Nenhuma notificação</p>
          )}

          {unreadCount > 0 && (
            <button type="button" className="global-search-result notification-bell-mark-all" onClick={handleMarkAllRead}>
              <span>Marcar todas como lidas</span>
            </button>
          )}

          {notifications.map((notification) => (
            <button
              key={notification._id}
              type="button"
              className={`global-search-result${notification.read ? '' : ' is-unread'}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <span>{notification.body}</span>
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
