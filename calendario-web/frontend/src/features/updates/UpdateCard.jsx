import { useState } from 'react';
import { Icon, Spinner } from '../../components/ui/index.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { personColorFor } from '../calendar/calendarUtils.js';

function formatLogTimestamp(date) {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function UpdateCard({ item, dragging, saving, dragProps, onDelete, onAddNote }) {
  const { users } = useCalendarData();
  const dotColor = item.creator ? personColorFor(users, item.creator._id) : 'var(--color-text-muted)';
  const authorName = item.creator?.name || 'desconhecido';

  const notes = item.notes || [];
  const [showNotes, setShowNotes] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAddNote(event) {
    event.preventDefault();
    const trimmed = noteText.trim();
    if (!trimmed) return;

    setSaving(true);
    try {
      await onAddNote(item._id, trimmed);
      setNoteText('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={`update-card${dragging ? ' dragging' : ''}${saving ? ' is-saving' : ''}`}
      data-status={item.status}
      {...dragProps}
    >
      <div className="update-card-title">{item.title}</div>
      {item.description && <div className="update-card-description">{item.description}</div>}
      <div className="update-card-footer">
        <span className="update-card-meta">
          <span className="person-dot" style={{ background: dotColor }} />
          {authorName} · {formatLogTimestamp(item.createdAt)}
        </span>
        <button
          type="button"
          className="update-card-delete"
          title="Excluir"
          aria-label="Excluir pedido"
          disabled={saving}
          onClick={() => onDelete(item._id)}
        >
          {saving ? <Spinner /> : <Icon name="trash" />}
        </button>
      </div>

      <button
        type="button"
        className="update-card-notes-toggle"
        onClick={() => setShowNotes((prev) => !prev)}
      >
        {showNotes ? 'Ocultar' : 'Ver'} observações ({notes.length})
      </button>

      {showNotes && (
        <div className="update-card-notes">
          {notes.length > 0 && (
            <ul className="update-card-notes-list">
              {notes.map((note) => (
                <li key={note._id} className="update-card-note">
                  <span className="update-card-note-meta">
                    {note.author?.name || 'desconhecido'} · {formatLogTimestamp(note.createdAt)}
                  </span>
                  <p className="update-card-note-text">{note.text}</p>
                </li>
              ))}
            </ul>
          )}
          <form className="update-card-note-form" onSubmit={handleAddNote}>
            <textarea
              placeholder="Adicionar observação..."
              value={noteText}
              onChange={(event) => setNoteText(event.target.value)}
            />
            <button type="submit" className="btn btn-secondary" disabled={saving || !noteText.trim()}>
              Adicionar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
