import { Button } from '../../components/ui/index.js';

const INVITE_STATUS_LABELS = { pending: 'Pendente', accepted: 'Aceito', declined: 'Recusado' };

export function InviteCard({ invitation, direction, pending, onAccept, onDecline, onCancel }) {
  const otherUser = direction === 'received' ? invitation.inviter : invitation.invitee;
  const dateLabel = invitation.event ? new Date(invitation.event.date).toLocaleDateString('pt-BR') : '';
  const statusLabel = INVITE_STATUS_LABELS[invitation.status];

  return (
    <div className="update-card">
      <div className="update-card-title">{invitation.event?.title || 'Evento removido'}</div>
      <div className="update-card-description">
        {dateLabel} · {direction === 'received' ? 'De' : 'Para'} {otherUser?.name || 'desconhecido'}
      </div>
      <div className="update-card-footer">
        <span className="update-card-meta">{statusLabel}</span>
        <div className="update-card-actions">
          {invitation.status === 'pending' && direction === 'received' && (
            <>
              <Button loading={pending} onClick={() => onAccept(invitation._id)}>
                Aceitar
              </Button>
              <Button variant="danger" loading={pending} onClick={() => onDecline(invitation._id)}>
                Recusar
              </Button>
            </>
          )}
          {invitation.status === 'pending' && direction === 'sent' && (
            <Button variant="secondary" loading={pending} onClick={() => onCancel(invitation._id)}>
              Cancelar
            </Button>
          )}
          {invitation.status !== 'pending' && <span className="badge">{statusLabel}</span>}
        </div>
      </div>
    </div>
  );
}
