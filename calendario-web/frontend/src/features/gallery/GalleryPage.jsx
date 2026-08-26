import { useMemo, useState } from 'react';
import { HeartLoader } from '../../components/ui/index.js';
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
  const { events, loading } = useCalendarData();
  const photos = useMemo(() => allEventPhotos(events), [events]);

  // `undefined` = mês ainda não escolhido pelo usuário; nesse caso o mês exibido
  // é derivado das fotos a cada render, porque na primeira montagem os eventos
  // ainda não chegaram (loading) e um lazy initializer fixaria o valor errado.
  // Como a página remonta a cada navegação para /app/galeria, isso reproduz o
  // reset que o legado fazia ao abrir a view.
  const [selectedMonthKey, setSelectedMonthKey] = useState(undefined);
  const [lightbox, setLightbox] = useState(null);

  const monthKey = selectedMonthKey === undefined ? computeInitialMonthKey(photos) : selectedMonthKey;
  const visiblePhotos = monthKey ? photos.filter((photo) => photoMonthKey(photo.date) === monthKey) : photos;

  if (loading) {
    return (
      <section className="view">
        <HeartLoader />
      </section>
    );
  }

  return (
    <section className="view">
      <h2>Galeria</h2>
      <p>Todas as fotos adicionadas aos eventos, organizadas por mês.</p>

      <GalleryMonthStrip photos={photos} activeMonthKey={monthKey} onSelectMonth={setSelectedMonthKey} />
      <GalleryGrid
        photos={visiblePhotos}
        emptyMessage={
          photos.length === 0
            ? 'Nenhuma foto ainda. Anexe imagens aos eventos do calendário para vê-las aqui.'
            : 'Nenhuma foto neste mês.'
        }
        onOpenPhoto={(index) => setLightbox({ photos: visiblePhotos, index })}
      />

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
