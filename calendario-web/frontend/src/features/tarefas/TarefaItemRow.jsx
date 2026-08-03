import { useRef, useState } from 'react';
import { IconButton, Icon, Spinner } from '../../components/ui/index.js';
import { PERIOD_LABELS, PERIOD_ORDER, DEFAULT_PERIOD } from './tarefasUtils.js';

export function TarefaItemRow({ item, canManage, pending, onToggle, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.title);
  const [draftPeriod, setDraftPeriod] = useState(item.period ?? DEFAULT_PERIOD);
  // Enter e Escape fecham a edição, e fechar tira o foco do input — o que
  // dispara o onBlur logo em seguida. Este ref é a fonte da verdade pra
  // segunda chamada não virar um segundo PATCH (ou desfazer o cancelamento).
  const editingRef = useRef(false);
  const addedByPartner = item.createdBy?._id !== item.belongsTo?._id;

  const currentPeriod = item.period ?? DEFAULT_PERIOD;
  const isDaily = item.kind === 'diaria';

  function startEditing() {
    setDraft(item.title);
    setDraftPeriod(currentPeriod);
    editingRef.current = true;
    setEditing(true);
  }

  function finishEditing(save) {
    if (!editingRef.current) return;
    editingRef.current = false;
    setEditing(false);

    const title = draft.trim();
    const payload = {};
    if (save && title && title !== item.title) payload.title = title;
    if (save && isDaily && draftPeriod !== currentPeriod) payload.period = draftPeriod;

    if (Object.keys(payload).length > 0) {
      onEdit(payload);
    } else {
      setDraft(item.title);
      setDraftPeriod(currentPeriod);
    }
  }

  // O corpo da linha é clicável só pra dar um alvo de toque decente no celular.
  // Quando há texto selecionado, o clique é o fim de uma seleção — alternar a
  // tarefa ali seria um efeito colateral de tentar copiar o título.
  function handleBodyClick() {
    if (pending || editing) return;
    if (window.getSelection()?.toString()) return;
    onToggle();
  }

  return (
    <div className={`tarefa-item${item.completed ? ' is-completed' : ''}`}>
      <div
        role="checkbox"
        aria-checked={item.completed}
        aria-busy={pending}
        aria-label={item.title}
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

      {editing ? (
        // O blur fica no contêiner (onBlur borbulha, é focusout) pra que ir do
        // título até o seletor de período não seja lido como "terminou de
        // editar" — só sair da linha inteira encerra.
        <div
          className="tarefa-item-edit"
          onBlur={(e) => {
            if (e.currentTarget.contains(e.relatedTarget)) return;
            finishEditing(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              finishEditing(true);
            } else if (e.key === 'Escape') {
              e.preventDefault();
              finishEditing(false);
            }
          }}
        >
          <input
            type="text"
            className="tarefa-item-edit-input"
            aria-label="Editar título da tarefa"
            value={draft}
            maxLength={120}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
          />
          {isDaily && (
            <select
              className="tarefa-item-edit-period"
              aria-label="Período do dia"
              value={draftPeriod}
              onChange={(e) => setDraftPeriod(e.target.value)}
            >
              {PERIOD_ORDER.map((p) => (
                <option key={p} value={p}>
                  {PERIOD_LABELS[p]}
                </option>
              ))}
            </select>
          )}
        </div>
      ) : (
        <div className="tarefa-item-body" onClick={handleBodyClick}>
          <span className="tarefa-item-title">{item.title}</span>
          {addedByPartner && (
            <span className="tarefa-item-meta">adicionado por {item.createdBy?.name}</span>
          )}
        </div>
      )}

      {canManage && !editing && (
        <>
          <IconButton onClick={startEditing} title="Editar" aria-label={`Editar ${item.title}`} disabled={pending}>
            <Icon name="edit" />
          </IconButton>
          <IconButton onClick={onDelete} title="Excluir" aria-label={`Excluir ${item.title}`} loading={pending}>
            <Icon name="trash" />
          </IconButton>
        </>
      )}
    </div>
  );
}
