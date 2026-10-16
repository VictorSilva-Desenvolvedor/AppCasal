import { Icon, InfoTooltip, IconButton, Button } from '../../components/ui/index.js';
import {
  displayStreak,
  computeWeekProgress,
  getPartnerColor,
  toDayKey,
  HABIT_TYPE_LABELS,
  HABIT_TYPE_DESCRIPTIONS,
} from './habitUtils.js';
import { personColorFor } from '../calendar/calendarUtils.js';
import { HabitReactionPicker } from './HabitReactionPicker.jsx';
import { HabitFreezeButton } from './HabitFreezeButton.jsx';
import { HabitRecoveryBanner } from './HabitRecoveryBanner.jsx';

const WEEK_LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

// A semana bordada: um quadradinho por dia; cada pessoa que fez o check-in borda
// um X na sua cor (os dois juntos cruzam as duas linhas).
function WeekStitches({ checkins, users }) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const todayKey = toDayKey(now);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const key = toDayKey(date);
    const who = users.filter((u) => checkins.some((c) => c.day === key && String(c.user?._id ?? c.user) === String(u._id)));
    return { key, who, isToday: key === todayKey, isFuture: key > todayKey };
  });
  const doneCount = days.filter((d) => d.who.length).length;
  return (
    <div className="habit-week" role="img" aria-label={`Esta semana: ${doneCount} de 7 dias com check-in`}>
      {days.map((d, i) => (
        <span
          key={d.key}
          className={`habit-week-day${d.isToday ? ' is-today' : ''}${d.isFuture ? ' is-future' : ''}`}
          aria-hidden="true"
        >
          <span className="habit-week-letter">{WEEK_LETTERS[i]}</span>
          <span
            className={`habit-week-cell${d.who.length ? ' is-done stitch-anim' : ''}`}
            style={{
              '--stitch-delay': `${i * 0.05}s`,
              '--a': d.who[0] ? personColorFor(users, d.who[0]._id) : undefined,
              '--b': d.who[0] ? personColorFor(users, (d.who[1] ?? d.who[0])._id) : undefined,
            }}
          />
        </span>
      ))}
    </div>
  );
}

export function HabitCard({
  habit,
  checkins,
  users,
  currentUserId,
  pending,
  onCheckin,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
  onViewHistory,
  onFrozen,
  onReacted,
}) {
  const isArchived = !habit.active;
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

  const isShared = !isIndividual && !isAlternado && !isColaborativo;
  const memberStatuses = isShared
    ? users.map((u) => {
        const checkin = todayCheckins.find((c) => (c.user?._id ?? c.user) === u._id);
        return { user: u, checkin, done: Boolean(checkin) };
      })
    : [];
  const partnerStatuses = memberStatuses.filter((s) => s.user._id !== currentUserId);

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
      className={`card habit-card${completedTogetherToday ? ' is-united' : ''}${isArchived ? ' is-archived' : ''}`}
      style={{ '--habit-color': habit.color }}
    >
      <div className="habit-card-main">
        <span className="habit-card-emoji">{habit.emoji}</span>
        <div className="habit-card-info">
          <h3 className="habit-card-name">
            {habit.name}
            {isArchived && <span className="habit-archived-badge">Arquivado</span>}
          </h3>
          <span className="habit-card-type">
            {HABIT_TYPE_LABELS[habit.type]}
            {isIndividual ? ` · ${habit.owner?.name ?? ''}` : ''}
            <InfoTooltip text={HABIT_TYPE_DESCRIPTIONS[habit.type]} label="tipo do hábito" />
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
          <span className="sr-only">{streak === 1 ? ' dia seguido' : ' dias seguidos'}</span>
          <InfoTooltip text="Dias seguidos que vocês completaram esse hábito, sem quebrar." label="sequência" />
        </span>
      </div>

      <WeekStitches checkins={checkins} users={users} />

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

      {memberStatuses.length > 0 && (
        <div className="habit-card-partner-status">
          {memberStatuses.map(({ user, checkin, done }) => (
            <span
              key={user._id}
              className={`habit-partner-chip${done ? ' is-done' : ''}`}
              style={{ '--partner-color': getPartnerColor(user._id, users) }}
            >
              {done ? '✓' : '·'} {user._id === currentUserId ? 'Você' : user.name}
              {done && checkin && (
                <HabitReactionPicker
                  checkin={checkin}
                  currentUserId={currentUserId}
                  canReact={user._id !== currentUserId}
                  onReacted={onReacted}
                />
              )}
            </span>
          ))}
        </div>
      )}

      {/* Sem isso o card mostrava "Feito hoje" com a sequência parada em 0 e
          parecia que o check-in não tinha contado. */}
      {isShared && myCheckinToday && partnerStatuses.some((p) => !p.done) && (
        <p className="habit-waiting-hint">
          Seu check-in foi registrado. A sequência sobe quando{' '}
          {partnerStatuses
            .filter((p) => !p.done)
            .map((p) => p.user.name)
            .join(' e ')}{' '}
          também fizer o de hoje.
        </p>
      )}

      <HabitRecoveryBanner habit={habit} />

      <div className="habit-card-actions">
        {!isArchived && canCheckin && (
          <Button
            type="button"
            className="habit-checkin-btn"
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
          </Button>
        )}
        {!isArchived && <HabitFreezeButton habit={habit} doneToday={Boolean(myCheckinToday)} onFrozen={onFrozen} />}
        <IconButton aria-label="Ver histórico" onClick={() => onViewHistory(habit)}>
          <Icon name="calendar" />
        </IconButton>
        <IconButton aria-label="Editar hábito" onClick={() => onEdit(habit)}>
          <Icon name="settings" />
        </IconButton>
        {isArchived ? (
          <>
            <IconButton aria-label="Restaurar hábito" loading={pending} onClick={() => onUnarchive(habit)}>
              <Icon name="rotate-ccw" />
            </IconButton>
            <IconButton
              className="icon-btn-danger"
              aria-label="Excluir hábito permanentemente"
              loading={pending}
              onClick={() => onDelete(habit)}
            >
              <Icon name="trash" />
            </IconButton>
          </>
        ) : (
          <IconButton aria-label="Arquivar hábito" loading={pending} onClick={() => onArchive(habit)}>
            <Icon name="archive" />
          </IconButton>
        )}
      </div>
    </div>
  );
}
