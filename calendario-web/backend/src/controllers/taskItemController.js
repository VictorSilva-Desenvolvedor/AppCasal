const TaskItem = require('../models/TaskItem');
const User = require('../models/User');
const { notifyPartner } = require('../services/notificationService');
const { logActivity } = require('../services/activityLogger');

const KINDS = ['diaria', 'semanal', 'mensal', 'unica'];
const POPULATE = [
  { path: 'belongsTo', select: 'name' },
  { path: 'createdBy', select: 'name' },
];

async function list(req, res) {
  const { belongsTo, kind } = req.query;
  const filter = { team: req.userTeam };
  if (belongsTo) filter.belongsTo = belongsTo;
  if (kind) filter.kind = kind;

  const items = await TaskItem.find(filter).populate(POPULATE).sort({ createdAt: 1 });
  res.json(items);
}

async function create(req, res) {
  const { title, kind, belongsTo } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Título é obrigatório' });
  }
  if (!KINDS.includes(kind)) {
    return res.status(400).json({ message: 'Tipo de tarefa inválido' });
  }
  if (!belongsTo) {
    return res.status(400).json({ message: 'Selecione de quem é a lista' });
  }

  const owner = await User.findById(belongsTo);
  if (!owner || String(owner.team) !== req.userTeam) {
    return res.status(400).json({ message: 'Usuário inválido para essa equipe' });
  }

  const item = await TaskItem.create({
    title: title.trim(),
    kind,
    belongsTo,
    createdBy: req.userId,
    team: req.userTeam,
  });
  const populated = await item.populate(POPULATE);

  await logActivity({
    actor: req.userId,
    action: 'created',
    module: 'tarefa',
    item,
    itemTitle: item.title,
    team: req.userTeam,
  });

  res.status(201).json(populated);

  // Só notifica se o item foi adicionado à lista do OUTRO usuário — não faz
  // sentido notificar alguém que acabou de adicionar na própria lista.
  if (String(belongsTo) !== req.userId) {
    notifyPartner({
      actorId: req.userId,
      recipientId: belongsTo,
      title: 'Nova tarefa',
      body: `✅ Uma tarefa foi adicionada à sua lista: "${item.title}".`,
      link: '/app/tarefas',
      category: 'tarefa',
    }).catch((err) => console.error('Falha ao notificar nova tarefa:', err.message));
  }
}

async function toggle(req, res) {
  const item = await TaskItem.findById(req.params.id);
  if (!item || String(item.team) !== req.userTeam) {
    return res.status(404).json({ message: 'Tarefa não encontrada' });
  }

  // Qualquer membro do team pode marcar/desmarcar qualquer item.
  item.completed = !item.completed;
  item.completedAt = item.completed ? new Date() : null;
  await item.save();
  await item.populate(POPULATE);

  await logActivity({
    actor: req.userId,
    action: 'updated',
    module: 'tarefa',
    item,
    itemTitle: item.title,
    details: item.completed ? 'Tarefa marcada como concluída' : 'Tarefa desmarcada',
    team: req.userTeam,
  });

  res.json(item);

  if (item.completed) {
    notifyPartner({
      actorId: req.userId,
      title: 'Tarefa concluída',
      body: `✅ A tarefa "${item.title}" foi marcada como concluída.`,
      link: '/app/tarefas',
      category: 'tarefa',
    }).catch((err) => console.error('Falha ao notificar conclusão de tarefa:', err.message));
  }
}

async function remove(req, res) {
  const item = await TaskItem.findById(req.params.id);
  if (!item || String(item.team) !== req.userTeam) {
    return res.status(404).json({ message: 'Tarefa não encontrada' });
  }
  // Só o dono da lista remove, mesmo que quem tenha criado o item tenha sido
  // o parceiro.
  if (String(item.belongsTo) !== req.userId) {
    const err = new Error('Você só pode remover itens da sua própria lista');
    err.status = 403;
    throw err;
  }

  await TaskItem.findByIdAndDelete(item._id);

  await logActivity({
    actor: req.userId,
    action: 'deleted',
    module: 'tarefa',
    itemTitle: item.title,
    team: req.userTeam,
  });

  res.status(204).send();

  notifyPartner({
    actorId: req.userId,
    title: 'Tarefa removida',
    body: `🗑️ A tarefa "${item.title}" foi removida.`,
    link: '/app/tarefas',
    category: 'tarefa',
  }).catch((err) => console.error('Falha ao notificar remoção de tarefa:', err.message));
}

module.exports = { list, create, toggle, remove };
