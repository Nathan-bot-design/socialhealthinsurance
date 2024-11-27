const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const db = require('./db/db'); // Import database configuration

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') }); // Ensure .env file is loaded
console.log('JWT_SECRET:', process.env.JWT_SECRET || 'Environment variable not loaded!');
console.log('Database user:', process.env.DB_USER || 'Environment variable not loaded!');

// Test database connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Database connected successfully');
        connection.release(); // Release connection back to the pool
    }
});

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Import and use routes
const userRoutes = require('./routes/userRoutes');
const claimsRoutes = require('./routes/claimsRoutes');
const paymentsRoutes = require('./routes/paymentsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboardRoutes');

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/claims', claimsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/uploads', express.static('uploads'));


// Root route
app.get('/', (req, res) => {
    res.send('Welcome to the API!');
});

// Handle undefined routes
app.use((req, res) => {
    res.status(404).send('Route not found');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});