const PushSubscription = require('../models/PushSubscription');
const DeviceToken = require('../models/DeviceToken');
const { isFcmReady, sendFcmPush } = require('../services/fcmService');

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

async function testPush(req, res) {
  if (!isFcmReady()) {
    return res.json({ fcmReady: false, deviceCount: 0, sent: false, message: 'FCM não configurado no backend (FCM_SERVICE_ACCOUNT_JSON ausente ou inválida).' });
  }

  const deviceCount = await DeviceToken.countDocuments({ user: req.userId });
  if (deviceCount === 0) {
    return res.json({ fcmReady: true, deviceCount: 0, sent: false, message: 'Nenhum dispositivo registrado para este usuário. Abra o app no celular (ele registra o token automaticamente ao iniciar).' });
  }

  const sent = await sendFcmPush(req.userId, {
    title: 'Teste de notificação',
    body: 'Se você está vendo isso, o push está funcionando!',
    link: '/',
  });

  res.json({ fcmReady: true, deviceCount, sent, message: sent ? 'Push enviado.' : 'Envio falhou — veja o log do backend para o motivo.' });
}

module.exports = { getVapidPublicKey, subscribe, unsubscribe, registerDeviceToken, unregisterDeviceToken, testPush };
