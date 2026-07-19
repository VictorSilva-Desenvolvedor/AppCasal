const UpdateRequest = require('../models/UpdateRequest');

async function list(req, res) {
  const requests = await UpdateRequest.find().populate('creator', 'name').sort({ createdAt: -1 });
  res.json(requests);
}

async function create(req, res) {
  const { title, description, status } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Título é obrigatório' });
  }

  const request = await UpdateRequest.create({
    title,
    description,
    status: status || 'todo',
    creator: req.userId,
  });

  const populated = await request.populate('creator', 'name');
  res.status(201).json(populated);
}

async function update(req, res) {
  const { title, description, status } = req.body;
  const changes = {};
  if (title !== undefined) changes.title = title;
  if (description !== undefined) changes.description = description;
  if (status !== undefined) changes.status = status;

  const request = await UpdateRequest.findByIdAndUpdate(req.params.id, changes, {
    new: true,
    runValidators: true,
  }).populate('creator', 'name');

  if (!request) {
    return res.status(404).json({ message: 'Pedido não encontrado' });
  }

  res.json(request);
}

async function remove(req, res) {
  const request = await UpdateRequest.findByIdAndDelete(req.params.id);

  if (!request) {
    return res.status(404).json({ message: 'Pedido não encontrado' });
  }

  res.status(204).send();
}

module.exports = { list, create, update, remove };
