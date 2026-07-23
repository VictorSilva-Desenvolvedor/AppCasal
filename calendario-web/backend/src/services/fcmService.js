const { initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const DeviceToken = require('../models/DeviceToken');

// Precisa bater com o canal criado no app (useFcmRegistration.js) — sem
// isso o Android usa o canal "Miscellaneous" padrão do FCM, com
// importância baixa (sem heads-up/som).
const ANDROID_CHANNEL_ID = 'appcasal_default';

let fcmReady = false;

// firebase-admin v14 não expõe mais a API antiga (admin.credential.cert,
// admin.messaging()) no objeto principal — só os submódulos modulares.
if (process.env.FCM_SERVICE_ACCOUNT_JSON) {
  try {
    initializeApp({
      credential: cert(JSON.parse(process.env.FCM_SERVICE_ACCOUNT_JSON)),
    });
    fcmReady = true;
    console.log('[FCM] firebase-admin inicializado com sucesso — push notifications ativo.');
  } catch (err) {
    console.error('[FCM] Falha ao iniciar firebase-admin:', err.message);
  }
} else {
  console.warn('[FCM] FCM_SERVICE_ACCOUNT_JSON não definida — push notifications desativado.');
}

function isFcmReady() {
  return fcmReady;
}

async function sendFcmPush(userId, payload) {
  if (!fcmReady) return false;

  const tokens = await DeviceToken.find({ user: userId });
  if (tokens.length === 0) return false;

  let sentAny = false;

  for (const deviceToken of tokens) {
    try {
      await getMessaging().send({
        token: deviceToken.token,
        notification: { title: payload.title, body: payload.body },
        data: { link: payload.link || '' },
        android: {
          priority: 'high',
          notification: {
            channelId: ANDROID_CHANNEL_ID,
            priority: 'high',
            defaultSound: true,
            visibility: 'public',
          },
        },
      });
      sentAny = true;
    } catch (err) {
      if (
        err.code === 'messaging/registration-token-not-registered' ||
        err.code === 'messaging/invalid-argument'
      ) {
        await DeviceToken.deleteOne({ _id: deviceToken._id });
      } else {
        console.error('Falha ao enviar FCM para', userId, ':', err.message);
      }
    }
  }

  return sentAny;
}

module.exports = { isFcmReady, sendFcmPush };
