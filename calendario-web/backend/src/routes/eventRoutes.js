const express = require('express');
const { list, create, update, remove, upcomingReminders } = require('../controllers/eventController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/upcoming-reminders', upcomingReminders);
router.get('/', list);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
