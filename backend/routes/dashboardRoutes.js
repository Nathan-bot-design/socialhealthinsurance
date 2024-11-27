const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Routes for dashboard data
router.get('/global-stats', dashboardController.getGlobalDashboardStats);
router.get('/user-role', dashboardController.getUserRole);
router.get('/details', dashboardController.getDashboardDetails);
router.get('/user-balance', dashboardController.getUserBalance);

module.exports = router;
