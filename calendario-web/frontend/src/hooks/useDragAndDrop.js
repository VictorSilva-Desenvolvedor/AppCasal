import { useCallback, useState } from 'react';

// Drag-and-drop HTML5 nativo compartilhado entre o grid do calendário (Fase 4)
// e os quadros kanban (Fase 7) — sem biblioteca externa.
export function useDragAndDrop({ canDrag = () => true, onDrop } = {}) {
  const [draggingId, setDraggingId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);

  const dragProps = useCallback(
    (item) => {
      if (!canDrag(item)) return {};
      return {
        draggable: true,
        onDragStart: (event) => {
          event.dataTransfer.setData('text/plain', item.id);
          event.dataTransfer.effectAllowed = 'move';
          setDraggingId(item.id);
        },
        onDragEnd: () => setDraggingId(null),
      };
    },
    [canDrag],
  );

  const dropProps = useCallback(
    (targetId) => ({
      onDragOver: (event) => {
        event.preventDefault();
        setDropTargetId(targetId);
      },
      onDragLeave: (event) => {
        if (event.currentTarget.contains(event.relatedTarget)) return;
        setDropTargetId((current) => (current === targetId ? null : current));
      },
      onDrop: (event) => {
        event.preventDefault();
        setDropTargetId(null);
        const id = event.dataTransfer.getData('text/plain');
        onDrop?.(id, targetId);
      },
    }),
    [onDrop],
  );

  return {
    isDragging: (id) => draggingId === id,
    isDropTarget: (id) => dropTargetId === id,
    dragProps,
    dropProps,
  };
}
