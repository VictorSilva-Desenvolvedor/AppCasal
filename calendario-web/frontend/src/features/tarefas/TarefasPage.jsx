import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../services/api.js';
import { HeartLoader, Button, ConfirmDialog, Modal, Icon } from '../../components/ui/index.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { useToast } from '../../hooks/useToast.js';
import { usePendingIds } from '../../hooks/usePendingIds.js';
import { useSortableDrag } from '../../hooks/useSortableDrag.js';
import { TarefaFormModal } from './TarefaFormModal.jsx';
import { TarefaItemRow } from './TarefaItemRow.jsx';
import { TarefaProgressRing } from './TarefaProgressRing.jsx';
import {
  KIND_LABELS,
  KIND_ORDER,
  PERIOD_LABELS,
  PERIOD_ORDER,
  DEFAULT_PERIOD,
  groupByKind,
  groupByPeriod,
  countCompleted,
  canManageItem,
  moveTaskItem,
  sectionIdsInDisplayOrder,
} from './tarefasUtils.js';

// A zona de soltura é identificada por "tipo:período" — chave composta no mesmo
// espírito do "tipo:valor" que o arraste do financeiro usa.
const sectionId = (kind, period) => `${kind}:${period}`;
const parseSection = (id) => {
  const [kind, period] = id.split(':');
  return { kind, period };
};

