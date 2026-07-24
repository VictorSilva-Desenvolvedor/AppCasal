const express = require('express');
const { list, create, update, remove, generateDraft, addNote } = require('../controllers/updateRequestController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', list);
router.post('/generate', generateDraft);
router.post('/', create);
router.put('/:id', update);
router.post('/:id/notes', addNote);
router.delete('/:id', remove);

module.exports = router;
