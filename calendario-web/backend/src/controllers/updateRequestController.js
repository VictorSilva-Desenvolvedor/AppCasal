const UpdateRequest = require('../models/UpdateRequest');
const { generateTaskDraft } = require('../services/aiService');
const { notifyPartner } = require('../services/notificationService');

async function list(req, res) {
  const requests = await UpdateRequest.find({ team: req.userTeam }).populate('creator', 'name').sort({ createdAt: -1 });
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
    team: req.userTeam,
  });

  const populated = await request.populate('creator', 'name');
  res.status(201).json(populated);

  notifyPartner({
    actorId: req.userId,
    title: 'Novo pedido de atualização',
    body: `🛠️ Novo pedido criado: "${request.title}".`,
    link: '/app/atualizacoes',
    category: 'update-request',
  }).catch((err) => console.error('Falha ao notificar pedido de atualização:', err.message));
}

async function update(req, res) {
  const { title, description, status } = req.body;
  const changes = {};
  if (title !== undefined) changes.title = title;
  if (description !== undefined) changes.description = description;
  if (status !== undefined) changes.status = status;

  const request = await UpdateRequest.findOneAndUpdate({ _id: req.params.id, team: req.userTeam }, changes, {
    new: true,
    runValidators: true,
  }).populate('creator', 'name');

  if (!request) {
    return res.status(404).json({ message: 'Pedido não encontrado' });
  }

  res.json(request);

  notifyPartner({
    actorId: req.userId,
    title: 'Pedido de atualização atualizado',
    body: `🛠️ O pedido "${request.title}" foi atualizado.`,
    link: '/app/atualizacoes',
    category: 'update-request',
  }).catch((err) => console.error('Falha ao notificar atualização de pedido:', err.message));
}

async function remove(req, res) {
  const request = await UpdateRequest.findOneAndDelete({ _id: req.params.id, team: req.userTeam });

  if (!request) {
    return res.status(404).json({ message: 'Pedido não encontrado' });
  }

  res.status(204).send();

  notifyPartner({
    actorId: req.userId,
    title: 'Pedido de atualização removido',
    body: `🛠️ O pedido "${request.title}" foi removido.`,
    link: '/app/atualizacoes',
    category: 'update-request',
  }).catch((err) => console.error('Falha ao notificar remoção de pedido:', err.message));
}

async function generateDraft(req, res) {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ message: 'Descreva a ideia para gerar a tarefa' });
  }

  try {
    const draft = await generateTaskDraft(text.trim());
    res.json(draft);
  } catch (err) {
    console.error('Falha ao gerar tarefa com IA:', err.message);
    if (err.code === 'AI_NOT_CONFIGURED') {
      return res.status(503).json({ message: 'Geração com IA indisponível no momento. Preencha manualmente.' });
    }
    res.status(500).json({ message: 'Não foi possível gerar a tarefa com IA. Tente novamente ou preencha manualmente.' });
  }
}

module.exports = { list, create, update, remove, generateDraft };
