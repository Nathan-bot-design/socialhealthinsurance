const axios = require('axios');
const db = require('../db/db');
require('dotenv').config();

// Function to generate the access token for Safaricom API
const getAccessToken = async () => {
    const headers = {
        'Authorization': 'Basic ' + Buffer.from(`${process.env.CONSUMER_KEY}:${process.env.CONSUMER_SECRET}`).toString('base64')
    };

    console.log('Headers:', headers); // Debugging log

    try {
        const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', { headers });
        console.log('Access Token Response:', response.data); // Debugging log
        return response.data.access_token;
    } catch (error) {
        console.error('Error response from API:', error.response?.data || error.message); // Detailed error log
        throw new Error('Failed to get access token');
    }
};

// Function to generate M-Pesa STK Push password
const generatePassword = () => {
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14); // Generate 14-char timestamp
    const password = Buffer.from(`${process.env.BUSINESS_SHORT_CODE}${process.env.PASSKEY}${timestamp}`).toString('base64');
    return { password, timestamp };
};

// Function to initiate payment
exports.initiatePayment = async (req, res) => {
    const { phoneNumber, amount, paymentType, userId } = req.body;

    // Basic input validation
    if (!phoneNumber || !amount || !paymentType || !userId) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate phone number format (example: starts with 2547 and followed by 8 digits)
    const phoneRegex = /^2547\d{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({ error: 'Invalid phone number format. Use 2547XXXXXXXX.' });
    }

    // Validate PaymentType
    const validPaymentTypes = ['Monthly', 'Annual'];
    if (!validPaymentTypes.includes(paymentType)) {
        return res.status(400).json({
            error: `Invalid PaymentType. Allowed values are: ${validPaymentTypes.join(', ')}`,
        });
    }

    try {
        // Check if the user exists in the database
        const userQuery = 'SELECT * FROM user_table WHERE UserID = ?';
        db.query(userQuery, [userId], async (userErr, userResult) => {
            if (userErr) {
                console.error('Error fetching user:', userErr);
                return res.status(500).json({ error: 'Database error while validating user' });
            }

            if (userResult.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Generate a unique Transaction ID
            const transactionID = `TXN${Date.now()}`;

            // Insert payment record into the database
            const insertQuery = `
                INSERT INTO payments_table (UserID, PaymentDate, Amount, PaymentType, TransactionID)
                VALUES (?, CURDATE(), ?, ?, ?)
            `;
            db.query(insertQuery, [userId, amount, paymentType, transactionID], async (insertErr, insertResult) => {
                if (insertErr) {
                    console.error('Error inserting payment:', insertErr);
                    return res.status(500).json({ error: 'Failed to process payment' });
                }

                // Generate Safaricom API Password
                const { password, timestamp } = generatePassword();

                // Get the Safaricom access token
                const accessToken = await getAccessToken();

                // Prepare the payment request payload
                const paymentPayload = {
                    BusinessShortCode: process.env.BUSINESS_SHORT_CODE,
                    Password: password,
                    Timestamp: timestamp,
                    TransactionType: "CustomerPayBillOnline",
                    Amount: amount,
                    PartyA: phoneNumber,
                    PartyB: process.env.BUSINESS_SHORT_CODE,
                    PhoneNumber: phoneNumber,
                    CallBackURL: process.env.CALLBACK_URL,
                    AccountReference: transactionID,
                    TransactionDesc: 'Payment for services',
                };

                try {
                    // Request payment via Safaricom API
                    const paymentResponse = await axios.post(
                        'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
                        paymentPayload,
                        {
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                            },
                        }
                    );

                    // Handle the response
                    if (paymentResponse.status === 200) {
                        res.status(200).json({
                            success: true,
                            message: 'Payment processed successfully',
                            transactionID,
                            paymentResponse: paymentResponse.data,
                        });
                    } else {
                        res.status(paymentResponse.status).json({
                            error: 'Failed to initiate payment',
                            details: paymentResponse.data,
                        });
                    }
                } catch (error) {
                    console.error('Error initiating payment with Safaricom API:', error.response?.data || error.message);
                    res.status(500).json({ error: 'Failed to process payment with Safaricom API' });
                }
            });
        });
    } catch (error) {
        console.error('Error initiating payment:', error);
        res.status(500).json({ error: 'An unexpected server error occurred' });
    }
};
