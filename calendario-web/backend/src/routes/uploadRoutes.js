const express = require('express');
const { uploadFile } = require('../controllers/uploadController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/', auth, upload.single('file'), uploadFile);

module.exports = router;
