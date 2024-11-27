const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../db/db'); // Import your database module
require('dotenv').config(); // Load environment variables

// Utility function to hash a plain password (useful for updating existing records)
const hashPassword = async (plainPassword) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    return hashedPassword;
};

// Register Route (New User Registration)
router.post('/register', async (req, res) => {
    const { name, email, password, phoneNumber } = req.body;

    try {
        // Check if user already exists
        const [existingUser] = await db.promise().query('SELECT * FROM user_table WHERE email = ?', [email]);

        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await hashPassword(password);

        // Insert new user into database
        const query = 'INSERT INTO user_table (Name, Email, PasswordHash, PhoneNumber) VALUES (?, ?, ?, ?)';
        const [result] = await db.promise().query(query, [name, email, hashedPassword, phoneNumber]);

        // Respond with success message
        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Internal Server Error' });  // Send proper JSON error response
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Fetch user from database
        const [rows] = await db.promise().query('SELECT * FROM user_table WHERE Email = ?', [email]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = rows[0];

        // Check if password hash exists
        if (!user.PasswordHash) {
            return res.status(400).json({ message: 'Password not set for the user' });
        }

        // Compare input password with hashed password
        const isMatch = await bcrypt.compare(password, user.PasswordHash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Verify the presence of the JWT secret
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: 'JWT_SECRET is missing from server configuration' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.UserID, email: user.Email }, // Payload
            process.env.JWT_SECRET,                // Secret key from .env
            { expiresIn: '1h' }                    // Token expiration
        );

        // Respond with token and user details
        res.status(200).json({
            message: 'Login successful',
            token,
            user: { id: user.UserID, email: user.Email, name: user.Name },
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
