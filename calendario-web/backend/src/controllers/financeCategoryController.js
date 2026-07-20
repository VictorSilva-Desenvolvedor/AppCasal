const FinanceCategory = require('../models/FinanceCategory');

async function list(req, res) {
  const categories = await FinanceCategory.find().sort({ type: 1, name: 1 });
  res.json(categories);
}

async function create(req, res) {
  const { name, type, color } = req.body;

  if (!name || !type) {
    return res.status(400).json({ message: 'Nome e tipo são obrigatórios' });
  }

  const category = await FinanceCategory.create({ name, type, color });
  res.status(201).json(category);
}

async function update(req, res) {
  const { name, type, color } = req.body;

  const category = await FinanceCategory.findByIdAndUpdate(
    req.params.id,
    { name, type, color },
    { new: true, runValidators: true }
  );

  if (!category) {
    return res.status(404).json({ message: 'Categoria não encontrada' });
  }

  res.json(category);
}

async function remove(req, res) {
  const category = await FinanceCategory.findByIdAndDelete(req.params.id);

  if (!category) {
    return res.status(404).json({ message: 'Categoria não encontrada' });
  }

  res.status(204).send();
}

module.exports = { list, create, update, remove };
