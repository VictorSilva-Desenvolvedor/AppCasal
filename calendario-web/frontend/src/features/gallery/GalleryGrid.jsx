import { fileUrl } from '../calendar/calendarUtils.js';

export function GalleryGrid({ photos, onOpenPhoto, emptyMessage = 'Nenhuma foto neste mês.' }) {
  if (photos.length === 0) {
    return <p className="sidebar-empty">{emptyMessage}</p>;
  }

  return (
    <div className="gallery-grid">
      {photos.map((photo, index) => (
        <button
          type="button"
          className="gallery-thumb"
          key={`${photo.eventId}-${photo.url}`}
          onClick={() => onOpenPhoto(index)}
          title={photo.eventTitle}
        >
          <img src={fileUrl(photo.url)} alt={`Foto do evento ${photo.eventTitle}`} loading="lazy" />
        </button>
      ))}
    </div>
  );
}
