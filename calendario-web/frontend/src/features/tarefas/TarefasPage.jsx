import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import { HeartLoader } from '../../components/ui/index.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { useToast } from '../../hooks/useToast.js';
import { usePendingIds } from '../../hooks/usePendingIds.js';
import { TarefaAddForm } from './TarefaAddForm.jsx';
import { TarefaItemRow } from './TarefaItemRow.jsx';
import { TarefaProgressRing } from './TarefaProgressRing.jsx';
import { KIND_LABELS, KIND_ORDER, groupByKind, countCompleted } from './tarefasUtils.js';

export function TarefasPage() {
  const { user: me } = useAuth();
  const { users } = useCalendarData();
  const { showToast } = useToast();
  const { isPending, run } = usePendingIds();
  const partner = users.find((u) => u._id !== me._id);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('me');

  const reload = useCallback(async () => {
    setItems(await api.getTaskItems());
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

  const activeUserId = activeTab === 'me' ? me._id : partner?._id;
  const listItems = items.filter((item) => item.belongsTo._id === activeUserId);
  const grouped = groupByKind(listItems);

  const myDaily = items.filter((item) => item.belongsTo._id === me._id && item.kind === 'diaria');
  const { done: myDailyDone, total: myDailyTotal } = countCompleted(myDaily);

  const dateLabel = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  async function handleAdd(title, kind) {
    try {
      await api.createTaskItem({ title, kind, belongsTo: activeUserId });
      await reload();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleToggle(id) {
    try {
      await run(id, () => api.toggleTaskItem(id));
      await reload();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleDelete(id) {
    try {
      await run(id, () => api.deleteTaskItem(id));
      await reload();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <section className="view tarefas-page">
      <div className="tarefas-header">
        <h2>Tarefas</h2>
        <span className="tarefas-date">{dateLabel}</span>
      </div>

      <div className="tarefas-tabs">
        <button
          type="button"
          className={`tarefas-tab-btn${activeTab === 'me' ? ' is-active' : ''}`}
          onClick={() => setActiveTab('me')}
        >
          Minha lista
        </button>
        {partner && (
          <button
            type="button"
            className={`tarefas-tab-btn${activeTab === 'partner' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('partner')}
          >
            Lista de {partner.name}
          </button>
        )}
      </div>

      <div className="tarefas-progress">
        <TarefaProgressRing done={myDailyDone} total={myDailyTotal} />
        <div className="tarefas-progress-text">
          <div className="tarefas-progress-label">Tarefas diárias de {me.name} hoje</div>
          <div className="tarefas-progress-value">
            {myDailyDone} de {myDailyTotal} concluídas
          </div>
        </div>
      </div>

      {KIND_ORDER.map((kind) => {
        const group = grouped[kind];
        if (group.length === 0) return null;
        const { done, total } = countCompleted(group);
        return (
          <div key={kind} className="tarefas-group">
            <div className="tarefas-group-head">
              <span className="tarefas-group-dot" style={{ background: `var(--tarefas-${kind})` }} />
              <h3>{KIND_LABELS[kind]}</h3>
              <span className="tarefas-group-count">
                {done}/{total}
              </span>
            </div>
            {group.map((item) => (
              <TarefaItemRow
                key={item._id}
                item={item}
                isOwner={item.belongsTo._id === me._id}
                pending={isPending(item._id)}
                onToggle={() => handleToggle(item._id)}
                onDelete={() => handleDelete(item._id)}
              />
            ))}
          </div>
        );
      })}

      {listItems.length === 0 && <p className="tarefas-empty">Nenhuma tarefa por aqui ainda.</p>}

      <TarefaAddForm onAdd={handleAdd} />
    </section>
  );
}
