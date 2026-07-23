import { useState } from 'react';
import { Field, Button } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';
import { HABIT_EMOJIS } from '../../constants/habitEmojis.js';
import { EVENT_COLORS } from '../calendar/calendarUtils.js';

export function HabitForm({ habit, users, currentUserId, onSaved, onCancel }) {
  const { showToast } = useToast();
  const isEditing = Boolean(habit);
  const [name, setName] = useState(habit?.name ?? '');
  const [type, setType] = useState(habit?.type ?? 'casal');
  const [owner, setOwner] = useState(habit?.owner?._id ?? habit?.owner ?? currentUserId ?? '');
  const [emoji, setEmoji] = useState(habit?.emoji ?? HABIT_EMOJIS[0]);
  const [color, setColor] = useState(habit?.color ?? EVENT_COLORS[0]);
  const [reminderTime, setReminderTime] = useState(habit?.reminderTime ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) {
      showToast('Dê um nome para o hábito', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = { name: name.trim(), emoji, color, reminderTime: reminderTime || null };
      const saved = isEditing
        ? await api.updateHabit(habit._id, payload)
        : await api.createHabit({ ...payload, type, owner: type === 'individual' ? owner : undefined });

      showToast(isEditing ? 'Hábito atualizado' : 'Hábito criado', 'success');
      onSaved(saved);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="habit-form" onSubmit={handleSubmit}>
      <Field label="Nome" htmlFor="habit-name">
        <input
          id="habit-name"
          type="text"
          maxLength={60}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex: Beber água"
          autoFocus
        />
      </Field>

      <Field label="Tipo">
        <div className="habit-type-toggle">
          <button
            type="button"
            className={`habit-type-toggle-btn${type === 'casal' ? ' is-active' : ''}`}
            disabled={isEditing}
            onClick={() => setType('casal')}
          >
            Casal
          </button>
          <button
            type="button"
            className={`habit-type-toggle-btn${type === 'individual' ? ' is-active' : ''}`}
            disabled={isEditing}
            onClick={() => setType('individual')}
          >
            Individual
          </button>
        </div>
      </Field>

      {type === 'individual' && (
        <Field label="De quem é esse hábito" htmlFor="habit-owner">
          <select
            id="habit-owner"
            value={owner}
            disabled={isEditing}
            onChange={(event) => setOwner(event.target.value)}
          >
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Emoji">
        <div className="habit-emoji-picker">
          {HABIT_EMOJIS.map((option) => (
            <button
              key={option}
              type="button"
              className={`habit-emoji-option${emoji === option ? ' is-active' : ''}`}
              onClick={() => setEmoji(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Cor">
        <div className="habit-color-picker">
          {EVENT_COLORS.map((option) => (
            <button
              key={option}
              type="button"
              className={`habit-color-option${color === option ? ' is-active' : ''}`}
              style={{ background: option }}
              onClick={() => setColor(option)}
              aria-label={`Cor ${option}`}
            />
          ))}
        </div>
      </Field>

      <Field label="Horário de lembrete (opcional)" htmlFor="habit-reminder">
        <input
          id="habit-reminder"
          type="time"
          value={reminderTime}
          onChange={(event) => setReminderTime(event.target.value)}
        />
      </Field>

      <div className="habit-form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving}>
          {isEditing ? 'Salvar' : 'Criar hábito'}
        </Button>
      </div>
    </form>
  );
}
