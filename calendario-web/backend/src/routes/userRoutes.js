const express = require('express');
const { list } = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', list);

module.exports = router;
