const db = require('../db/db'); // Ensure db.js is correctly set up
const sharp = require('sharp'); // Ensure sharp is installed (npm install sharp)
const bcrypt = require('bcryptjs'); // Ensure bcryptjs is installed (npm install bcryptjs)

// Get all users
const getUsers = (req, res) => {
    db.query('SELECT * FROM user_table', (err, results) => {
        if (err) {
            console.error('Database query error:', err.message);
            return res.status(500).json({ error: 'Failed to fetch users' });
        }
        res.json(results);
    });
};

// Add a new user
const addUser = async (req, res) => {
    const { national_id, name, email, phone_number, password, date_of_birth, biometric_data } = req.body;

    try {
        let biometricDataBuffer = null;

        // Validate biometric data
        if (biometric_data) {
            try {
                const imageBuffer = Buffer.from(biometric_data.split(',')[1], 'base64');

                // Compress and resize image
                biometricDataBuffer = await sharp(imageBuffer)
                    .resize(200, 200) // Resize to 200x200 pixels
                    .jpeg({ quality: 70 }) // Set JPEG quality to 70%
                    .toBuffer();
            } catch (sharpError) {
                console.error('Sharp processing error:', sharpError.message);
                return res.status(400).json({ error: 'Invalid biometric data' });
            }
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO user_table 
            (NationalID, Name, Email, ContactInfo, PasswordHash, DateOfBirth, BiometricData, CreatedAt) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        db.query(
            query,
            [national_id, name, email, phone_number, hashedPassword, date_of_birth, biometricDataBuffer],
            (err, result) => {
                if (err) {
                    console.error('Database insertion error:', err.message);
                    return res.status(500).json({ error: 'Failed to add user' });
                }
                res.json({ message: 'User added successfully!', userId: result.insertId });
            }
        );
    } catch (error) {
        console.error('Error adding user:', error.message);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
};

module.exports = { getUsers, addUser };
