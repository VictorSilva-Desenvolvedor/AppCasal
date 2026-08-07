const express = require('express');
const { list, create, update, pay, remove } = require('../controllers/vehiclePaymentController');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);
router.get('/', list);
router.post('/', create);
router.put('/:id', update);
router.post('/:id/pay', pay);
router.delete('/:id', remove);

module.exports = router;
