import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import { HeartLoader, Button, ConfirmDialog } from '../../components/ui/index.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { useToast } from '../../hooks/useToast.js';
import { usePendingIds } from '../../hooks/usePendingIds.js';
import { TarefaAddForm } from './TarefaAddForm.jsx';
import { TarefaItemRow } from './TarefaItemRow.jsx';
import { TarefaProgressRing } from './TarefaProgressRing.jsx';
import {
  KIND_LABELS,
  KIND_ORDER,
  PERIOD_LABELS,
  PERIOD_ORDER,
  groupByKind,
  groupByPeriod,
  countCompleted,
  canManageItem,
} from './tarefasUtils.js';

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

  async function handleAdd(title, kind, period) {
    try {
      const created = await api.createTaskItem({ title, kind, period, belongsTo: activeUserId });
      setItems((prev) => [...prev, created]);
    } catch (err) {
      showToast(err.message, 'error');
      // Relança pro formulário saber que falhou e preservar o texto digitado.
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
      />
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
                e deixam claro onde a próxima tarefa pode entrar. */}
            {byPeriod
              ? PERIOD_ORDER.map((period) => (
                  <div key={period} className="tarefas-period">
                    <h4 className="tarefas-period-head">{PERIOD_LABELS[period]}</h4>
                    {byPeriod[period].length === 0 ? (
                      <p className="tarefas-period-empty">Nada por aqui</p>
                    ) : (
                      byPeriod[period].map(renderItem)
                    )}
                  </div>
                ))
              : group.map(renderItem)}
          </div>
        );
      })}

      {listItems.length === 0 && !loadError && (
        <p className="tarefas-empty">Nenhuma tarefa por aqui ainda.</p>
      )}

      <TarefaAddForm
        onAdd={handleAdd}
        targetName={activeTab === 'partner' ? partner?.name : null}
      />

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
