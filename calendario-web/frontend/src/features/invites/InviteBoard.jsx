import { InviteCard } from './InviteCard.jsx';

export function InviteBoard({ received, sent, onAccept, onDecline, onCancel }) {
  return (
    <div className="update-board">
      <div className="update-column">
        <h3>
          Recebidos <span className="update-column-count">{received.length}</span>
        </h3>
        <div className="update-column-list">
          {received.length === 0 ? (
            <p className="update-empty">Nenhum convite recebido</p>
          ) : (
            received.map((inv) => (
              <InviteCard
                key={inv._id}
                invitation={inv}
                direction="received"
                onAccept={onAccept}
                onDecline={onDecline}
              />
            ))
          )}
        </div>
      </div>
      <div className="update-column">
        <h3>
          Enviados <span className="update-column-count">{sent.length}</span>
        </h3>
        <div className="update-column-list">
          {sent.length === 0 ? (
            <p className="update-empty">Nenhum convite enviado</p>
          ) : (
            sent.map((inv) => <InviteCard key={inv._id} invitation={inv} direction="sent" onCancel={onCancel} />)
          )}
        </div>
      </div>
    </div>
  );
}
