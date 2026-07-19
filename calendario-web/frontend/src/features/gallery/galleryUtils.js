import { IMAGE_MIME } from '../calendar/calendarUtils.js';

export function allEventPhotos(events) {
  return events.flatMap((event) =>
    (event.attachments || [])
      .filter((att) => IMAGE_MIME.test(att.mimetype))
      .map((att) => ({
        url: att.url,
        name: att.name,
        eventId: event._id,
        eventTitle: event.title,
        date: event.date,
      })),
  );
}

export function photoMonthKey(dateStr) {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function photoMonthLabel(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}
