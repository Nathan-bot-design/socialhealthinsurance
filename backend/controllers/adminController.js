// adminController.js
const db = require('../db/db');

// Generate report for claims
exports.generateClaimsReport = (req, res) => {
    const { startDate, endDate } = req.query;

    const query = `SELECT Status, COUNT(*) as Total FROM claims_table WHERE DateSubmitted BETWEEN ? AND ? GROUP BY Status`;
    db.query(query, [startDate, endDate], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch claims report', details: err });
        }
        res.json(results);
    });
};

// Generate report for outstanding payments
exports.generateOutstandingPaymentsReport = (req, res) => {
    const { startDate, endDate } = req.query;
  
    const query = `
      SELECT u.Name, c.TotalAmount, c.Status 
      FROM claims_table c
      LEFT JOIN payments_table p ON c.UserID = p.UserID
      JOIN user_table u ON c.UserID = u.UserID
      WHERE c.Status = 'Pending' 
      AND c.DateSubmitted BETWEEN ? AND ?
    `;
  
    db.query(query, [startDate, endDate], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch outstanding payments report', details: err });
      }
      res.json(results);
    });
  };
  
// Approve or reject claims
// Update claim status
exports.updateClaimStatus = (req, res) => {
    const { claimId, status } = req.body;
  
    if (!claimId || !status) {
      return res.status(400).json({ error: 'Claim ID and status are required' });
    }
  
    const query = `UPDATE claims_table SET Status = ? WHERE ClaimID = ?`;
  
    db.query(query, [status, claimId], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to update claim status', details: err });
      }
      res.json({ message: 'Claim status updated successfully' });
    });
  };
  
  