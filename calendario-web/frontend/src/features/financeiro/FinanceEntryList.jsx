import { useState } from 'react';
import { Card, IconButton, Icon, Modal, Pill } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';
import { usePendingIds } from '../../hooks/usePendingIds.js';
import { formatCurrency, formatEntryDate, paymentStatus } from './financeUtils.js';

const STATUS_LABEL = { pendente: 'Pendente', parcial: 'Pago parcial', pago: 'Pago' };
const WISH_LABEL = { necessidade: 'Necessidade futura', desejo: 'Desejo futuro' };
const SECTION_ORDER = ['fixa', 'a_decidir', 'com_prazo', 'unica'];
const SECTION_META = {
  fixa: { label: 'Despesas fixas', icon: 'repeat' },
  a_decidir: { label: 'A decidir', icon: 'alert-circle' },
  com_prazo: { label: 'Despesas com prazo', icon: 'clock' },
  unica: { label: 'Despesas únicas', icon: 'check-circle' },
};

function groupByCategory(list) {
  const map = new Map();
  list.forEach((entry) => {
    const key = entry.category?._id || 'sem-categoria';
    if (!map.has(key)) map.set(key, { id: key, name: entry.category?.name || 'Sem categoria', items: [] });
    map.get(key).items.push(entry);
  });
  return Array.from(map.values()).sort((a, b) => {
    if (a.name === 'Sem categoria') return 1;
    if (b.name === 'Sem categoria') return -1;
    return a.name.localeCompare(b.name);
  });
}

export function FinanceEntryList({
  entries,
  monthLocked,
  onEdit,
  onDeleted,
  onChanged,
  groupByNature = false,
  dnd = null,
}) {
  const { showToast } = useToast();
  const { isPending, run } = usePendingIds();
  const [previewImage, setPreviewImage] = useState(null);

  const canDrag = Boolean(dnd) && !monthLocked;

  async function handleDelete(id) {
    if (!window.confirm('Excluir este lançamento?')) return;
    try {
      await run(id, () => api.deleteFinanceEntry(id));
      await onDeleted();
      showToast('Lançamento excluído', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleTogglePaid(entry) {
    const nextPaid = paymentStatus(entry) !== 'pago';
    try {
      await run(entry._id, () => api.payFinanceEntry(entry._id, nextPaid));
      await (onChanged || onDeleted)();
      showToast(nextPaid ? 'Marcado como pago' : 'Pagamento desfeito', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  if (entries.length === 0) {
    return <p className="sidebar-empty">Nenhum lançamento neste mês</p>;
  }

  function renderEntry(entry) {
    const status = paymentStatus(entry);
    return (
      <Card
        className={`finance-entry-item${canDrag ? ' is-draggable' : ''}${dnd?.isDragging(entry._id) ? ' is-dragging' : ''}`}
        key={entry._id}
        {...(canDrag ? dnd.dragProps({ id: entry._id }) : {})}
      >
        <div className="finance-entry-item-main">
          <span
            className="finance-category-chip-dot"
            style={{ background: entry.category?.color || 'var(--color-danger)' }}
          />
          {entry.image && (
            <img
              className="finance-entry-thumb"
              src={entry.image.url}
              alt={entry.image.name || entry.description}
              // sem isso o arraste do card pegaria a própria imagem como payload
              draggable={false}
              onClick={() => setPreviewImage(entry.image)}
            />
          )}
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
            {entry.linkedGoal && (
              <span className="finance-entry-item-meta">Vinculado a &quot;{entry.linkedGoal.name}&quot;</span>
            )}
          </div>
        </div>

        <div className="finance-entry-item-side">
          <strong className={entry.type === 'receita' ? 'finance-value--positive' : 'finance-value--negative'}>
            {entry.type === 'receita' ? '+' : '-'}
            {formatCurrency(entry.amount)}
          </strong>
          {entry.type === 'despesa' && <Pill className={`finance-status-pill finance-status--${status}`}>{STATUS_LABEL[status]}</Pill>}
          <div className="finance-entry-item-actions">
            {entry.type === 'despesa' && (
              <IconButton
                onClick={() => handleTogglePaid(entry)}
                title={status === 'pago' ? 'Desfazer pagamento' : 'Marcar como pago'}
                aria-label={status === 'pago' ? 'Desfazer pagamento' : 'Marcar como pago'}
                disabled={monthLocked}
                loading={isPending(entry._id)}
              >
                <Icon name={status === 'pago' ? 'rotate-ccw' : 'check-circle'} />
              </IconButton>
            )}
            <IconButton onClick={() => onEdit(entry)} title="Editar" disabled={monthLocked || isPending(entry._id)}>
              <Icon name="tool" />
            </IconButton>
            <IconButton
              onClick={() => handleDelete(entry._id)}
              title="Excluir"
              disabled={monthLocked}
              loading={isPending(entry._id)}
            >
              <Icon name="trash" />
            </IconButton>
          </div>
        </div>
      </Card>
    );
  }

  const imageModal = (
    <Modal open={Boolean(previewImage)} onClose={() => setPreviewImage(null)} title={previewImage?.name || 'Imagem'}>
      {previewImage && <img className="finance-entry-image-large" src={previewImage.url} alt={previewImage.name || ''} />}
    </Modal>
  );

  if (!groupByNature) {
    return (
      <div className="finance-entry-list">
        {entries.map(renderEntry)}
        {imageModal}
      </div>
    );
  }

  const groups = { fixa: [], a_decidir: [], com_prazo: [], unica: [] };
  entries.forEach((entry) => {
    const key = entry.type === 'despesa' && entry.nature ? entry.nature : 'unica';
    (groups[key] || groups.unica).push(entry);
  });

  return (
    <div className="finance-entry-list">
      {SECTION_ORDER.filter((key) => groups[key].length > 0).map((key) => {
        const subgroups = groupByCategory(groups[key]);
        const natureTarget = `nature:${key}`;
        return (
          <div
            key={key}
            className={`finance-entry-section${dnd?.isDropTarget(natureTarget) ? ' drag-over' : ''}`}
            {...(canDrag ? dnd.dropProps(natureTarget) : {})}
          >
            <div className="finance-entry-section-header">
              <Icon name={SECTION_META[key].icon} /> {SECTION_META[key].label}
            </div>
            {subgroups.length > 1
              ? subgroups.map((sub) => {
                  const categoryTarget = `category:${sub.id}`;
                  return (
                    <div
                      key={sub.id}
                      className={`finance-entry-subsection${dnd?.isDropTarget(categoryTarget) ? ' drag-over' : ''}`}
                      {...(canDrag ? dnd.dropProps(categoryTarget) : {})}
                    >
                      <div className="finance-entry-subsection-header">{sub.name}</div>
                      {sub.items.map(renderEntry)}
                    </div>
                  );
                })
              : subgroups[0]?.items.map(renderEntry)}
          </div>
        );
      })}
      {imageModal}
    </div>
  );
}
