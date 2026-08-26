import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { useToast } from '../../hooks/useToast.js';
import { usePendingIds } from '../../hooks/usePendingIds.js';
import { api } from '../../services/api.js';
import { ConfirmDialog, HeartLoader } from '../../components/ui/index.js';
import { InviteBoard } from './InviteBoard.jsx';

export function InvitesPage() {
  const { user } = useAuth();
  const { invitations, loading, refetchInvitations } = useCalendarData();
  const { showToast } = useToast();
  const { isPending, run } = usePendingIds();
  const [confirmInvite, setConfirmInvite] = useState(null);

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

  async function handleConfirmCancel() {
    const id = confirmInvite._id;
    setConfirmInvite(null);
    try {
      await run(id, () => api.cancelInvitation(id));
      await refetchInvitations();
      showToast('Convite cancelado', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  if (loading) {
    return (
      <section className="view">
        <HeartLoader />
      </section>
    );
  }

  return (
    <section className="view">
      <h2>Convites</h2>
      <p>
        Convites para eventos compartilhados entre você e outra pessoa. Para enviar um novo, abra o
        evento no calendário e convide por lá.
      </p>
      <InviteBoard
        received={received}
        sent={sent}
        isPending={isPending}
        onAccept={(id) => handleRespond(id, 'accepted')}
        onDecline={(id) => handleRespond(id, 'declined')}
        onCancel={setConfirmInvite}
      />

      <ConfirmDialog
        open={Boolean(confirmInvite)}
        title="Cancelar convite"
        message={
          confirmInvite
            ? `O convite de "${confirmInvite.event?.title || 'evento removido'}" para ${
                confirmInvite.invitee?.name || 'a outra pessoa'
              } será removido.`
            : ''
        }
        confirmLabel="Cancelar convite"
        cancelLabel="Voltar"
        onCancel={() => setConfirmInvite(null)}
        onConfirm={handleConfirmCancel}
      />
    </section>
  );
}
