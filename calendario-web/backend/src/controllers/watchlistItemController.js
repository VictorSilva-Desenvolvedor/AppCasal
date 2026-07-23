const WatchlistItem = require('../models/WatchlistItem');
const WatchlistRating = require('../models/WatchlistRating');
const { searchPoster } = require('../services/posterSearch');

const POPULATE = { path: 'creator', select: 'name' };
const TYPES = ['filme', 'serie', 'jogo'];

async function list(req, res) {
  const { type, status } = req.query;
  const filter = {};
  if (type) filter.type = type;
  if (status) filter.status = status;

  const items = await WatchlistItem.find(filter).populate(POPULATE).sort({ createdAt: -1 });
  res.json(items);
}

async function create(req, res) {
  const { title, type, note, posterUrl } = req.body;

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
    creator: req.userId,
  });

  const populated = await item.populate(POPULATE);
  res.status(201).json(populated);
}

async function update(req, res) {
  const { title, type, status, note, posterUrl } = req.body;
  const changes = {};
  if (title !== undefined) changes.title = title;
  if (type !== undefined) changes.type = type;
  if (status !== undefined) changes.status = status;
  if (note !== undefined) changes.note = note;
  if (posterUrl !== undefined) changes.posterUrl = posterUrl;

  const item = await WatchlistItem.findByIdAndUpdate(req.params.id, changes, {
    new: true,
    runValidators: true,
  }).populate(POPULATE);

  if (!item) return res.status(404).json({ message: 'Item não encontrado' });

  res.json(item);
}

async function posterSearchHandler(req, res) {
  const { type, query } = req.query;

  if (!TYPES.includes(type)) {
    return res.status(400).json({ message: 'Tipo inválido' });
  }

  const results = await searchPoster(type, (query || '').trim());
  res.json(results);
}

async function remove(req, res) {
  const item = await WatchlistItem.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: 'Item não encontrado' });

  // Avaliações órfãs de um item excluído não fazem sentido — remove junto.
  await WatchlistRating.deleteMany({ item: item._id });

  res.status(204).send();
}

module.exports = { list, create, update, remove, posterSearchHandler };
