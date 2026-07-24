const express = require('express');
const { list, create, remove, ranking } = require('../controllers/candyEntryController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/ranking', ranking); // caminho específico antes de '/:id'
router.get('/', list);
router.post('/', create);
router.delete('/:id', remove);

module.exports = router;
