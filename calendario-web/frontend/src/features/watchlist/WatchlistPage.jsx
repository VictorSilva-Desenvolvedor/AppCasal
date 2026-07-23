import { useCallback, useEffect, useState } from 'react';
import { Icon, Modal } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { useAuth } from '../../hooks/useAuth.js';
import { WatchlistBoard } from './WatchlistBoard.jsx';
import { WatchlistForm } from './WatchlistForm.jsx';
import { WatchlistRatingForm } from './WatchlistRatingForm.jsx';
import { WatchlistFilters } from './WatchlistFilters.jsx';
import { WatchlistLogo } from './WatchlistLogo.jsx';
import { groupRatingsByItem, ratingByUser } from './watchlistUtils.js';

export function WatchlistPage() {
  const { users } = useCalendarData();
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [onlyPending, setOnlyPending] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [ratingItem, setRatingItem] = useState(null);

  const reload = useCallback(async () => {
    const [itemsData, ratingsData] = await Promise.all([
      api.getWatchlistItems(),
      api.getWatchlistRatings(),
    ]);
    setItems(itemsData);
    setRatings(ratingsData);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const ratingsByItem = groupRatingsByItem(ratings);

  const visibleItems = items
    .filter((item) => !typeFilter || item.type === typeFilter)
    .filter((item) => !onlyPending || item.status !== 'visto_ouvido');

  function handleFormSaved() {
    setFormOpen(false);
    reload();
  }

  function handleRatingSaved() {
    setRatingItem(null);
    reload();
  }

  const myExistingRating = ratingItem
    ? ratingByUser(ratingsByItem.get(ratingItem._id) || [], user?._id)
    : null;

  return (
    <section className="view watchlist-page">
      <div className="watchlist-page-header">
        <div className="watchlist-page-header-title">
          <WatchlistLogo />
          <h2 className="watchlist-page-title">Watchlist a Dois</h2>
        </div>
      </div>

      <WatchlistFilters
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        onlyPending={onlyPending}
        onOnlyPendingChange={setOnlyPending}
      />

      <WatchlistBoard
        items={visibleItems}
        ratingsByItem={ratingsByItem}
        users={users}
        currentUserId={user?._id}
        onChanged={reload}
        onRate={setRatingItem}
      />

      <button type="button" className="watchlist-fab" onClick={() => setFormOpen(true)} aria-label="Adicionar item">
        <Icon name="plus" />
      </button>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Novo item">
        <WatchlistForm onSaved={handleFormSaved} onCancel={() => setFormOpen(false)} />
      </Modal>

      <Modal open={!!ratingItem} onClose={() => setRatingItem(null)} title={`Avaliar: ${ratingItem?.title ?? ''}`}>
        {ratingItem && (
          <WatchlistRatingForm
            item={ratingItem}
            existingRating={myExistingRating}
            onSaved={handleRatingSaved}
            onCancel={() => setRatingItem(null)}
          />
        )}
      </Modal>
    </section>
  );
}
