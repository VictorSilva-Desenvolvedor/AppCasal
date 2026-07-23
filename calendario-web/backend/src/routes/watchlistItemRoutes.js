const express = require('express');
const { list, create, update, remove, posterSearchHandler } = require('../controllers/watchlistItemController');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);
router.get('/', list);
router.get('/poster-search', posterSearchHandler);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
