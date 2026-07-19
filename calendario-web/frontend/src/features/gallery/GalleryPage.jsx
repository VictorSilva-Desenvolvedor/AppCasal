import { useMemo, useState } from 'react';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { GalleryMonthStrip } from './GalleryMonthStrip.jsx';
import { GalleryGrid } from './GalleryGrid.jsx';
import { Lightbox } from './Lightbox.jsx';
import { allEventPhotos, photoMonthKey } from './galleryUtils.js';

function computeInitialMonthKey(photos) {
  const currentMonthKey = photoMonthKey(new Date());
  if (photos.some((photo) => photoMonthKey(photo.date) === currentMonthKey)) return currentMonthKey;
  if (photos.length === 0) return null;
  return [...new Set(photos.map((photo) => photoMonthKey(photo.date)))].sort().reverse()[0];
}

export function GalleryPage() {
  const { events } = useCalendarData();
  const photos = useMemo(() => allEventPhotos(events), [events]);

  // Lazy initializer roda uma vez por montagem — GalleryPage remonta a cada
  // navegação para /app/galeria, reproduzindo o reset que o legado fazia ao
  // trocar para a view (renderGallery() recalculava o mês sempre que a
  // galeria era aberta, mesmo que outro mês tivesse sido escolhido antes).
  const [monthKey, setMonthKey] = useState(() => computeInitialMonthKey(photos));
  const [lightbox, setLightbox] = useState(null);

  const visiblePhotos = monthKey ? photos.filter((photo) => photoMonthKey(photo.date) === monthKey) : photos;

  return (
    <section className="view">
      <h2>Galeria</h2>
      <p>Todas as fotos adicionadas aos eventos, organizadas por mês.</p>

      <GalleryMonthStrip photos={photos} activeMonthKey={monthKey} onSelectMonth={setMonthKey} />
      <GalleryGrid photos={visiblePhotos} onOpenPhoto={(index) => setLightbox({ photos: visiblePhotos, index })} />

      <Lightbox
        open={Boolean(lightbox)}
        photos={lightbox?.photos || []}
        index={lightbox?.index || 0}
        onIndexChange={(index) => setLightbox((prev) => (prev ? { ...prev, index } : prev))}
        onClose={() => setLightbox(null)}
      />
    </section>
  );
}