export function TarefasPage() {
  const { user: me } = useAuth();
  const { users } = useCalendarData();
  const { showToast } = useToast();
  const { isPending, run } = usePendingIds();
  const partner = users.find((u) => u._id !== me._id);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [activeTab, setActiveTab] = useState('me');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formState, setFormState] = useState(null);
  const [moveAnnouncement, setMoveAnnouncement] = useState('');

  // O handler de arraste é recriado a cada render (fecha sobre `items`), mas o
  // hook registra os listeners uma vez — este ref mantém a referência fresca.
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const reload = useCallback(async () => {
    try {
      setItems(await api.getTaskItems());
      setLoadError(null);
    } catch (err) {
      setLoadError(err.message);
    }
  }, []);

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [reload]);

  const applyMove = useCallback(
    async ({ itemId, toKind, toPeriod, toIndex }) => {
      const current = itemsRef.current;
      const item = current.find((i) => i._id === itemId);
      if (!item) return;

      const next = moveTaskItem(current, { itemId, toKind, toPeriod, toIndex });
      if (next === current) return;

      const belongsTo = item.belongsTo?._id ?? item.belongsTo;
      const kind = toKind ?? item.kind;
      const period = kind === 'diaria' ? (toPeriod ?? DEFAULT_PERIOD) : DEFAULT_PERIOD;
      const section = { belongsTo, kind, period };
      const ids = sectionIdsInDisplayOrder(next, section);

      // Soltar no mesmo lugar de onde saiu não é um movimento — sem esta saída
      // cada arraste abortado viraria um PUT.
      const before = sectionIdsInDisplayOrder(current, section);
      if (before.length === ids.length && before.every((id, i) => id === ids[i])) return;

      // Otimista: a lista já se reorganiza no gesto. Um round-trip antes de
      // mover deixaria cada micro-ajuste com cara de travado.
      setItems(next);
      const position = ids.indexOf(itemId) + 1;
      setMoveAnnouncement(
        kind === 'diaria'
          ? `${item.title} movida para ${PERIOD_LABELS[period]}, posição ${position}`
          : `${item.title} movida para a posição ${position}`
      );

      try {
        await api.reorderTaskItems({ belongsTo, kind, period, ids });
      } catch (err) {
        showToast(err.message, 'error');
        reload();
      }
    },
    [reload, showToast]
  );

  const handleDragMove = useCallback(
    ({ itemId, sectionId: targetSection, index }) => {
      const { kind, period } = parseSection(targetSection);
      const item = itemsRef.current.find((i) => i._id === itemId);
      // Arrastar entre TIPOS está fora de escopo: só reordena dentro do grupo
      // ou muda de período dentro das diárias.
      if (!item || item.kind !== kind) return;
      applyMove({ itemId, toKind: kind, toPeriod: period, toIndex: index });
    },
    [applyMove]
  );

  const drag = useSortableDrag({ onMove: handleDragMove });

  if (loading) {
    return (
      <section className="view tarefas-page">
        <HeartLoader />
      </section>
    );
  }

  const activeUser = activeTab === 'me' ? me : partner;
  const activeUserId = activeUser?._id;
  const listItems = items.filter((item) => item.belongsTo._id === activeUserId);
  const grouped = groupByKind(listItems);

  const daily = listItems.filter((item) => item.kind === 'diaria');
  const { done: dailyDone, total: dailyTotal } = countCompleted(daily);

  const dateLabel = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  async function handleAdd({ title, kind, period, belongsTo }) {
    try {
      const created = await api.createTaskItem({ title, kind, period, belongsTo });
      setItems((prev) => [...prev, created]);
    } catch (err) {
      showToast(err.message, 'error');
      // Relança pro modal continuar aberto com o texto digitado.
      throw err;
    }
  }

  async function handleToggle(id) {
    try {
      // O PATCH já devolve o item populado — não precisa recarregar a lista
      // inteira a cada clique.
      const updated = await run(id, () => api.toggleTaskItem(id));
      setItems((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleEdit(id, payload) {
    try {
      const updated = await run(id, () => api.updateTaskItem(id, payload));
      setItems((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleConfirmDelete() {
    const id = deleteTarget._id;
    setDeleteTarget(null);
    try {
      await run(id, () => api.deleteTaskItem(id));
      setItems((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Setas no punho: uma posição por vez, saltando para o período vizinho
  // quando o item já está na ponta do período atual.
  function handleKeyboardMove(item, direction) {
    const belongsTo = item.belongsTo._id;
    const period = item.kind === 'diaria' ? (item.period ?? DEFAULT_PERIOD) : DEFAULT_PERIOD;
    const ids = sectionIdsInDisplayOrder(items, { belongsTo, kind: item.kind, period });
    const index = ids.indexOf(item._id);
    const next = index + direction;

    if (next >= 0 && next < ids.length) {
      applyMove({ itemId: item._id, toPeriod: period, toIndex: next });
      return;
    }
    if (item.kind !== 'diaria') return;

    const periodIndex = PERIOD_ORDER.indexOf(period) + direction;
    if (periodIndex < 0 || periodIndex >= PERIOD_ORDER.length) return;
    const toPeriod = PERIOD_ORDER[periodIndex];
    const targetIds = sectionIdsInDisplayOrder(items, { belongsTo, kind: 'diaria', period: toPeriod });
    // Subindo entra no fim do período anterior; descendo, no começo do seguinte.
    applyMove({ itemId: item._id, toPeriod, toIndex: direction < 0 ? targetIds.length : 0 });
  }

  function renderItem(item) {
    return (
      <TarefaItemRow
        key={item._id}
        item={item}
        canManage={canManageItem(item, me._id)}
        pending={isPending(item._id)}
        onToggle={() => handleToggle(item._id)}
        onEdit={(payload) => handleEdit(item._id, payload)}
        onDelete={() => setDeleteTarget(item)}
        dragHandleProps={drag.handleProps(item._id)}
        dragging={drag.isDragging(item._id)}
        dragOffset={drag.offset}
        onKeyboardMove={(direction) => handleKeyboardMove(item, direction)}
      />
    );
  }

  // Linha de inserção: mostra onde o item cai antes de soltar, sem empurrar o
  // layout como faria um placeholder do tamanho do card.
  function renderSection(id, sectionItems) {
    const indicator = drag.dropTarget?.sectionId === id ? drag.dropTarget.index : null;
    return (
      <div className="tarefas-dropzone" {...drag.zoneProps(id)}>
        {sectionItems.map((item, index) => (
          <div key={item._id} className="tarefas-slot">
            {indicator === index && <div className="tarefa-drop-line" />}
            {renderItem(item)}
          </div>
        ))}
        {indicator === sectionItems.length && <div className="tarefa-drop-line" />}
      </div>
    );
  }

  return (
    <section className="view tarefas-page">
      <div className="tarefas-header">
        <h2>Tarefas</h2>
        <span className="tarefas-date">{dateLabel}</span>
      </div>

      <div className="tarefas-tabs" role="tablist" aria-label="De quem é a lista">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'me'}
          className={`tarefas-tab-btn${activeTab === 'me' ? ' is-active' : ''}`}
          onClick={() => setActiveTab('me')}
        >
          Minha lista
        </button>
        {partner && (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'partner'}
            className={`tarefas-tab-btn${activeTab === 'partner' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('partner')}
          >
            Lista de {partner.name}
          </button>
        )}
      </div>

      <div className="tarefas-progress">
        <TarefaProgressRing done={dailyDone} total={dailyTotal} />
        <div className="tarefas-progress-text">
          <div className="tarefas-progress-label">Tarefas diárias de {activeUser?.name} hoje</div>
          <div className="tarefas-progress-value">
            {dailyDone} de {dailyTotal} concluídas
          </div>
        </div>
      </div>

      {loadError && (
        <div className="tarefas-load-error" role="alert">
          <p>Não foi possível carregar as tarefas.</p>
          <p className="tarefas-load-error-detail">{loadError}</p>
          <Button type="button" variant="secondary" onClick={reload}>
            Tentar novamente
          </Button>
        </div>
      )}

      {KIND_ORDER.map((kind) => {
        const group = grouped[kind];
        if (group.length === 0) return null;
        const { done, total } = countCompleted(group);
        const byPeriod = kind === 'diaria' ? groupByPeriod(group) : null;
        return (
          <div key={kind} className="tarefas-group">
            <div className="tarefas-group-head">
              <span className="tarefas-group-dot" style={{ background: `var(--tarefas-${kind})` }} />
              <h3>{KIND_LABELS[kind]}</h3>
              <span className="tarefas-group-count">
                {done}/{total}
              </span>
            </div>

            {/* Só as diárias se dividem em manhã/tarde/noite/o dia todo. Os
                períodos vazios continuam aparecendo: mostram a estrutura do dia
                e servem de alvo pra soltar uma tarefa arrastada. */}
            {byPeriod
              ? PERIOD_ORDER.map((period) => (
                  <div key={period} className="tarefas-period">
                    <div className="tarefas-period-head">
                      <h4>{PERIOD_LABELS[period]}</h4>
                      <button
                        type="button"
                        className="tarefas-period-add"
                        aria-label={`Nova tarefa em ${PERIOD_LABELS[period]}`}
                        onClick={() =>
                          setFormState({ kind: 'diaria', period, belongsTo: activeUserId })
                        }
                      >
                        <Icon name="plus" />
                      </button>
                    </div>
                    {byPeriod[period].length === 0 && drag.dropTarget?.sectionId !== sectionId(kind, period) && (
                      <p className="tarefas-period-empty">Nada por aqui</p>
                    )}
                    {renderSection(sectionId(kind, period), byPeriod[period])}
                  </div>
                ))
              : renderSection(sectionId(kind, DEFAULT_PERIOD), group)}
          </div>
        );
      })}

      {listItems.length === 0 && !loadError && (
        <p className="tarefas-empty">Nenhuma tarefa por aqui ainda.</p>
      )}

      <button
        type="button"
        className="tarefas-fab"
        aria-label="Nova tarefa"
        onClick={() => setFormState({ belongsTo: activeUserId })}
      >
        <Icon name="plus" />
      </button>

      <p className="sr-only" role="status" aria-live="polite">
        {moveAnnouncement}
      </p>

      <Modal open={!!formState} onClose={() => setFormState(null)} title="Nova tarefa">
        {formState && (
          <TarefaFormModal
            me={me}
            partner={partner}
            defaultBelongsTo={formState.belongsTo}
            defaultKind={formState.kind}
            defaultPeriod={formState.period}
            onAdd={handleAdd}
            onClose={() => setFormState(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir tarefa"
        message={deleteTarget ? `"${deleteTarget.title}" será removida da lista. Não dá pra desfazer.` : ''}
        confirmLabel="Excluir"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </section>
  );
}
