const admin = require('firebase-admin');
const DeviceToken = require('../models/DeviceToken');

let fcmReady = false;

if (process.env.FCM_SERVICE_ACCOUNT_JSON) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FCM_SERVICE_ACCOUNT_JSON)),
    });
    fcmReady = true;
  } catch (err) {
    console.error('Falha ao iniciar firebase-admin:', err.message);
  }
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
      await admin.messaging().send({
        token: deviceToken.token,
        notification: { title: payload.title, body: payload.body },
        data: { link: payload.link || '' },
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
