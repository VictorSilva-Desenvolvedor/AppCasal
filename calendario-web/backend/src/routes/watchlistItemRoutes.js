const express = require('express');
const { list, create, update, remove, posterSearchHandler, posterDetailsHandler } = require('../controllers/watchlistItemController');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);
router.get('/', list);
router.get('/poster-search', posterSearchHandler);
router.get('/poster-details', posterDetailsHandler);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
