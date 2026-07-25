const express = require('express');
const { list, create, toggle, remove } = require('../controllers/taskItemController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', list);
router.post('/', create);
router.patch('/:id/toggle', toggle);
router.delete('/:id', remove);

module.exports = router;
