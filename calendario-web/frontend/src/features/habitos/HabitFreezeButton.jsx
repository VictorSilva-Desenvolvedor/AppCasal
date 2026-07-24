import { useState } from 'react';
import { Icon } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';
import { toDayKey } from './habitUtils.js';

export function HabitFreezeButton({ habit, onFrozen }) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const todayKey = toDayKey(new Date());
  const usedThisMonth = habit.freezeDays.filter((f) => f.day.slice(0, 7) === todayKey.slice(0, 7)).length;
  const remaining = habit.freezesPerMonth - usedThisMonth;
  const alreadyFrozenToday = habit.freezeDays.some((f) => f.day === todayKey);

  async function handleFreeze() {
    setSaving(true);
    try {
      await api.freezeHabit(habit._id, todayKey);
      showToast('Dia congelado', 'success');
      onFrozen();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      className="icon-btn habit-freeze-btn"
      onClick={handleFreeze}
      disabled={saving || remaining <= 0 || alreadyFrozenToday}
      aria-label={`Congelar hoje (${remaining} de ${habit.freezesPerMonth} disponíveis este mês)`}
      title={`${remaining} de ${habit.freezesPerMonth} congeladores disponíveis este mês`}
    >
      <Icon name="habit-snowflake" />
    </button>
  );
}
