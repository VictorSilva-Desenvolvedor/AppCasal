const express = require('express');
const { list, create, update, remove, report } = require('../controllers/financeEntryController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/report', report);
router.get('/', list);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
