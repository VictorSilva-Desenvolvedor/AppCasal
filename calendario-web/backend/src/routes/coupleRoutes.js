const express = require('express');
const auth = require('../middleware/auth');
const { createCode, join } = require('../controllers/coupleController');

const router = express.Router();

router.use(auth);
router.post('/code', createCode);
router.post('/join', join);

module.exports = router;
