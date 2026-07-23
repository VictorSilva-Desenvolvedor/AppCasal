const express = require('express');
const { list, unreadCount, markRead, markAllRead } = require('../controllers/notificationController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', list);
router.get('/unread-count', unreadCount);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);

module.exports = router;
