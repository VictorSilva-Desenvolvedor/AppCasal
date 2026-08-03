const TaskItem = require('../models/TaskItem');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { notifyPartner } = require('../services/notificationService');
const { logActivity } = require('../services/activityLogger');
const { ensureTaskItemsReset } = require('../services/taskItemResetService');
const { todayKeyInTimezone } = require('../utils/dayKey');

const KINDS = ['diaria', 'semanal', 'mensal', 'unica'];
const PERIODS = ['manha', 'tarde', 'noite', 'dia-todo'];

// Período só organiza as diárias; nos outros tipos o campo é sempre 'dia-todo'
// pra não abrir uma dimensão que a tela não mostra.
function normalizePeriod(period, kind) {
  if (kind !== 'diaria') return 'dia-todo';
  return PERIODS.includes(period) ? period : 'dia-todo';
}
const POPULATE = [
  { path: 'belongsTo', select: 'name' },
  { path: 'createdBy', select: 'name' },
];

// O dono da lista manda sempre. Quem só adicionou (createdBy) mexe enquanto o
// item não foi concluído — o suficiente pra desfazer um item colocado na lista
// do parceiro por engano, sem poder apagar um trabalho que já foi feito.
function canManage(item, userId) {
  if (String(item.belongsTo) === userId) return true;
  return String(item.createdBy) === userId && !item.completed;
}

function forbidden() {
  const err = new Error('Você só pode alterar itens da sua lista ou que você mesmo adicionou');
  err.status = 403;
  return err;
}

async function list(req, res) {
  // Terceira camada do reset diário (além do cron e do boot): garante que quem
  // abre a tela depois da virada do dia veja as diárias zeradas mesmo que o
  // servidor tenha passado a meia-noite fora do ar. Roda no máximo 1x por dia
  // por processo. Falhar aqui não pode derrubar a leitura da tela — no pior
  // caso a lista vem com as marcações de ontem e o cron corrige depois.
  await ensureTaskItemsReset().catch((err) =>
    console.error('Falha ao resetar tarefas na leitura:', err.message)
  );

  const { belongsTo, kind } = req.query;
  const filter = { team: req.userTeam };
  if (belongsTo) filter.belongsTo = belongsTo;
  if (kind) filter.kind = kind;

  // createdAt desempata os itens que nunca foram arrastados (order 0), mantendo
  // a ordem em que sempre apareceram.
  const items = await TaskItem.find(filter).populate(POPULATE).sort({ order: 1, createdAt: 1 });
  res.json(items);
}

async function create(req, res) {
  const { title, kind, belongsTo, period } = req.body;

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

  // Entra no fim da seção a que pertence, não no topo.
  const itemPeriod = normalizePeriod(period, kind);
  const last = await TaskItem.findOne({ team: req.userTeam, belongsTo, kind, period: itemPeriod })
    .sort({ order: -1 })
    .select('order');

  const item = await TaskItem.create({
    title: title.trim(),
    kind,
    period: itemPeriod,
    order: (last?.order ?? -1) + 1,
    belongsTo,
    createdBy: req.userId,
    team: req.userTeam,
    // Já nasce com o dia de hoje pra não ser desmarcado pelo reset de hoje —
    // ver o passe de baseline em taskItemResetService.
    lastResetKey: todayKeyInTimezone(),
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

async function update(req, res) {
  const { title, period } = req.body;

  const item = await TaskItem.findById(req.params.id);
  if (!item || String(item.team) !== req.userTeam) {
    return res.status(404).json({ message: 'Tarefa não encontrada' });
  }
  if (!canManage(item, req.userId)) throw forbidden();

  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'Título é obrigatório' });
    }
    item.title = title.trim();
  }
  // Mover de manhã pra tarde é a operação natural aqui — sem isso só dava pra
  // trocar de período apagando e recriando a tarefa.
  if (period !== undefined) {
    item.period = normalizePeriod(period, item.kind);
  }

  await item.save();
  await item.populate(POPULATE);

  await logActivity({
    actor: req.userId,
    action: 'updated',
    module: 'tarefa',
    item,
    itemTitle: item.title,
    details: period !== undefined && title === undefined ? 'Período da tarefa alterado' : 'Tarefa editada',
    team: req.userTeam,
  });

  res.json(item);
}

