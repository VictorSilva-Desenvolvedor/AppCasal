import { useMemo } from 'react';
import { useDragAndDrop } from '../../hooks/useDragAndDrop.js';
import { useToast } from '../../hooks/useToast.js';
import { api } from '../../services/api.js';
import { UpdateCard } from './UpdateCard.jsx';

const COLUMNS = [
  { status: 'todo', label: 'A fazer' },
  { status: 'in_progress', label: 'Em andamento' },
  { status: 'done', label: 'Feito' },
];

export function UpdateBoard({ items, onChanged }) {
  const { showToast } = useToast();

  const groups = useMemo(() => {
    const map = { todo: [], in_progress: [], done: [] };
    items.forEach((item) => {
      (map[item.status] || map.todo).push(item);
    });
    return map;
  }, [items]);

  async function handleDelete(id) {
    if (!window.confirm('Excluir este pedido?')) return;
    try {
      await api.deleteUpdateRequest(id);
      await onChanged();
      showToast('Pedido excluído', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleDrop(id, status) {
    const item = items.find((i) => i._id === id);
    if (!item || item.status === status) return;
    try {
      await api.updateUpdateRequest(id, { status });
      await onChanged();
      showToast('Status atualizado', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  const dnd = useDragAndDrop({ onDrop: handleDrop });

  return (
    <div className="update-board">
      {COLUMNS.map((column) => {
        const columnItems = groups[column.status];
        return (
          <div className="update-column" key={column.status}>
            <h3>
              {column.label} <span className="update-column-count">{columnItems.length}</span>
            </h3>
            <div
              className={`update-column-list${dnd.isDropTarget(column.status) ? ' drag-over' : ''}`}
              {...dnd.dropProps(column.status)}
            >
              {columnItems.length === 0 ? (
                <p className="update-empty">Nada por aqui</p>
              ) : (
                columnItems.map((item) => (
                  <UpdateCard
                    key={item._id}
                    item={item}
                    dragging={dnd.isDragging(item._id)}
                    dragProps={dnd.dragProps({ id: item._id })}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
