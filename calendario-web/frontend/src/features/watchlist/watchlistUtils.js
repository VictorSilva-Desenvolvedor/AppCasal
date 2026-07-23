export const STATUS_COLUMNS = [
  { status: 'quero_ver', label: 'Quero ver/jogar' },
  { status: 'em_andamento', label: 'Vendo/Jogando' },
  { status: 'visto_ouvido', label: 'Visto/Jogado' },
];

export const TYPE_META = {
  filme: { label: 'Filme', emoji: '🎬', icon: 'film', colorVar: '--watch-terracota' },
  serie: { label: 'Série', emoji: '📺', icon: 'tv', colorVar: '--watch-petroleo' },
  jogo: { label: 'Jogo', emoji: '🎮', icon: 'gamepad', colorVar: '--watch-rosa' },
};

function ratingUserId(rating) {
  return rating.user?._id ?? rating.user;
}

export function groupRatingsByItem(ratings) {
  const map = new Map();
  ratings.forEach((rating) => {
    const itemId = rating.item?._id ?? rating.item;
    if (!map.has(itemId)) map.set(itemId, []);
    map.get(itemId).push(rating);
  });
  return map;
}

export function ratingByUser(itemRatings, userId) {
  return itemRatings.find((r) => ratingUserId(r) === userId) || null;
}

// "Totalmente avaliado" = os dois usuários do app já deram sua nota nesse item
// — é essa transição (false -> true) que dispara o coração/confete no card.
export function isFullyRated(itemRatings, users) {
  if (!users.length) return false;
  return users.every((u) => itemRatings.some((r) => ratingUserId(r) === u._id));
}

export function initialOf(name) {
  return (name || '?').trim().charAt(0).toUpperCase();
}
