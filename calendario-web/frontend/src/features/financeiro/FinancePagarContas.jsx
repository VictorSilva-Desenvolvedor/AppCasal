import { Button, Card, Icon, Pill } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';
import { usePendingIds } from '../../hooks/usePendingIds.js';
import { formatCurrency, dueInfo, paidOnDate, paymentStatus } from './financeUtils.js';

const STATUS_LABEL = { parcial: 'Pago parcial' };

export function FinancePagarContas({ entries, monthLocked, onChanged, hideFinanceValues }) {
  const { showToast } = useToast();
  const { isPending, run } = usePendingIds();

  const despesas = entries.filter((entry) => entry.type === 'despesa');
  const pendentes = despesas
    .filter((entry) => paymentStatus(entry) !== 'pago')
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const pagas = despesas
    .filter((entry) => paymentStatus(entry) === 'pago')
    .sort((a, b) => new Date(b.paidAt || b.updatedAt) - new Date(a.paidAt || a.updatedAt));

  const totalPago = despesas.reduce((sum, entry) => sum + entry.paidAmount, 0);
  const totalPendente = despesas.reduce((sum, entry) => sum + (entry.amount - entry.paidAmount), 0);
  const totalMes = totalPago + totalPendente;
  const pctPago = totalMes ? Math.round((totalPago / totalMes) * 100) : 0;
  const pctPendente = totalMes ? 100 - pctPago : 0;

  const totalGanhos = entries
    .filter((entry) => entry.type === 'receita')
    .reduce((sum, entry) => sum + entry.amount, 0);
  const sobraAposPagar = totalGanhos - totalPendente;
  const pctGanhosComprometidos = totalGanhos ? Math.min(100, (totalPendente / totalGanhos) * 100) : 0;

  async function handlePay(entry) {
    try {
      await run(entry._id, () => api.payFinanceEntry(entry._id, true));
      await onChanged();
      showToast('Marcado como pago', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <div className="finance-bills">
      <div className="finance-bills-summary">
        <Card className="finance-bills-summary-card finance-bills-summary-card--income">
          <span className="finance-summary-card-label">Ganhos do mês</span>
          <span className="finance-bills-summary-hint">Total de receitas recebidas</span>
          <strong className="finance-bills-summary-value finance-value--positive">
            {formatCurrency(totalGanhos, hideFinanceValues)}
          </strong>
          <div className="finance-category-bar-track">
            <div
              className="finance-category-bar-fill finance-value--negative-bg"
              style={{ width: `${pctGanhosComprometidos}%` }}
            />
          </div>
          <span className="finance-bills-summary-pct">
            {formatCurrency(totalPendente, hideFinanceValues)} será retirado pra pagar · sobra{' '}
            <span className={sobraAposPagar >= 0 ? 'finance-value--positive' : 'finance-value--negative'}>
              {formatCurrency(sobraAposPagar, hideFinanceValues)}
            </span>
          </span>
        </Card>

        <Card className="finance-bills-summary-card finance-bills-summary-card--pending">
          <span className="finance-summary-card-label">Total a pagar</span>
          <span className="finance-bills-summary-hint">Vencimentos neste mês</span>
          <strong className="finance-bills-summary-value finance-value--negative">
            {formatCurrency(totalPendente, hideFinanceValues)}
          </strong>
          <div className="finance-category-bar-track">
            <div className="finance-category-bar-fill finance-value--negative-bg" style={{ width: `${pctPendente}%` }} />
          </div>
          <span className="finance-bills-summary-pct">{pctPendente}% pendente</span>
        </Card>

        <Card className="finance-bills-summary-card finance-bills-summary-card--paid">
          <span className="finance-summary-card-label">Total pago</span>
          <span className="finance-bills-summary-hint">Já quitado neste mês</span>
          <strong className="finance-bills-summary-value finance-value--positive">
            <Icon name="check-circle" /> {formatCurrency(totalPago, hideFinanceValues)}
          </strong>
          <div className="finance-category-bar-track">
            <div className="finance-category-bar-fill finance-value--positive-bg" style={{ width: `${pctPago}%` }} />
          </div>
          <span className="finance-bills-summary-pct">{pctPago}% pago</span>
        </Card>
      </div>

      <h3 className="finance-bills-section-title">Pendentes</h3>
      {pendentes.length === 0 ? (
        <p className="sidebar-empty">Nenhuma conta pendente neste mês 🎉</p>
      ) : (
        <div className="finance-bills-list">
          {pendentes.map((entry) => {
            const status = paymentStatus(entry);
            const due = dueInfo(entry);
            const remaining = entry.amount - entry.paidAmount;
            return (
              <Card className="finance-bill-item" key={entry._id}>
                <div className="finance-bill-item-main">
                  <span
                    className="finance-category-chip-dot"
                    style={{ background: entry.category?.color || 'var(--color-danger)' }}
                  />
                  <div className="finance-entry-item-info">
                    <strong>{entry.description}</strong>
                    <span className={`finance-bill-due${due.urgent ? ' is-urgent' : ''}`}>
                      <Icon name={due.urgent ? 'alert-circle' : 'clock'} /> {due.label}
                    </span>
                  </div>
                </div>
                <div className="finance-bill-item-side">
                  {status === 'parcial' && (
                    <Pill className="finance-status-pill finance-status--parcial">{STATUS_LABEL.parcial}</Pill>
                  )}
                  <strong className="finance-value--negative">{formatCurrency(remaining, hideFinanceValues)}</strong>
                  <Button
                    variant="primary"
                    disabled={monthLocked}
                    loading={isPending(entry._id)}
                    onClick={() => handlePay(entry)}
                  >
                    Pagar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <h3 className="finance-bills-section-title">Pagas</h3>
      {pagas.length === 0 ? (
        <p className="sidebar-empty">Nenhuma conta paga ainda neste mês</p>
      ) : (
        <div className="finance-bills-list">
          {pagas.map((entry) => (
            <Card className="finance-bill-item is-paid" key={entry._id}>
              <div className="finance-bill-item-main">
                <span className="finance-bill-paid-icon">
                  <Icon name="check-circle" />
                </span>
                <div className="finance-entry-item-info">
                  <strong>{entry.description}</strong>
                  <span className="finance-entry-item-meta">Pago em {paidOnDate(entry)}</span>
                </div>
              </div>
              <div className="finance-bill-item-side">
                <strong className="finance-bill-amount--paid">{formatCurrency(entry.amount, hideFinanceValues)}</strong>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
