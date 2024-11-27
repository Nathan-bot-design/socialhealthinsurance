const express = require('express');
const router = express.Router();
const { initiatePayment } = require('../controllers/paymentsController');

// Route to handle payment processing
router.post('/pay', initiatePayment);

module.exports = router;



