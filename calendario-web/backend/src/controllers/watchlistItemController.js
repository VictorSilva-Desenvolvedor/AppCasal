const WatchlistItem = require('../models/WatchlistItem');
const WatchlistRating = require('../models/WatchlistRating');
const { searchPoster, getDetails } = require('../services/posterSearch');
const { notifyPartner } = require('../services/notificationService');

const POPULATE = { path: 'creator', select: 'name' };
const TYPES = ['filme', 'serie', 'jogo'];

async function list(req, res) {
  const { type, status } = req.query;
  const filter = { team: req.userTeam };
  if (type) filter.type = type;
  if (status) filter.status = status;

  const items = await WatchlistItem.find(filter).populate(POPULATE).sort({ createdAt: -1 });
  res.json(items);
}

async function create(req, res) {
  const { title, type, note, posterUrl, genres, director, duration, rating, synopsis } = req.body;

  if (!title || !type) {
    return res.status(400).json({ message: 'Título e tipo são obrigatórios' });
  }
  if (!TYPES.includes(type)) {
    return res.status(400).json({ message: 'Tipo inválido' });
  }

  const item = await WatchlistItem.create({
    title,
    type,
    note: note || '',
    posterUrl: posterUrl || '',
    genres: genres || [],
    director: director || '',
    duration: duration || '',
    rating: rating ?? null,
    synopsis: synopsis || '',
    creator: req.userId,
    team: req.userTeam,
  });

  const populated = await item.populate(POPULATE);
  res.status(201).json(populated);

  notifyPartner({
    actorId: req.userId,
    title: 'Novo item na watchlist',
    body: `📺 "${item.title}" foi adicionado à watchlist.`,
    link: '/app/watchlist',
    category: 'watchlist',
  }).catch((err) => console.error('Falha ao notificar item da watchlist:', err.message));
}

async function update(req, res) {
  const { title, type, status, note, posterUrl, genres, director, duration, rating, synopsis } = req.body;
  const changes = {};
  if (title !== undefined) changes.title = title;
  if (type !== undefined) changes.type = type;
  if (status !== undefined) changes.status = status;
  if (note !== undefined) changes.note = note;
  if (posterUrl !== undefined) changes.posterUrl = posterUrl;
  if (genres !== undefined) changes.genres = genres;
  if (director !== undefined) changes.director = director;
  if (duration !== undefined) changes.duration = duration;
  if (rating !== undefined) changes.rating = rating;
  if (synopsis !== undefined) changes.synopsis = synopsis;

  const previous = await WatchlistItem.findById(req.params.id, 'status team');
  if (!previous || String(previous.team) !== req.userTeam) return res.status(404).json({ message: 'Item não encontrado' });

  const item = await WatchlistItem.findByIdAndUpdate(req.params.id, changes, {
    new: true,
    runValidators: true,
  }).populate(POPULATE);

  res.json(item);

  const justWatched = status === 'visto_ouvido' && previous.status !== 'visto_ouvido';
  notifyPartner({
    actorId: req.userId,
    title: justWatched ? 'Item assistido' : 'Watchlist atualizada',
    body: justWatched
      ? `✅ "${item.title}" foi marcado como visto/jogado.`
      : `📺 O item "${item.title}" da watchlist foi atualizado.`,
    link: '/app/watchlist',
    category: 'watchlist',
  }).catch((err) => console.error('Falha ao notificar atualização da watchlist:', err.message));
}

async function posterSearchHandler(req, res) {
  const { type, query } = req.query;

  if (!TYPES.includes(type)) {
    return res.status(400).json({ message: 'Tipo inválido' });
  }

  const results = await searchPoster(type, (query || '').trim());
  res.json(results);
}

async function posterDetailsHandler(req, res) {
  const { type, id } = req.query;

  if (!TYPES.includes(type)) {
    return res.status(400).json({ message: 'Tipo inválido' });
  }

  const details = await getDetails(type, id);
  res.json(details || {});
}

async function remove(req, res) {
  const item = await WatchlistItem.findOneAndDelete({ _id: req.params.id, team: req.userTeam });
  if (!item) return res.status(404).json({ message: 'Item não encontrado' });

  // Avaliações órfãs de um item excluído não fazem sentido — remove junto.
  await WatchlistRating.deleteMany({ item: item._id });

  res.status(204).send();

  notifyPartner({
    actorId: req.userId,
    title: 'Item removido da watchlist',
    body: `📺 "${item.title}" foi removido da watchlist.`,
    link: '/app/watchlist',
    category: 'watchlist',
  }).catch((err) => console.error('Falha ao notificar remoção da watchlist:', err.message));
}

module.exports = { list, create, update, remove, posterSearchHandler, posterDetailsHandler };
