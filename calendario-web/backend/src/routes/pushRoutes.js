const express = require('express');
const {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  registerDeviceToken,
  unregisterDeviceToken,
  testPush,
} = require('../controllers/pushController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/vapid-public-key', getVapidPublicKey);
router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);
router.post('/device-token', registerDeviceToken);
router.delete('/device-token', unregisterDeviceToken);
router.post('/test', testPush);

module.exports = router;
