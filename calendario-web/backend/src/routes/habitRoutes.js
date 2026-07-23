const express = require('express');
const { list, create, update, archive } = require('../controllers/habitController');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);
router.get('/', list);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', archive);

module.exports = router;
