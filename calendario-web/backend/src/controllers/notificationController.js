const Notification = require('../models/Notification');

async function list(req, res) {
  const limit = Number(req.query.limit) || 50;
  const notifications = await Notification.find({ recipient: req.userId })
    .sort({ createdAt: -1 })
    .limit(limit);
  res.json(notifications);
}

async function unreadCount(req, res) {
  const count = await Notification.countDocuments({ recipient: req.userId, read: false });
  res.json({ count });
}

async function markRead(req, res) {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.userId },
    { read: true, readAt: new Date() },
    { new: true }
  );
  if (!notification) return res.status(404).json({ message: 'Notificação não encontrada' });

  res.json(notification);
}

async function markAllRead(req, res) {
  await Notification.updateMany(
    { recipient: req.userId, read: false },
    { read: true, readAt: new Date() }
  );
  res.status(204).send();
}

module.exports = { list, unreadCount, markRead, markAllRead };
