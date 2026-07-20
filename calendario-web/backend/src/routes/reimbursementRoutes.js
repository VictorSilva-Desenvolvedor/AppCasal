const express = require('express');
const { list, create, settle, remove } = require('../controllers/reimbursementController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', list);
router.post('/', create);
router.put('/:id/quitar', settle);
router.delete('/:id', remove);

module.exports = router;
