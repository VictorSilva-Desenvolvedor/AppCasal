import { useContext } from 'react';
import { CalendarDataContext } from '../context/CalendarDataContext.jsx';

export function useCalendarData() {
  const ctx = useContext(CalendarDataContext);
  if (!ctx) throw new Error('useCalendarData deve ser usado dentro de CalendarDataProvider');
  return ctx;
}
