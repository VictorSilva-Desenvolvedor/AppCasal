import { Card, IconButton, Icon, Pill } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { formatCurrency, formatEntryDate, paymentStatus } from './financeUtils.js';

const STATUS_LABEL = { pendente: 'Pendente', parcial: 'Pago parcial', pago: 'Pago' };
const WISH_LABEL = { necessidade: 'Necessidade futura', desejo: 'Desejo futuro' };
const SECTION_ORDER = ['fixa', 'com_prazo', 'unica'];
const SECTION_META = {
  fixa: { label: 'Despesas fixas', icon: 'repeat' },
  com_prazo: { label: 'Despesas com prazo', icon: 'clock' },
  unica: { label: 'Despesas únicas', icon: 'check-circle' },
};

export function FinanceEntryList({ entries, monthLocked, onEdit, onDeleted, groupByNature = false }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  async function handleDelete(id) {
    if (!window.confirm('Excluir este lançamento?')) return;
    try {
      await api.deleteFinanceEntry(id);
      await onDeleted();
      showToast('Lançamento excluído', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  if (entries.length === 0) {
    return <p className="sidebar-empty">Nenhum lançamento neste mês</p>;
  }

  function renderEntry(entry) {
    const status = paymentStatus(entry);
    const isOwner = entry.paidBy?._id === user?._id;
    return (
      <Card className="finance-entry-item" key={entry._id}>
        <div className="finance-entry-item-main">
          <span
            className="finance-category-chip-dot"
            style={{ background: entry.category?.color || 'var(--color-danger)' }}
          />
          <div className="finance-entry-item-info">
            <strong>{entry.description}</strong>
            <span className="finance-entry-item-meta">
              {entry.category?.name ? (
                entry.category.name
              ) : (
                <span className="finance-missing-category">Sem categoria</span>
              )}{' '}
              · {formatEntryDate(entry.date)} · pago por{' '}
              {entry.paidBy?.name || '—'}
              {entry.sharedWith && ` · dividido com ${entry.sharedWith.name}`}
            </span>
            {entry.wishType && (
              <span className="finance-entry-item-meta">
                {WISH_LABEL[entry.wishType]}
                {entry.reason && ` — ${entry.reason}`}
              </span>
            )}
          </div>
        </div>

        <div className="finance-entry-item-side">
          <strong className={entry.type === 'receita' ? 'finance-value--positive' : 'finance-value--negative'}>
            {entry.type === 'receita' ? '+' : '-'}
            {formatCurrency(entry.amount)}
          </strong>
          {entry.type === 'despesa' && <Pill className={`finance-status-pill finance-status--${status}`}>{STATUS_LABEL[status]}</Pill>}
          {isOwner && (
            <div className="finance-entry-item-actions">
              <IconButton onClick={() => onEdit(entry)} title="Editar" disabled={monthLocked}>
                <Icon name="tool" />
              </IconButton>
              <IconButton onClick={() => handleDelete(entry._id)} title="Excluir" disabled={monthLocked}>
                <Icon name="trash" />
              </IconButton>
            </div>
          )}
        </div>
      </Card>
    );
  }

  if (!groupByNature) {
    return <div className="finance-entry-list">{entries.map(renderEntry)}</div>;
  }

  const groups = { fixa: [], com_prazo: [], unica: [] };
  entries.forEach((entry) => {
    const key = entry.type === 'despesa' && entry.nature ? entry.nature : 'unica';
    (groups[key] || groups.unica).push(entry);
  });

  return (
    <div className="finance-entry-list">
      {SECTION_ORDER.filter((key) => groups[key].length > 0).map((key) => (
        <div key={key}>
          <div className="finance-entry-section-header">
            <Icon name={SECTION_META[key].icon} /> {SECTION_META[key].label}
          </div>
          {groups[key].map(renderEntry)}
        </div>
      ))}
    </div>
  );
}
