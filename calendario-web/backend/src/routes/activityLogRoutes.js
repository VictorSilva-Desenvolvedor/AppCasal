const express = require('express');
const { list } = require('../controllers/activityLogController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', list);

module.exports = router;
