import { Icon } from '../../components/ui/index.js';
import { computeCurrentStreak, getPartnerColor, toDayKey } from './habitUtils.js';

export function HabitCard({ habit, checkins, users, currentUserId, onCheckin, onEdit, onArchive, onViewHistory }) {
  const todayKey = toDayKey(new Date());
  const streak = computeCurrentStreak(habit, checkins, users);
  const isIndividual = habit.type === 'individual';
  const ownerId = habit.owner?._id ?? habit.owner;
  const canCheckin = isIndividual ? ownerId === currentUserId : true;

  const myCheckinToday = checkins.some((c) => c.day === todayKey && (c.user?._id ?? c.user) === currentUserId);

  const partnerStatuses = !isIndividual
    ? users
        .filter((u) => u._id !== currentUserId)
        .map((u) => ({
          user: u,
          done: checkins.some((c) => c.day === todayKey && (c.user?._id ?? c.user) === u._id),
        }))
    : [];

  // Os dois completaram o hábito de casal hoje — dispara a barra de
  // gradiente coral→roxo e o coração duplo pulsando no card.
  const completedTogetherToday = !isIndividual && myCheckinToday && partnerStatuses.every((p) => p.done);

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
            {isIndividual ? `Individual · ${habit.owner?.name ?? ''}` : 'Casal'}
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

      {partnerStatuses.length > 0 && (
        <div className="habit-card-partner-status">
          {partnerStatuses.map(({ user, done }) => (
            <span
              key={user._id}
              className={`habit-partner-chip${done ? ' is-done' : ''}`}
              style={{ '--partner-color': getPartnerColor(user._id, users) }}
            >
              {done ? '✓' : '·'} {user.name}
            </span>
          ))}
        </div>
      )}

      <div className="habit-card-actions">
        {canCheckin && (
          <button
            type="button"
            className="btn btn-primary habit-checkin-btn"
            disabled={myCheckinToday}
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
