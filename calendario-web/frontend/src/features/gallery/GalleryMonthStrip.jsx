import { photoMonthKey, photoMonthLabel } from './galleryUtils.js';

export function GalleryMonthStrip({ photos, activeMonthKey, onSelectMonth }) {
  const counts = new Map();
  photos.forEach((photo) => {
    const key = photoMonthKey(photo.date);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  const months = [...counts.keys()].sort().reverse();

  if (months.length === 0) return null;

  return (
    <div className="gallery-month-strip">
      <button
        type="button"
        className={`gallery-month-chip${activeMonthKey === null ? ' is-active' : ''}`}
        onClick={() => onSelectMonth(null)}
      >
        Todos <span className="gallery-month-chip-count">{photos.length}</span>
      </button>
      {months.map((key) => (
        <button
          key={key}
          type="button"
          className={`gallery-month-chip${activeMonthKey === key ? ' is-active' : ''}`}
          onClick={() => onSelectMonth(key)}
        >
          {photoMonthLabel(key)} <span className="gallery-month-chip-count">{counts.get(key)}</span>
        </button>
      ))}
    </div>
  );
}
