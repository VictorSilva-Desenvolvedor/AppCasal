const express = require('express');
const { list, create, update, complete, remove } = require('../controllers/vehicleMaintenanceController');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);
router.get('/', list);
router.post('/', create);
router.put('/:id', update);
router.post('/:id/complete', complete);
router.delete('/:id', remove);

module.exports = router;
