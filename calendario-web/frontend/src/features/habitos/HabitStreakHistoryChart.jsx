export function HabitStreakHistoryChart({ habit }) {
  const history = habit.streakHistory || [];
  const bars = [
    ...history.map((h) => ({ length: h.length, unit: h.unit, current: false })),
    { length: habit.currentStreak || 0, unit: 'dias', current: true },
  ];

  if (bars.every((b) => b.length === 0)) {
    return <p className="habit-streak-chart-empty">Ainda sem histórico de streaks.</p>;
  }

  const max = Math.max(1, habit.bestStreak || 0, ...bars.map((b) => b.length));

  return (
    <div className="habit-streak-chart">
      {bars.map((bar, index) => (
        <div key={index} className="habit-streak-chart-bar-wrap">
          <div
            className={`habit-streak-chart-bar${bar.current ? ' is-current' : ''}`}
            style={{ height: `${Math.max(4, (bar.length / max) * 100)}%` }}
            title={`${bar.length} ${bar.unit}`}
          />
          <span className="habit-streak-chart-value">{bar.length}</span>
        </div>
      ))}
    </div>
  );
}
