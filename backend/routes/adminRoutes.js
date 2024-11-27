// adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Route for claims report
router.get('/reports/claims', adminController.generateClaimsReport);

// Route for outstanding payments report
router.get('/reports/outstanding-payments', adminController.generateOutstandingPaymentsReport);

// Route for approving/rejecting claims
router.post('/claims/status', adminController.updateClaimStatus);

module.exports = router;