// Recebe a composição inteira de uma seção (mesmo belongsTo + kind + period) na
// ordem em que ela aparece na tela, e grava isso em `order`. Mover entre
// períodos é o mesmo request: o item chega na lista de ids do período destino.
// `kind` nunca muda aqui — trocar de tipo continua sendo pela edição.
async function reorder(req, res) {
  const { belongsTo, kind, period, ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'Nenhuma tarefa para reordenar' });
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

  // Carrega antes de escrever: um id de outro time (ou inexistente) invalida o
  // request inteiro, em vez de gravar metade da nova ordem.
  const items = await TaskItem.find({ _id: { $in: ids }, team: req.userTeam });
  if (items.length !== ids.length) {
    return res.status(400).json({ message: 'Tarefa inválida para essa equipe' });
  }

  const nextPeriod = normalizePeriod(period, kind);
  await TaskItem.bulkWrite(
    ids.map((id, index) => ({
      updateOne: {
        filter: { _id: id, team: req.userTeam },
        update: { $set: { order: index, period: nextPeriod } },
      },
    }))
  );

  // Uma entrada por reordenação, não uma por item.
  await logActivity({
    actor: req.userId,
    action: 'updated',
    module: 'tarefa',
    itemTitle: `${ids.length} tarefa(s)`,
    details: 'Tarefas reordenadas',
    team: req.userTeam,
  });

  const updated = await TaskItem.find({ _id: { $in: ids } })
    .populate(POPULATE)
    .sort({ order: 1, createdAt: 1 });

  res.json(updated);
}

// Avisa uma única vez por dia que a pessoa fechou 100% das próprias diárias.
// A dedupe é por ator + dia: sem ela, desmarcar e remarcar o último item
// dispararia o aviso de novo.
async function notifyDailyGoalReached(req, item) {
  const pending = await TaskItem.countDocuments({
    team: req.userTeam,
    belongsTo: item.belongsTo._id,
    kind: 'diaria',
    completed: false,
  });
  if (pending > 0) return;

  const startOfDay = new Date(`${todayKeyInTimezone()}T00:00:00.000-03:00`);
  const alreadySent = await Notification.exists({
    actor: req.userId,
    category: 'tarefa-dia',
    createdAt: { $gte: startOfDay },
  });
  if (alreadySent) return;

  const actor = await User.findById(req.userId, 'name');
  await notifyPartner({
    actorId: req.userId,
    title: 'Dia completo',
    body: `🎉 ${actor?.name ?? 'Seu par'} concluiu todas as tarefas diárias de hoje.`,
    link: '/app/tarefas',
    category: 'tarefa-dia',
  });
}

async function toggle(req, res) {
  const item = await TaskItem.findById(req.params.id);
  if (!item || String(item.team) !== req.userTeam) {
    return res.status(404).json({ message: 'Tarefa não encontrada' });
  }

  // Qualquer membro do team pode marcar/desmarcar qualquer item.
  const isOwnList = String(item.belongsTo) === req.userId;
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

  if (!item.completed) return;

  // Concluir item da própria lista é rotina: notificar cada um viraria uma
  // notificação por tarefa diária, todo dia. Só avisa o que o outro precisa
  // saber — alguém mexeu na lista dele, ou o dia inteiro fechou.
  if (!isOwnList) {
    notifyPartner({
      actorId: req.userId,
      recipientId: item.belongsTo._id,
      title: 'Tarefa concluída',
      body: `✅ A tarefa "${item.title}" da sua lista foi marcada como concluída.`,
      link: '/app/tarefas',
      category: 'tarefa',
    }).catch((err) => console.error('Falha ao notificar conclusão de tarefa:', err.message));
  } else if (item.kind === 'diaria') {
    notifyDailyGoalReached(req, item).catch((err) =>
      console.error('Falha ao notificar dia completo de tarefas:', err.message)
    );
  }
}

async function remove(req, res) {
  const item = await TaskItem.findById(req.params.id);
  if (!item || String(item.team) !== req.userTeam) {
    return res.status(404).json({ message: 'Tarefa não encontrada' });
  }
  if (!canManage(item, req.userId)) throw forbidden();

  const wasOwnList = String(item.belongsTo) === req.userId;

  await TaskItem.findByIdAndDelete(item._id);

  await logActivity({
    actor: req.userId,
    action: 'deleted',
    module: 'tarefa',
    itemTitle: item.title,
    team: req.userTeam,
  });

  res.status(204).send();

  // Simétrico ao create: só avisa quando a remoção mexeu na lista do outro.
  if (!wasOwnList) {
    notifyPartner({
      actorId: req.userId,
      recipientId: item.belongsTo,
      title: 'Tarefa removida',
      body: `🗑️ A tarefa "${item.title}" foi removida da sua lista.`,
      link: '/app/tarefas',
      category: 'tarefa',
    }).catch((err) => console.error('Falha ao notificar remoção de tarefa:', err.message));
  }
}

module.exports = { list, create, update, reorder, toggle, remove };
