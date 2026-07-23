const express = require('express');
const { list, create, remove, setReaction, removeReaction } = require('../controllers/habitCheckinController');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);
router.get('/', list);
router.post('/', create);
router.delete('/:id', remove);
router.post('/:id/reactions', setReaction);
router.delete('/:id/reactions', removeReaction);

module.exports = router;
