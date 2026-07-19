import { useMemo } from 'react';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { buildOccurrenceMap, countEventsInMonth, filteredEvents, generateMonthRange } from './calendarUtils.js';

export function MobileMonthList({ onSelectMonth }) {
  const { events, filters } = useCalendarData();
  const today = new Date();
  const months = useMemo(() => generateMonthRange(), []);

  const occMap = useMemo(() => {
    const lastMonth = months[months.length - 1];
    const rangeEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
    return buildOccurrenceMap(filteredEvents(events, filters), months[0], rangeEnd);
  }, [events, filters, months]);

  return (
    <div className="calendar-month-list">
      {months.map((monthDate) => {
        const rawLabel = monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
        const count = countEventsInMonth(monthDate, occMap);
        const isCurrent = monthDate.getFullYear() === today.getFullYear() && monthDate.getMonth() === today.getMonth();

        return (
          <button
            type="button"
            key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}
            className={`calendar-month-item${isCurrent ? ' is-current' : ''}`}
            onClick={() => onSelectMonth(monthDate)}
          >
            <span>{label}</span>
            {count > 0 && <span className="calendar-month-badge">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
