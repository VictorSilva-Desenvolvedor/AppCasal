import { fileUrl } from '../calendar/calendarUtils.js';

export function GalleryGrid({ photos, onOpenPhoto }) {
  if (photos.length === 0) {
    return <p className="sidebar-empty">Nenhuma foto neste período.</p>;
  }

  return (
    <div className="gallery-grid">
      {photos.map((photo, index) => (
        <button
          type="button"
          className="gallery-thumb"
          key={`${photo.eventId}-${photo.url}`}
          onClick={() => onOpenPhoto(index)}
        >
          <img src={fileUrl(photo.url)} alt={photo.name} loading="lazy" />
        </button>
      ))}
    </div>
  );
}
