import { Card, IconButton, Icon } from '../../components/ui/index.js';

export function TarefaItemRow({ item, isOwner, onToggle, onDelete }) {
  const addedByPartner = item.createdBy?._id !== item.belongsTo?._id;

  return (
    <Card className={`tarefa-item${item.completed ? ' is-completed' : ''}`}>
      <label className="tarefa-item-check">
        <input type="checkbox" checked={item.completed} onChange={onToggle} />
        <span className="tarefa-item-title">{item.title}</span>
      </label>

      {addedByPartner && (
        <span className="tarefa-item-meta">adicionado por {item.createdBy?.name}</span>
      )}

      {isOwner && (
        <IconButton onClick={onDelete} title="Excluir">
          <Icon name="trash" />
        </IconButton>
      )}
    </Card>
  );
}
