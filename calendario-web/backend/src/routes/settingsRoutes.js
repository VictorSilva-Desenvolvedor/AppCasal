const express = require('express');
const { get, update } = require('../controllers/settingsController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', get);
router.put('/', update);

module.exports = router;
