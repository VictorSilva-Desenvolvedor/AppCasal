import { Button, Card, Icon, IconButton, Pill } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';
import { usePendingIds } from '../../hooks/usePendingIds.js';
import { formatCurrency, formatDate, paymentDueInfo, categoryLabel, PAYMENT_CATEGORIES } from './vehicleUtils.js';

export function VehiclePaymentsTab({ payments, onChanged, onAdd, onEdit }) {
  const { showToast } = useToast();
  const { isPending, run } = usePendingIds();

  const pendentes = payments
    .filter((item) => item.status === 'pendente')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const pagos = payments
    .filter((item) => item.status === 'pago')
    .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));

  const totalPendente = pendentes.reduce((sum, item) => sum + item.amount, 0);
  const totalPago = pagos.reduce((sum, item) => sum + item.amount, 0);

  async function handlePay(item) {
    try {
      await run(item._id, () => api.payVehiclePayment(item._id));
      await onChanged();
      showToast('Marcado como pago', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleDelete(item) {
    try {
      await run(item._id, () => api.deleteVehiclePayment(item._id));
      await onChanged();
      showToast('Pagamento removido', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <div className="vehicle-payments-tab">
      <div className="vehicle-payments-summary">
        <Card className="vehicle-payments-summary-card vehicle-payments-summary-card--pending">
          <span className="vehicle-label-caps">Total a pagar</span>
          <strong>{formatCurrency(totalPendente)}</strong>
        </Card>
        <Card className="vehicle-payments-summary-card vehicle-payments-summary-card--paid">
          <span className="vehicle-label-caps">Total pago</span>
          <strong>{formatCurrency(totalPago)}</strong>
        </Card>
      </div>

      <div className="vehicle-section-header">
        <h3>Pendentes</h3>
        <Button variant="primary" onClick={onAdd}>
          <Icon name="plus" /> Adicionar
        </Button>
      </div>

      {pendentes.length === 0 ? (
        <p className="sidebar-empty">Nenhum pagamento pendente 🎉</p>
      ) : (
        <div className="vehicle-payments-list">
          {pendentes.map((item) => {
            const due = paymentDueInfo(item);
            return (
              <Card key={item._id} className={`vehicle-payment-item${due.urgent ? ' is-urgent' : ''}`}>
                <div className="vehicle-payment-item-main">
                  <span className="vehicle-payment-icon">
                    <Icon name="wallet" />
                  </span>
                  <div>
                    <strong>{item.description}</strong>
                    <span className="vehicle-payment-meta">
                      {categoryLabel(PAYMENT_CATEGORIES, item.category)} · {due.label}
                    </span>
                  </div>
                </div>
                <div className="vehicle-payment-item-side">
                  <strong className="vehicle-value--negative">{formatCurrency(item.amount)}</strong>
                  <IconButton title="Editar" aria-label="Editar" onClick={() => onEdit(item)}>
                    <Icon name="edit" />
                  </IconButton>
                  <IconButton
                    title="Remover"
                    aria-label="Remover"
                    loading={isPending(item._id)}
                    onClick={() => handleDelete(item)}
                  >
                    <Icon name="trash" />
                  </IconButton>
                  <Button variant="primary" loading={isPending(item._id)} onClick={() => handlePay(item)}>
                    Pagar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <h3 className="vehicle-section-header">Pagos</h3>
      {pagos.length === 0 ? (
        <p className="sidebar-empty">Nenhum pagamento quitado ainda</p>
      ) : (
        <div className="vehicle-payments-list">
          {pagos.map((item) => (
            <Card key={item._id} className="vehicle-payment-item is-paid">
              <div className="vehicle-payment-item-main">
                <span className="vehicle-payment-icon vehicle-payment-icon--done">
                  <Icon name="check-circle" />
                </span>
                <div>
                  <strong>{item.description}</strong>
                  <span className="vehicle-payment-meta">Pago em {formatDate(item.paidAt)}</span>
                </div>
              </div>
              <Pill className="vehicle-cost-pill">{formatCurrency(item.amount)}</Pill>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
