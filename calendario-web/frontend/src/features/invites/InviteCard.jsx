import { Button } from '../../components/ui/index.js';
import { formatDateOnly } from '../calendar/calendarUtils.js';

const INVITE_STATUS_LABELS = { pending: 'Pendente', accepted: 'Aceito', declined: 'Recusado' };

export function InviteCard({ invitation, direction, pending, onAccept, onDecline, onCancel }) {
  const otherUser = direction === 'received' ? invitation.inviter : invitation.invitee;
  const dateLabel = invitation.event ? formatDateOnly(invitation.event.date) : '';
  const personLabel = `${direction === 'received' ? 'De' : 'Para'} ${otherUser?.name || 'usuário desconhecido'}`;
  const statusLabel = INVITE_STATUS_LABELS[invitation.status];
  const isPendingStatus = invitation.status === 'pending';

  return (
    <div className="update-card invite-card" data-status={invitation.status}>
      <div className="update-card-title">{invitation.event?.title || 'Evento removido'}</div>
      <div className="update-card-description">{[dateLabel, personLabel].filter(Boolean).join(' · ')}</div>
      <div className="update-card-footer">
        <span className="update-card-meta">{statusLabel}</span>
        {isPendingStatus && (
          <div className="update-card-actions">
            {direction === 'received' ? (
              <>
                <Button loading={pending} onClick={() => onAccept(invitation._id)}>
                  Aceitar
                </Button>
                <Button variant="secondary" loading={pending} onClick={() => onDecline(invitation._id)}>
                  Recusar
                </Button>
              </>
            ) : (
              <Button variant="secondary" loading={pending} onClick={() => onCancel(invitation)}>
                Cancelar
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
