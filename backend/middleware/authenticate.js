const jwt = require('jsonwebtoken');
require('dotenv').config();

if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables.');
    process.exit(1);
}

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        console.warn('No Authorization header found.');
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        console.warn('Invalid token format.');
        return res.status(401).json({ message: 'Access denied. Invalid token format.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token verified successfully:', decoded);

        // Attach the user payload to the request
        req.user = decoded;

        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error('Token verification error:', error);

        // Handle specific JWT errors
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired.' });
        }

        return res.status(400).json({ message: 'Invalid token.' });
    }
};
