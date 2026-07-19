const RECURRENCE_INTERVAL_LABELS = {
  none: 'A cada quantos dias',
  daily: 'A cada quantos dias',
  weekly: 'A cada quantas semanas',
  monthly: 'A cada quantos meses',
  yearly: 'A cada quantos anos',
};

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function RecurrenceFields({ value, onChange }) {
  const { frequency, interval, daysOfWeek, endType, endDate, endCount } = value;

  function update(patch) {
    onChange({ ...value, ...patch });
  }

  function toggleWeekday(day) {
    const next = daysOfWeek.includes(day) ? daysOfWeek.filter((d) => d !== day) : [...daysOfWeek, day];
    update({ daysOfWeek: next });
  }

  return (
    <>
      <div className="field">
        <label htmlFor="event-recurrence-frequency">Repetição</label>
        <select
          id="event-recurrence-frequency"
          value={frequency}
          onChange={(event) => update({ frequency: event.target.value })}
        >
          <option value="none">Não repete</option>
          <option value="daily">Repete diariamente</option>
          <option value="weekly">Repete semanalmente</option>
          <option value="monthly">Repete mensalmente</option>
          <option value="yearly">Repete anualmente (aniversário/data fixa)</option>
        </select>
      </div>

      {frequency !== 'none' && (
        <div className="field">
          <label htmlFor="event-recurrence-interval">
            <span>{RECURRENCE_INTERVAL_LABELS[frequency] || RECURRENCE_INTERVAL_LABELS.none}</span>
          </label>
          <input
            type="number"
            id="event-recurrence-interval"
            min="1"
            value={interval}
            onChange={(event) => update({ interval: Math.max(1, Number(event.target.value) || 1) })}
          />
        </div>
      )}

      {frequency === 'weekly' && (
        <div className="field">
          <label>Dias da semana</label>
          <div className="event-recurrence-weekdays">
            {WEEKDAY_LABELS.map((label, day) => (
              <label key={day}>
                <input type="checkbox" checked={daysOfWeek.includes(day)} onChange={() => toggleWeekday(day)} />
                {label}
              </label>
            ))}
          </div>
        </div>
      )}

      {frequency !== 'none' && (
        <div className="field">
          <label htmlFor="event-recurrence-end-type">Terminar</label>
          <select
            id="event-recurrence-end-type"
            value={endType}
            onChange={(event) => update({ endType: event.target.value })}
          >
            <option value="never">Nunca</option>
            <option value="date">Em uma data</option>
            <option value="count">Após um número de ocorrências</option>
          </select>
          {endType === 'date' && (
            <input
              type="date"
              style={{ marginTop: 6 }}
              value={endDate}
              onChange={(event) => update({ endDate: event.target.value })}
            />
          )}
          {endType === 'count' && (
            <input
              type="number"
              min="1"
              style={{ marginTop: 6 }}
              value={endCount}
              onChange={(event) => update({ endCount: Math.max(1, Number(event.target.value) || 1) })}
            />
          )}
        </div>
      )}
    </>
  );
}
