const express = require('express');
const { preview, commit } = require('../controllers/financeImportController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(auth);

router.post('/preview', upload.single('file'), preview);
router.post('/commit', commit);

module.exports = router;
