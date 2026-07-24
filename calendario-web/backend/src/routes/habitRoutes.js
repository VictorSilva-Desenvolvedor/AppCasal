const express = require('express');
const { list, create, update, archive, remove, freeze } = require('../controllers/habitController');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);
router.get('/', list);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id/permanent', remove);
router.delete('/:id', archive);
router.post('/:id/freeze', freeze);

module.exports = router;
