import { useAuth } from '../../hooks/useAuth.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { useToast } from '../../hooks/useToast.js';
import { usePendingIds } from '../../hooks/usePendingIds.js';
import { api } from '../../services/api.js';
import { InviteBoard } from './InviteBoard.jsx';

export function InvitesPage() {
  const { user } = useAuth();
  const { invitations, refetchInvitations } = useCalendarData();
  const { showToast } = useToast();
  const { isPending, run } = usePendingIds();

  const received = invitations.filter((inv) => inv.invitee?._id === user?._id);
  const sent = invitations.filter((inv) => inv.inviter?._id === user?._id);

  async function handleRespond(id, status) {
    try {
      await run(id, () => api.respondInvitation(id, status));
      await refetchInvitations();
      showToast(status === 'accepted' ? 'Convite aceito' : 'Convite recusado', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleCancel(id) {
    if (!window.confirm('Cancelar este convite?')) return;
    try {
      await run(id, () => api.cancelInvitation(id));
      await refetchInvitations();
      showToast('Convite cancelado', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <section className="view">
      <h2>Convites</h2>
      <p>Convites para eventos compartilhados entre você e outra pessoa.</p>
      <InviteBoard
        received={received}
        sent={sent}
        isPending={isPending}
        onAccept={(id) => handleRespond(id, 'accepted')}
        onDecline={(id) => handleRespond(id, 'declined')}
        onCancel={handleCancel}
      />
    </section>
  );
}
