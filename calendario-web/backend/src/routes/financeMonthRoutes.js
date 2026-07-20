const express = require('express');
const { list, create, close, reopen } = require('../controllers/financeMonthController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', list);
router.post('/', create);
router.put('/:id/fechar', close);
router.put('/:id/reabrir', reopen);

module.exports = router;
