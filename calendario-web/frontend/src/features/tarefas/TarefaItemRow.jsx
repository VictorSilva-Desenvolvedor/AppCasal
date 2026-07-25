import { IconButton, Icon, Spinner } from '../../components/ui/index.js';

export function TarefaItemRow({ item, isOwner, pending, onToggle, onDelete }) {
  const addedByPartner = item.createdBy?._id !== item.belongsTo?._id;

  return (
    <div className={`tarefa-item${item.completed ? ' is-completed' : ''}`}>
      <div
        role="checkbox"
        aria-checked={item.completed}
        aria-busy={pending}
        tabIndex={0}
        className={`tarefa-check${item.completed ? ' is-checked' : ''}`}
        style={{ '--check-color': `var(--tarefas-${item.kind})` }}
        onClick={pending ? undefined : onToggle}
        onKeyDown={(e) => {
          if (pending) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        {pending ? <Spinner /> : item.completed && '✓'}
      </div>

      <div className="tarefa-item-body" onClick={pending ? undefined : onToggle}>
        <span className="tarefa-item-title">{item.title}</span>
        {addedByPartner && (
          <span className="tarefa-item-meta">adicionado por {item.createdBy?.name}</span>
        )}
      </div>

      {isOwner && (
        <IconButton onClick={onDelete} title="Excluir" loading={pending}>
          <Icon name="trash" />
        </IconButton>
      )}
    </div>
  );
}
