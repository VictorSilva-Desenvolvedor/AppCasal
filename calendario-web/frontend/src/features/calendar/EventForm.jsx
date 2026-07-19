import { useState } from 'react';
import { Button } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { CATEGORIES } from '../../constants/categories.js';
import { RecurrenceFields } from './RecurrenceFields.jsx';
import { AttachmentsField } from './AttachmentsField.jsx';
import { InviteSection } from './InviteSection.jsx';
import {
  dateKeyToNoonISO,
  initialRecurrenceState,
  recurrenceStateToRule,
  reminderOffsetsToString,
  parseReminderOffsets,
} from './calendarUtils.js';

export function EventForm({ event, dateKey, onCancel, onSaved, onDeleted }) {
  const isEditing = Boolean(event);
  const { user } = useAuth();
  const { users, invitations, refetchEvents, refetchInvitations } = useCalendarData();
  const { showToast } = useToast();

  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [category, setCategory] = useState(event?.category || '');
  const [hideWhenPast, setHideWhenPast] = useState(Boolean(event?.hideWhenPast));
  const [reminderOffsets, setReminderOffsets] = useState(() => reminderOffsetsToString(event?.reminderOffsets));
  const [recurrence, setRecurrence] = useState(() => initialRecurrenceState(event));
  const [pendingFiles, setPendingFiles] = useState([]);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const existingAttachments = event?.attachments || [];

  async function handleSubmit(formEvent) {
    formEvent.preventDefault();
    setFormError('');

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setFormError('Informe um título para o evento');
      return;
    }

    setSaving(true);
    try {
      const uploaded = await Promise.all(pendingFiles.map((file) => api.uploadFile(file)));
      const attachments = [...existingAttachments, ...uploaded];

      const payload = {
        title: trimmedTitle,
        description: description.trim(),
        date: dateKeyToNoonISO(dateKey),
        attachments,
        recurrenceRule: recurrenceStateToRule(recurrence),
        category: category || null,
        reminderOffsets: parseReminderOffsets(reminderOffsets),
        hideWhenPast,
      };

      if (isEditing) {
        await api.updateEvent(event._id, payload);
      } else {
        await api.createEvent(payload);
      }

      await refetchEvents();
      showToast(isEditing ? 'Evento atualizado' : 'Evento criado', 'success');
      onSaved();
    } catch (err) {
      setFormError(err.message);
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!event) return;
    if (!window.confirm('Excluir este evento?')) return;

    setDeleting(true);
    try {
      await api.deleteEvent(event._id);
      await refetchEvents();
      showToast('Evento excluído', 'success');
      onDeleted();
    } catch (err) {
      setFormError(err.message);
      showToast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="event-title">Título</label>
        <input
          type="text"
          id="event-title"
          required
          value={title}
          onChange={(formEvent) => setTitle(formEvent.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="event-description">Descrição</label>
        <textarea
          id="event-description"
          value={description}
          onChange={(formEvent) => setDescription(formEvent.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="event-category">Categoria</label>
        <select id="event-category" value={category} onChange={(formEvent) => setCategory(formEvent.target.value)}>
          <option value="">Sem categoria</option>
          {Object.entries(CATEGORIES).map(([value, meta]) => (
            <option key={value} value={value}>
              {meta.label}
            </option>
          ))}
        </select>
      </div>

      <RecurrenceFields value={recurrence} onChange={setRecurrence} />

      <div className="field">
        <label htmlFor="event-reminder-offsets">Lembrar-me (dias antes, separados por vírgula)</label>
        <input
          type="text"
          id="event-reminder-offsets"
          placeholder="5, 3, 1"
          value={reminderOffsets}
          onChange={(formEvent) => setReminderOffsets(formEvent.target.value)}
        />
      </div>

      <div className="field">
        <label
          style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 400 }}
          htmlFor="event-hide-when-past"
        >
          <input
            type="checkbox"
            id="event-hide-when-past"
            style={{ width: 'auto' }}
            checked={hideWhenPast}
            onChange={(formEvent) => setHideWhenPast(formEvent.target.checked)}
          />
          Ocultar do calendário depois que a data passar
        </label>
      </div>

      <AttachmentsField
        existingAttachments={existingAttachments}
        pendingFiles={pendingFiles}
        onFilesChange={setPendingFiles}
      />

      {isEditing && (
        <InviteSection
          event={event}
          users={users}
          invitations={invitations}
          currentUserId={user?._id}
          onInvitationsChanged={refetchInvitations}
        />
      )}

      <p className="error-text">{formError}</p>

      <div className="modal-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        {isEditing && (
          <Button type="button" variant="danger" loading={deleting} onClick={handleDelete}>
            Excluir
          </Button>
        )}
        <Button type="submit" loading={saving}>
          Salvar
        </Button>
      </div>
    </form>
  );
}
