import { useMemo, useState } from 'react';
import { useDragAndDrop } from '../../hooks/useDragAndDrop.js';
import { useToast } from '../../hooks/useToast.js';
import { api } from '../../services/api.js';
import { WatchlistCard } from './WatchlistCard.jsx';
import { STATUS_COLUMNS } from './watchlistUtils.js';

export function WatchlistBoard({ items, ratingsByItem, users, currentUserId, onChanged, onRate }) {
  const { showToast } = useToast();
  const [justDroppedId, setJustDroppedId] = useState(null);

  const groups = useMemo(() => {
    const map = { quero_ver: [], em_andamento: [], visto_ouvido: [] };
    items.forEach((item) => {
      (map[item.status] || map.quero_ver).push(item);
    });
    return map;
  }, [items]);

  async function handleDelete(id) {
    if (!window.confirm('Remover este item da watchlist?')) return;
    try {
      await api.deleteWatchlistItem(id);
      await onChanged();
      showToast('Item removido', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleDrop(id, status) {
    const item = items.find((i) => i._id === id);
    if (!item || item.status === status) return;
    try {
      await api.updateWatchlistItem(id, { status });
      await onChanged();
      setJustDroppedId(id);
      setTimeout(() => setJustDroppedId((current) => (current === id ? null : current)), 400);
      showToast('Movido!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  const dnd = useDragAndDrop({ onDrop: handleDrop });

  return (
    <div className="watchlist-board">
      {STATUS_COLUMNS.map((column) => {
        const columnItems = groups[column.status];
        const columnKey = column.status.replace(/_/g, '-');
        return (
          <div className={`watchlist-column watchlist-column--${columnKey}`} key={column.status}>
            <h3>
              {column.label} <span className="watchlist-column-count">{columnItems.length}</span>
            </h3>
            <div
              className={`watchlist-column-list${dnd.isDropTarget(column.status) ? ' drag-over' : ''}`}
              {...dnd.dropProps(column.status)}
            >
              {columnItems.length === 0 ? (
                <p className="watchlist-empty">Nada por aqui ainda</p>
              ) : (
                columnItems.map((item) => (
                  <WatchlistCard
                    key={item._id}
                    item={item}
                    ratings={ratingsByItem.get(item._id) || []}
                    users={users}
                    currentUserId={currentUserId}
                    dragging={dnd.isDragging(item._id)}
                    justDropped={item._id === justDroppedId}
                    dragProps={dnd.dragProps({ id: item._id })}
                    onDelete={handleDelete}
                    onRate={onRate}
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
