const express = require('express');
const { runNow } = require('../controllers/reminderController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.post('/run-now', runNow);

module.exports = router;
