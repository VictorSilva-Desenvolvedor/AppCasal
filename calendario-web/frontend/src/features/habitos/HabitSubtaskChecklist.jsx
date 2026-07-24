import { useState } from 'react';
import { Icon } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';

export function HabitSubtaskChecklist({ habit, day, checkins, onChanged }) {
  const { showToast } = useToast();
  const [savingId, setSavingId] = useState(null);

  const dayCheckins = checkins.filter((c) => c.day === day);
  const activeSubtasks = habit.subtasks.filter((s) => s.active);

  async function handleToggle(subtask, done) {
    if (done) return; // já concluída — não desmarca por aqui
    setSavingId(subtask._id);
    try {
      await api.createHabitCheckin({ habit: habit._id, day, subtask: subtask._id });
      onChanged();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <ul className="habit-subtask-checklist">
      {activeSubtasks.map((subtask) => {
        const done = dayCheckins.find((c) => String(c.subtask?._id ?? c.subtask) === String(subtask._id));
        return (
          <li key={subtask._id} className={`habit-subtask-item${done ? ' is-done' : ''}`}>
            <button
              type="button"
              className="habit-subtask-checkbox"
              disabled={Boolean(done) || savingId === subtask._id}
              onClick={() => handleToggle(subtask, done)}
              aria-label={done ? 'Concluída' : 'Marcar como concluída'}
            >
              {done && <Icon name="habit-check" />}
            </button>
            <span className="habit-subtask-label">{subtask.label}</span>
            {done && <span className="habit-subtask-by">{done.user?.name}</span>}
          </li>
        );
      })}
    </ul>
  );
}
