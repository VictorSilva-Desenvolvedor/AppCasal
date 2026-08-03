const express = require('express');
const { list, create, update, reorder, toggle, remove } = require('../controllers/taskItemController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', list);
router.post('/', create);
// Antes de qualquer rota com :id, senão 'reorder' seria lido como um id.
router.put('/reorder', reorder);
router.patch('/:id/toggle', toggle);
router.patch('/:id', update);
router.delete('/:id', remove);

module.exports = router;
