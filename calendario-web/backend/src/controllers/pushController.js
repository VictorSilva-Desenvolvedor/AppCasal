const PushSubscription = require('../models/PushSubscription');
const DeviceToken = require('../models/DeviceToken');

function getVapidPublicKey(req, res) {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
}

async function subscribe(req, res) {
  const { endpoint, keys } = req.body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ message: 'Assinatura de push inválida' });
  }

  await PushSubscription.findOneAndUpdate(
    { endpoint },
    { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth }, user: req.userId },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(201).json({ message: 'Inscrito para notificações push' });
}

async function unsubscribe(req, res) {
  const { endpoint } = req.body;
  if (!endpoint) {
    return res.status(400).json({ message: 'endpoint é obrigatório' });
  }

  await PushSubscription.deleteOne({ endpoint, user: req.userId });
  res.status(204).send();
}

async function registerDeviceToken(req, res) {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: 'token é obrigatório' });
  }

  await DeviceToken.findOneAndUpdate(
    { token },
    { token, user: req.userId, platform: 'android' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(201).json({ message: 'Dispositivo registrado para notificações push' });
}

async function unregisterDeviceToken(req, res) {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: 'token é obrigatório' });
  }

  await DeviceToken.deleteOne({ token, user: req.userId });
  res.status(204).send();
}

module.exports = { getVapidPublicKey, subscribe, unsubscribe, registerDeviceToken, unregisterDeviceToken };
