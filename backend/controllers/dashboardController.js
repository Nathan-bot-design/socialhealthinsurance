const db = require('../db/db'); // Import the database connection

// Controller to fetch global dashboard statistics
exports.getGlobalDashboardStats = async (req, res) => {
    try {
        const [claimsCount] = await db.promise().query('SELECT COUNT(*) AS totalClaims FROM claims_table');
        const [paymentsCount] = await db.promise().query('SELECT COUNT(*) AS totalPayments FROM payments_table');

        res.status(200).json({
            claims: claimsCount[0]?.totalClaims || 0,
            payments: paymentsCount[0]?.totalPayments || 0,
            message: 'Global dashboard data fetched successfully',
        });
    } catch (error) {
        console.error('Error fetching global dashboard data:', error);
        res.status(500).json({ message: 'Error fetching global dashboard statistics', error: error.message });
    }
};

// Controller to fetch role of the logged-in user
exports.getUserRole = async (req, res) => {
    const userId = req.user?.id || req.query.userId;

    if (!userId) return res.status(400).json({ message: 'User ID is required' });

    try {
        const [rows] = await db.promise().query('SELECT Role FROM user_table WHERE UserID = ?', [userId]);
        if (rows.length === 0) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({ role: rows[0]?.Role || 'Unknown', message: 'User role fetched successfully' });
    } catch (error) {
        console.error('Error fetching user role:', error);
        res.status(500).json({ message: 'Error fetching user role', error: error.message });
    }
};

// Controller to fetch user-specific dashboard details
exports.getDashboardDetails = async (req, res) => {
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
        console.error('Error: User ID not provided');
        return res.status(400).json({ message: 'User ID is required' });
    }

    try {
        // Fetch user-specific claim and payment stats
        const [claims] = await db.promise().query(
            'SELECT COUNT(*) AS totalClaims FROM claims_table WHERE UserID = ?',
            [userId]
        );

        const [payments] = await db.promise().query(
            'SELECT COUNT(*) AS totalPayments, SUM(Amount) AS totalPaymentAmount FROM payments_table WHERE UserID = ?',
            [userId]
        );

        res.status(200).json({
            claims: claims[0]?.totalClaims || 0,
            payments: payments[0]?.totalPayments || 0,
            accountBalance: payments[0]?.totalPaymentAmount || 0,
            message: 'User-specific dashboard details fetched successfully',
        });
    } catch (error) {
        console.error('Error fetching user-specific dashboard details:', error);
        res.status(500).json({ message: 'Error fetching user-specific dashboard details', error: error.message });
    }
};

// Controller to fetch the logged-in user's balance
exports.getUserBalance = async (req, res) => {
    const userId = req.user?.id || req.query.userId;

    if (!userId) return res.status(400).json({ message: 'User ID is required' });

    try {
        const [payments] = await db.promise().query(
            'SELECT SUM(Amount) AS totalPaymentAmount FROM payments_table WHERE UserID = ?',
            [userId]
        );

        res.status(200).json({
            accountBalance: payments[0]?.totalPaymentAmount || 0,
            message: 'User balance fetched successfully',
        });
    } catch (error) {
        console.error('Error fetching user balance:', error);
        res.status(500).json({ message: 'Error fetching user balance', error: error.message });
    }
};
