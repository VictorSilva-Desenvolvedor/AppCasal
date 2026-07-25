import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { useToast } from '../../hooks/useToast.js';
import { TarefaAddForm } from './TarefaAddForm.jsx';
import { TarefaItemRow } from './TarefaItemRow.jsx';
import { KIND_LABELS, KIND_ORDER, groupByKind, countCompleted } from './tarefasUtils.js';

export function TarefasPage() {
  const { user: me } = useAuth();
  const { users } = useCalendarData();
  const { showToast } = useToast();
  const partner = users.find((u) => u._id !== me._id);

  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('me');

  const reload = useCallback(async () => {
    setItems(await api.getTaskItems());
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const activeUserId = activeTab === 'me' ? me._id : partner?._id;
  const listItems = items.filter((item) => item.belongsTo._id === activeUserId);
  const grouped = groupByKind(listItems);

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
      await api.toggleTaskItem(id);
      await reload();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteTaskItem(id);
      await reload();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <section className="view tarefas-page">
      <h2>Tarefas</h2>

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
            Lista do {partner.name}
          </button>
        )}
      </div>

      <TarefaAddForm onAdd={handleAdd} />

      {KIND_ORDER.map((kind) => {
        const group = grouped[kind];
        if (group.length === 0) return null;
        const { done, total } = countCompleted(group);
        return (
          <div key={kind} className="tarefas-group">
            <h3>
              {KIND_LABELS[kind]}
              {kind === 'diaria' && (
                <span className="tarefas-progress-pill"> {done}/{total} concluídas</span>
              )}
            </h3>
            {group.map((item) => (
              <TarefaItemRow
                key={item._id}
                item={item}
                isOwner={item.belongsTo._id === me._id}
                onToggle={() => handleToggle(item._id)}
                onDelete={() => handleDelete(item._id)}
              />
            ))}
          </div>
        );
      })}

      {listItems.length === 0 && <p className="sidebar-empty">Nenhuma tarefa por aqui ainda.</p>}
    </section>
  );
}
