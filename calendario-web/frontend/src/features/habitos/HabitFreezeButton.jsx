import { useState } from 'react';
import { Icon, IconButton } from '../../components/ui/index.js';
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

  // O botão fica desabilitado em dois casos bem diferentes — o texto precisa
  // dizer qual deles, senão o usuário só vê um ícone apagado sem explicação.
  const freezeLabel = alreadyFrozenToday
    ? 'Hoje já está congelado'
    : remaining <= 0
      ? `Você já usou os ${habit.freezesPerMonth} congelamentos deste mês`
      : `Congelar hoje (${remaining} de ${habit.freezesPerMonth} congelamentos restantes este mês)`;

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
    <IconButton
      className="habit-freeze-btn"
      onClick={handleFreeze}
      loading={saving}
      disabled={remaining <= 0 || alreadyFrozenToday}
      aria-label={freezeLabel}
      title={freezeLabel}
    >
      <Icon name="habit-snowflake" />
    </IconButton>
  );
}
