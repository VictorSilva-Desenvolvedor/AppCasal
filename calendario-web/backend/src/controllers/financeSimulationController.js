const FinanceSimulation = require('../models/FinanceSimulation');

async function list(req, res) {
  const simulations = await FinanceSimulation.find({ team: req.userTeam, creator: req.userId }).sort({
    createdAt: -1,
  });
  res.json(simulations);
}

async function create(req, res) {
  const { name, month, year, excludedEntryIds, hypotheticalEntries } = req.body;

  if (!name || !month || !year) {
    return res.status(400).json({ message: 'Nome, mês e ano são obrigatórios' });
  }

  const simulation = await FinanceSimulation.create({
    name,
    month,
    year,
    excludedEntryIds: excludedEntryIds || [],
    hypotheticalEntries: hypotheticalEntries || [],
    creator: req.userId,
    team: req.userTeam,
  });

  res.status(201).json(simulation);
}

async function update(req, res) {
  const { name, month, year, excludedEntryIds, hypotheticalEntries } = req.body;

  const before = await FinanceSimulation.findById(req.params.id);
  if (!before || String(before.team) !== req.userTeam) {
    return res.status(404).json({ message: 'Simulação não encontrada' });
  }
  if (String(before.creator) !== req.userId) {
    const err = new Error('Você só pode editar simulações que você mesmo criou');
    err.status = 403;
    throw err;
  }

  const simulation = await FinanceSimulation.findByIdAndUpdate(
    req.params.id,
    { name, month, year, excludedEntryIds, hypotheticalEntries },
    { new: true, runValidators: true }
  );

  res.json(simulation);
}

async function remove(req, res) {
  const simulation = await FinanceSimulation.findById(req.params.id);

  if (!simulation || String(simulation.team) !== req.userTeam) {
    return res.status(404).json({ message: 'Simulação não encontrada' });
  }
  if (String(simulation.creator) !== req.userId) {
    const err = new Error('Você só pode excluir simulações que você mesmo criou');
    err.status = 403;
    throw err;
  }

  await FinanceSimulation.findByIdAndDelete(req.params.id);

  res.status(204).send();
}

module.exports = { list, create, update, remove };
