const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

const vapidConfigured = Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

if (vapidConfigured) {
  webpush.setVapidDetails(
    process.env.VAPID_CONTACT_EMAIL || 'mailto:no-reply@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

function isPushReady() {
  return vapidConfigured;
}

async function sendPushNotification(userId, payload) {
  if (!vapidConfigured) return false;

  const subscriptions = await PushSubscription.find({ user: userId });
  if (subscriptions.length === 0) return false;

  let sentAny = false;

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
        },
        JSON.stringify(payload)
      );
      sentAny = true;
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        await PushSubscription.deleteOne({ _id: subscription._id });
      } else {
        console.error('Falha ao enviar push para', userId, ':', err.message);
      }
    }
  }

  return sentAny;
}

module.exports = { isPushReady, sendPushNotification };
