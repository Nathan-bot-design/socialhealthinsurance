const db = require('../db/db'); // Database connection
const fs = require('fs');
const path = require('path');

// Function to fetch account balance for a user
const getAccountBalance = async (userId) => {
    try {
        const [balanceRows] = await db.promise().query(
            'SELECT SUM(Amount) AS accountBalance FROM payments_table WHERE UserID = ?',
            [userId]
        );
        const accountBalance = parseFloat(balanceRows[0]?.accountBalance || 0);
        console.log('Fetched Account Balance:', accountBalance); // Debugging log
        return accountBalance;
    } catch (error) {
        console.error('Error fetching account balance:', error);
        throw new Error('Unable to fetch account balance');
    }
};

// Get claims and account balance for the authenticated user
// Get claims and account balance for the authenticated user
const getClaims = async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    try {
        // Fetch claims for the user
        const [claimsRows] = await db.promise().query(
            'SELECT claimId, Description, TotalAmount, DateSubmitted, Status FROM claims_table WHERE userId = ?',
            [userId]
        );

        // Provide default structure for claims
        const claims = claimsRows.map(claim => ({
            claimId: claim.claimId || null,
            claimDescription: claim.Description || 'No description provided',
            claimAmount: parseFloat(claim.TotalAmount) || 0,
            claimDate: claim.DateSubmitted || 'Unknown',
            status: claim.Status || 'Pending',
        }));

        // Fetch account balance
        const accountBalance = await getAccountBalance(userId);

        // Respond with claims and account balance
        res.status(200).json({
            claims: claims.length > 0 ? claims : [], // Ensure empty array if no claims
            accountBalance: accountBalance.toFixed(2),
            message: 'Claims and balance fetched successfully',
        });
    } catch (error) {
        console.error('Error fetching claims data:', error);
        res.status(500).json({ message: 'Error fetching claims data' });
    }
};


// Create a new claim
const createClaim = async (req, res) => {
    const userId = req.user?.id; // Safely access id

    if (!userId) {
        return res.status(400).json({ message: 'User authentication failed. Please log in again.' });
    }

    const { claimAmount, claimDescription } = req.body;
    const file = req.file;

    if (!claimAmount || !claimDescription) {
        return res.status(400).json({ message: 'Claim amount and description are required' });
    }

    try {
        // Fetch account balance
        const accountBalance = await getAccountBalance(userId);

        if (accountBalance < parseFloat(claimAmount)) {
            return res.status(400).json({
                message: `Insufficient balance. Your balance is Ksh ${accountBalance.toFixed(2)}. Please recharge.`,
            });
        }

        // Create a new claim
        const [result] = await db.promise().query(
            'INSERT INTO claims_table (userId, Description, TotalAmount, DateSubmitted, Status) VALUES (?, ?, ?, NOW(), ?)',
            [userId, claimDescription, claimAmount, 'Pending']
        );

        const claimId = result.insertId;

        // Save uploaded file information if a file was uploaded
        if (file) {
            const filePath = path.join('uploads', file.filename);
            await db.promise().query(
                'INSERT INTO documents_table (ClaimID, FileName, FilePath) VALUES (?, ?, ?)',
                [claimId, file.originalname, filePath]
            );
        }

        res.status(201).json({ message: 'Claim created successfully', accountBalance: accountBalance.toFixed(2) });
    } catch (error) {
        console.error('Error creating claim:', error);
        res.status(500).json({ message: 'Error creating claim' });
    }
};


module.exports = { getClaims, createClaim };
