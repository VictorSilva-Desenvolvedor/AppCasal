const express = require('express');
const { list, create, respond, remove } = require('../controllers/invitationController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', list);
router.post('/', create);
router.put('/:id', respond);
router.delete('/:id', remove);

module.exports = router;
