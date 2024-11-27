const express = require('express');
const { getUsers, addUser } = require('../controllers/userController');
const dashboardController = require('../controllers/dashboardController');  // Import dashboardController
const router = express.Router();

// Route to get users
router.get('/', getUsers);

// Route to register a new user (POST /api/users/register)
router.post('/register', addUser);

// Route to fetch dashboard info (GET /api/users/dashboard-info)
router.get('/dashboard-info', dashboardController.getDashboardDetails);

module.exports = router;
