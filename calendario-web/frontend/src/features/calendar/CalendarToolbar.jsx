const VIEW_MODES = [
  { value: 'month', label: 'Mês' },
  { value: 'week', label: 'Semana' },
  { value: 'day', label: 'Dia' },
  { value: 'agenda', label: 'Agenda' },
];

function stepViewDate(mode, viewDate, direction) {
  if (mode === 'week') {
    return new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate() + direction * 7);
  }
  if (mode === 'day') {
    return new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate() + direction);
  }
  return new Date(viewDate.getFullYear(), viewDate.getMonth() + direction, 1);
}

function titleFor(mode, viewDate) {
  if (mode === 'week') {
    const weekStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate() - viewDate.getDay());
    const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
    const startLabel = weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const endLabel = weekEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${startLabel} – ${endLabel}`;
  }
  if (mode === 'day') {
    const label = viewDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  if (mode === 'agenda') return 'Próximos 60 dias';
  return viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export function CalendarToolbar({ mode, onChangeMode, viewDate, onChangeViewDate }) {
  return (
    <>
      <div className="calendar-view-toggle">
        {VIEW_MODES.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`calendar-view-toggle-btn${mode === item.value ? ' is-active' : ''}`}
            onClick={() => onChangeMode(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {mode !== 'agenda' && (
        <div className="calendar-nav">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onChangeViewDate(stepViewDate(mode, viewDate, -1))}
          >
            &larr; Anterior
          </button>
          <h2>{titleFor(mode, viewDate)}</h2>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onChangeViewDate(stepViewDate(mode, viewDate, 1))}
          >
            Próximo &rarr;
          </button>
        </div>
      )}
    </>
  );
}
