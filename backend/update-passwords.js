const db = require('./db/db'); // Adjust the path to your DB configuration file
const bcrypt = require('bcryptjs');

(async () => {
    try {
        // List of emails and their plaintext passwords (from your DB table)
        const users = [
            { email: 'kingorinathan10@gmail.com', password: 'kingori555' },
            { email: 'peter10@gmail.com', password: 'kingori555' },
            { email: 'marywam@gmail.com', password: 'kingori555' },
            { email: 'evans10@gmail.com', password: 'evans123' }
        ];

        for (const user of users) {
            // Hash the plaintext password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(user.password, salt);

            // Update the database
            const query = 'UPDATE user_table SET PasswordHash = ? WHERE Email = ?';
            await db.promise().query(query, [hashedPassword, user.email]);
            console.log(`Password updated for: ${user.email}`);
        }

        console.log('All passwords have been updated with hashed versions!');
    } catch (error) {
        console.error('Error updating passwords:', error);
    }
})();
