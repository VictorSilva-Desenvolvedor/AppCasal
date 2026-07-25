const express = require('express');
const auth = require('../middleware/auth');
const { getWeeklySummary } = require('../controllers/weeklySummaryController');

const router = express.Router();

router.use(auth);
router.get('/', getWeeklySummary);

module.exports = router;
