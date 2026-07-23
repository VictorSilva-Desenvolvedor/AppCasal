import { Icon } from '../../components/ui/index.js';
import { displayStreak, computeWeekProgress, getPartnerColor, toDayKey, HABIT_TYPE_LABELS } from './habitUtils.js';
import { HabitReactionPicker } from './HabitReactionPicker.jsx';
import { HabitFreezeButton } from './HabitFreezeButton.jsx';
import { HabitRecoveryBanner } from './HabitRecoveryBanner.jsx';

export function HabitCard({
  habit,
  checkins,
  users,
  currentUserId,
  onCheckin,
  onEdit,
  onArchive,
  onViewHistory,
  onFrozen,
  onReacted,
}) {
  const todayKey = toDayKey(new Date());
  const streak = displayStreak(habit, checkins, users);
  const weekProgress = computeWeekProgress(habit, checkins, users);
  const isIndividual = habit.type === 'individual';
  const isAlternado = habit.type === 'alternado';
  const isColaborativo = habit.type === 'colaborativo';
  const ownerId = habit.owner?._id ?? habit.owner;

  const todayCheckins = checkins.filter((c) => c.day === todayKey);
  const myCheckinToday = todayCheckins.find((c) => (c.user?._id ?? c.user) === currentUserId);

  const canCheckin = isIndividual
    ? ownerId === currentUserId
    : isAlternado
      ? String(habit.currentTurnUserId?._id ?? habit.currentTurnUserId) === currentUserId
      : !isColaborativo; // colaborativo usa o checklist, não o botão de check-in direto

  const partnerStatuses = !isIndividual && !isAlternado && !isColaborativo
    ? users
        .filter((u) => u._id !== currentUserId)
        .map((u) => {
          const checkin = todayCheckins.find((c) => (c.user?._id ?? c.user) === u._id);
          return { user: u, checkin, done: Boolean(checkin) };
        })
    : [];

  const completedTogetherToday = partnerStatuses.length > 0 && Boolean(myCheckinToday) && partnerStatuses.every((p) => p.done);

  const doneSubtaskIds = isColaborativo
    ? new Set(todayCheckins.map((c) => String(c.subtask?._id ?? c.subtask)))
    : null;
  const activeSubtasks = isColaborativo ? habit.subtasks.filter((s) => s.active) : [];
  const subtasksDoneCount = isColaborativo ? activeSubtasks.filter((s) => doneSubtaskIds.has(String(s._id))).length : 0;

  const turnUserId = String(habit.currentTurnUserId?._id ?? habit.currentTurnUserId);
  const isMyTurn = isAlternado && turnUserId === currentUserId;
  const turnUser = isAlternado ? users.find((u) => u._id === turnUserId) : null;

  return (
    <div
      className={`card habit-card${completedTogetherToday ? ' is-united' : ''}`}
      style={{ '--habit-color': habit.color }}
    >
      <div className="habit-card-main">
        <span className="habit-card-emoji">{habit.emoji}</span>
        <div className="habit-card-info">
          <h3 className="habit-card-name">{habit.name}</h3>
          <span className="habit-card-type">
            {HABIT_TYPE_LABELS[habit.type]}
            {isIndividual ? ` · ${habit.owner?.name ?? ''}` : ''}
          </span>
        </div>
        {completedTogetherToday && (
          <span className="habit-heart-badge habit-heart-pulse" aria-hidden="true">
            <Icon name="habit-double-heart" />
          </span>
        )}
        <span className="habit-card-streak">
          <Icon name="habit-flame" />
          {streak}
        </span>
      </div>

      {weekProgress && (
        <p className="habit-week-progress">
          {weekProgress.done}/{weekProgress.target} esta semana
        </p>
      )}

      {isAlternado && (
        <p className={`habit-turn-chip${isMyTurn ? ' is-mine' : ''}`}>
          <Icon name="habit-swap" />
          {isMyTurn ? 'Sua vez' : `Vez de ${turnUser?.name ?? '—'}`}
        </p>
      )}

      {isColaborativo && (
        <button type="button" className="habit-subtask-summary" onClick={() => onCheckin(habit)}>
          {subtasksDoneCount}/{activeSubtasks.length} hoje
        </button>
      )}

      {partnerStatuses.length > 0 && (
        <div className="habit-card-partner-status">
          {partnerStatuses.map(({ user, checkin, done }) => (
            <span
              key={user._id}
              className={`habit-partner-chip${done ? ' is-done' : ''}`}
              style={{ '--partner-color': getPartnerColor(user._id, users) }}
            >
              {done ? '✓' : '·'} {user.name}
              {done && checkin && (
                <HabitReactionPicker checkin={checkin} currentUserId={currentUserId} onReacted={onReacted} />
              )}
            </span>
          ))}
        </div>
      )}

      <HabitRecoveryBanner habit={habit} />

      <div className="habit-card-actions">
        {canCheckin && (
          <button
            type="button"
            className="btn btn-primary habit-checkin-btn"
            disabled={Boolean(myCheckinToday)}
            onClick={() => onCheckin(habit)}
          >
            {myCheckinToday ? (
              <>
                <Icon name="habit-check" /> Feito hoje
              </>
            ) : (
              'Fazer check-in'
            )}
          </button>
        )}
        <HabitFreezeButton habit={habit} onFrozen={onFrozen} />
        <button type="button" className="icon-btn" aria-label="Ver histórico" onClick={() => onViewHistory(habit)}>
          <Icon name="calendar" />
        </button>
        <button type="button" className="icon-btn" aria-label="Editar hábito" onClick={() => onEdit(habit)}>
          <Icon name="settings" />
        </button>
        <button type="button" className="icon-btn" aria-label="Arquivar hábito" onClick={() => onArchive(habit)}>
          <Icon name="trash" />
        </button>
      </div>
    </div>
  );
}
