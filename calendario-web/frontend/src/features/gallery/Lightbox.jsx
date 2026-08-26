import { useEffect } from 'react';
import { Icon } from '../../components/ui/index.js';
import { fileUrl, formatDateOnly } from '../calendar/calendarUtils.js';

// Mesmo idioma do Modal genérico (sempre montado, visibilidade via classe
// is-open, para a transição CSS de opacity/visibility funcionar), mas com
// marcação própria — a estrutura do lightbox não se encaixa no card/header
// do Modal padrão.
export function Lightbox({ open, photos, index, onIndexChange, onClose }) {
  const total = photos.length;
  const photo = photos[index];

  useEffect(() => {
    if (!open) return undefined;
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
      if (total < 2) return;
      if (event.key === 'ArrowLeft') onIndexChange((index - 1 + total) % total);
      if (event.key === 'ArrowRight') onIndexChange((index + 1) % total);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, index, total, onIndexChange, onClose]);

  const dateLabel = photo ? formatDateOnly(photo.date) : '';

  return (
    <div
      className={`lightbox-overlay${open ? ' is-open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Visualização da foto"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button type="button" className="lightbox-close" aria-label="Fechar" onClick={onClose}>
        <Icon name="x" />
      </button>
      {total > 1 && (
        <button
          type="button"
          className="lightbox-nav lightbox-prev"
          aria-label="Foto anterior"
          onClick={() => onIndexChange((index - 1 + total) % total)}
        >
          <Icon name="chevron-left" />
        </button>
      )}
      {photo && (
        <img className="lightbox-image" src={fileUrl(photo.url)} alt={`Foto do evento ${photo.eventTitle}`} />
      )}
      {total > 1 && (
        <button
          type="button"
          className="lightbox-nav lightbox-next"
          aria-label="Próxima foto"
          onClick={() => onIndexChange((index + 1) % total)}
        >
          <Icon name="chevron-right" />
        </button>
      )}
      <div className="lightbox-caption">
        {photo ? `${photo.eventTitle} · ${dateLabel}${total > 1 ? ` · ${index + 1} de ${total}` : ''}` : ''}
      </div>
    </div>
  );
}
