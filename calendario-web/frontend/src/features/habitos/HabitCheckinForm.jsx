import { useState } from 'react';
import { Field, Button } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';
import { HABIT_EMOJIS } from '../../constants/habitEmojis.js';

export function HabitCheckinForm({ habit, day, onSaved, onCancel }) {
  const { showToast } = useToast();
  const isQuantitative = habit.goalType === 'quantitativo';
  const [emoji, setEmoji] = useState(habit.emoji);
  const [note, setNote] = useState('');
  const [value, setValue] = useState(1);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isQuantitative && (!value || value <= 0)) {
      showToast('Informe uma quantidade maior que zero', 'error');
      return;
    }

    setSaving(true);
    try {
      const checkin = await api.createHabitCheckin({
        habit: habit._id,
        day,
        note,
        emoji,
        value: isQuantitative ? Number(value) : undefined,
      });
      showToast('Check-in registrado!', 'success');
      onSaved(checkin);
    } catch (err) {
      // 409 = o check-in de hoje já existe (feito em outra aba/aparelho). A tela
      // estava desatualizada: atualiza e fecha em vez de deixar o modal preso.
      if (err.status === 409) {
        showToast('Esse check-in já estava registrado', 'info');
        onSaved(null);
        return;
      }
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="habit-checkin-form" onSubmit={handleSubmit}>
      {isQuantitative && (
        <Field label={`Quantidade${habit.unit ? ` (${habit.unit})` : ''}`} htmlFor="habit-checkin-value">
          <input
            id="habit-checkin-value"
            type="number"
            min="0.01"
            step="0.01"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            autoFocus
          />
        </Field>
      )}

      {/* Rótulo antigo "Como foi?" parecia pergunta de humor, mas a lista são ícones. */}
      <Field label="Ícone do registro (opcional)">
        <div className="habit-emoji-picker" role="group" aria-label="Emoji">
          {HABIT_EMOJIS.map((option) => (
            <button
              key={option}
              type="button"
              className={`habit-emoji-option${emoji === option ? ' is-active' : ''}`}
              aria-pressed={emoji === option}
              onClick={() => setEmoji(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Nota (opcional)" htmlFor="habit-checkin-note">
        <textarea
          id="habit-checkin-note"
          maxLength={140}
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Como foi fazer isso hoje?"
        />
      </Field>

      <div className="habit-form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving}>
          {isQuantitative ? 'Registrar' : 'Concluir hoje'}
        </Button>
      </div>
    </form>
  );
}
