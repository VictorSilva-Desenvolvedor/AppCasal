const express = require('express');
const {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  registerDeviceToken,
  unregisterDeviceToken,
} = require('../controllers/pushController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/vapid-public-key', getVapidPublicKey);
router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);
router.post('/device-token', registerDeviceToken);
router.delete('/device-token', unregisterDeviceToken);

module.exports = router;
