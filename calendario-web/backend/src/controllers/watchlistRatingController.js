const WatchlistRating = require('../models/WatchlistRating');
const WatchlistItem = require('../models/WatchlistItem');

const POPULATE = { path: 'user', select: 'name' };

async function list(req, res) {
  const { item } = req.query;
  const filter = {};
  if (item) filter.item = item;

  const ratings = await WatchlistRating.find(filter).populate(POPULATE).sort({ createdAt: 1 });
  res.json(ratings);
}

async function create(req, res) {
  const { item: itemId, hearts, comment } = req.body;

  if (!itemId || !hearts) {
    return res.status(400).json({ message: 'Item e nota (corações) são obrigatórios' });
  }
  if (hearts < 1 || hearts > 5) {
    return res.status(400).json({ message: 'A nota deve ser entre 1 e 5 corações' });
  }

  const item = await WatchlistItem.findById(itemId);
  if (!item) {
    return res.status(404).json({ message: 'Item não encontrado' });
  }
  if (item.status !== 'visto_ouvido') {
    return res.status(400).json({ message: 'Só é possível avaliar itens já vistos/jogados' });
  }

  const rating = await WatchlistRating.create({
    item: itemId,
    hearts,
    comment: comment || '',
    user: req.userId,
  });

  const populated = await rating.populate(POPULATE);
  res.status(201).json(populated);
}

async function update(req, res) {
  const rating = await WatchlistRating.findById(req.params.id);
  if (!rating) return res.status(404).json({ message: 'Avaliação não encontrada' });
  if (String(rating.user) !== req.userId) {
    const err = new Error('Você só pode editar sua própria avaliação');
    err.status = 403;
    throw err;
  }

  const { hearts, comment } = req.body;
  if (hearts !== undefined) rating.hearts = hearts;
  if (comment !== undefined) rating.comment = comment;
  await rating.save();
  await rating.populate(POPULATE);

  res.json(rating);
}

async function remove(req, res) {
  const rating = await WatchlistRating.findById(req.params.id);
  if (!rating) return res.status(404).json({ message: 'Avaliação não encontrada' });
  if (String(rating.user) !== req.userId) {
    const err = new Error('Você só pode excluir sua própria avaliação');
    err.status = 403;
    throw err;
  }

  await WatchlistRating.findByIdAndDelete(rating._id);
  res.status(204).send();
}

module.exports = { list, create, update, remove };
