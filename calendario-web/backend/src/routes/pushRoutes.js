const express = require('express');
const { getVapidPublicKey, subscribe, unsubscribe } = require('../controllers/pushController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/vapid-public-key', getVapidPublicKey);
router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);

module.exports = router;
