import { useState } from 'react';
import { Button, Icon } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';

const INVITE_STATUS_LABELS = { pending: 'Pendente', accepted: 'Aceito', declined: 'Recusado' };

export function InviteSection({ event, users, invitations, currentUserId, onInvitationsChanged }) {
  const [inviteeId, setInviteeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const isCreator = Boolean(event) && event.creator?._id === currentUserId;
  if (!isCreator) return null;

  const invitedIds = new Set(
    invitations
      .filter((inv) => inv.event?._id === event._id && inv.status !== 'declined')
      .map((inv) => inv.invitee?._id),
  );
  const invitable = users.filter((user) => user._id !== event.creator?._id && !invitedIds.has(user._id));
  const eventInvites = invitations.filter((inv) => inv.event?._id === event._id);
  const effectiveInviteeId = inviteeId || invitable[0]?._id || '';

  async function handleInvite() {
    setError('');
    if (!effectiveInviteeId) return;

    setLoading(true);
    try {
      await api.createInvitation({ eventId: event._id, inviteeId: effectiveInviteeId });
      await onInvitationsChanged();
      showToast('Convite enviado', 'success');
      setInviteeId('');
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(id) {
    if (!window.confirm('Cancelar este convite?')) return;
    try {
      await api.cancelInvitation(id);
      await onInvitationsChanged();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <div className="field">
      <label htmlFor="event-invite-select">Convidar para este evento</label>
      <div className="event-invite-row">
        <select
          id="event-invite-select"
          value={effectiveInviteeId}
          onChange={(event) => setInviteeId(event.target.value)}
        >
          {invitable.length === 0 ? (
            <option value="">Ninguém disponível para convidar</option>
          ) : (
            invitable.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name}
              </option>
            ))
          )}
        </select>
        <Button
          type="button"
          variant="secondary"
          loading={loading}
          disabled={invitable.length === 0}
          onClick={handleInvite}
        >
          <Icon name="user-plus" />
          Convidar
        </Button>
      </div>
      <p className="error-text">{error}</p>
      <div className="event-invite-list">
        {eventInvites.map((inv) => (
          <div className="event-invite-item" key={inv._id}>
            <span>
              {inv.invitee?.name || 'desconhecido'} · {INVITE_STATUS_LABELS[inv.status]}
            </span>
            {inv.status === 'pending' && (
              <button
                type="button"
                className="update-card-delete"
                title="Cancelar"
                aria-label="Cancelar convite"
                onClick={() => handleCancel(inv._id)}
              >
                <Icon name="trash" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
