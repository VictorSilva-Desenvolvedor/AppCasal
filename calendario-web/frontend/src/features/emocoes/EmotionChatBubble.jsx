import { useState } from 'react';

// Bolha genérica de "chat" reutilizada nas 2 seções do card expandido (Por
// que me sinto assim / O que pode ajudar) — só muda o alinhamento e a cor.
export function EmotionChatBubble({ align, authorName, authorColor, timestamp, text, emptyStateText, editable = false, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text || '');

  function startEditing() {
    if (!editable) return;
    setDraft(text || '');
    setEditing(true);
  }

  async function handleSave() {
    try {
      await onSave?.(draft.trim());
      setEditing(false);
    } catch {
      // erro já é sinalizado (toast) por quem chamou onSave — mantém a edição aberta
    }
  }

  return (
    <div className={`emotion-chat-row emotion-chat-row--${align}`}>
      <div className="emotion-chat-meta">
        <span className="person-dot" style={{ background: authorColor }} />
        <span className="emotion-chat-author">{authorName}</span>
        {timestamp && <span className="emotion-chat-time">{timestamp}</span>}
      </div>

      {editing ? (
        <div className="emotion-chat-edit">
          <textarea
            className="emotion-chat-textarea"
            maxLength={280}
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="emotion-chat-edit-actions">
            <button type="button" className="emotion-chat-edit-btn" onClick={() => setEditing(false)}>
              Cancelar
            </button>
            <button type="button" className="emotion-chat-edit-btn emotion-chat-edit-btn--primary" onClick={handleSave}>
              Salvar
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`emotion-chat-bubble emotion-chat-bubble--${align}${text ? '' : ' is-empty'}${editable ? ' is-editable' : ''}`}
          onClick={editable ? startEditing : undefined}
          role={editable ? 'button' : undefined}
          tabIndex={editable ? 0 : undefined}
        >
          {text || emptyStateText}
        </div>
      )}
    </div>
  );
}
