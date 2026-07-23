const express = require('express');
const { getStatus } = require('../controllers/whatsappController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/status', getStatus);

module.exports = router;
