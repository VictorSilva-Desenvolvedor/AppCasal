import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui/index.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';

export function NotificationBell() {
  const { user } = useAuth();
  const { invitations } = useCalendarData();
  const navigate = useNavigate();

  const pendingCount = invitations.filter(
    (inv) => inv.status === 'pending' && inv.invitee?._id === user?._id,
  ).length;

  return (
    <button
      type="button"
      className="notification-bell"
      title="Convites pendentes"
      aria-label="Convites pendentes"
      onClick={() => navigate('/app/convites')}
    >
      <Icon name="bell" />
      {pendingCount > 0 && <span className="notification-bell-badge">{pendingCount}</span>}
    </button>
  );
}
