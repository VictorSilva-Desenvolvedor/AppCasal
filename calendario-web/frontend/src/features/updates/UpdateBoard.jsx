import { useMemo, useState } from 'react';
import { ConfirmDialog } from '../../components/ui/index.js';
import { useDragAndDrop } from '../../hooks/useDragAndDrop.js';
import { usePendingIds } from '../../hooks/usePendingIds.js';
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
  const { isPending, run } = usePendingIds();
  const [confirmItem, setConfirmItem] = useState(null);

  const groups = useMemo(() => {
    const map = { todo: [], in_progress: [], done: [] };
    items.forEach((item) => {
      (map[item.status] || map.todo).push(item);
    });
    return map;
  }, [items]);

  async function handleConfirmDelete() {
    const id = confirmItem._id;
    setConfirmItem(null);
    try {
      await run(id, () => api.deleteUpdateRequest(id));
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
      await run(id, () => api.updateUpdateRequest(id, { status }));
      await onChanged();
      showToast('Status atualizado', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleAddNote(id, text) {
    try {
      await api.addUpdateRequestNote(id, text);
      await onChanged();
      showToast('Observação adicionada', 'success');
    } catch (err) {
      showToast(err.message, 'error');
      // Repassa o erro pro card não limpar o texto que o usuário digitou.
      throw err;
    }
  }

  const dnd = useDragAndDrop({ onDrop: handleDrop });

  return (
    <div className="update-board">
      {COLUMNS.map((column, columnIndex) => {
        const columnItems = groups[column.status];
        const prevColumn = COLUMNS[columnIndex - 1];
        const nextColumn = COLUMNS[columnIndex + 1];
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
                    saving={isPending(item._id)}
                    dragProps={dnd.dragProps({ id: item._id })}
                    prevColumn={prevColumn}
                    nextColumn={nextColumn}
                    onMove={handleDrop}
                    onDelete={() => setConfirmItem(item)}
                    onAddNote={handleAddNote}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}

      <ConfirmDialog
        open={Boolean(confirmItem)}
        title="Excluir pedido"
        message={confirmItem ? `"${confirmItem.title}" será excluído para sempre.` : ''}
        confirmLabel="Excluir"
        onCancel={() => setConfirmItem(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
