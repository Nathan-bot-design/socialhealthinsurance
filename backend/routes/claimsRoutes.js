const express = require('express');
const multer = require('multer');
const { getClaims, createClaim } = require('../controllers/claimsController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads'); // Set upload folder
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`); // Unique filename
    }
});

const upload = multer({ storage });

router.get('/', authenticate, getClaims); // Authenticate user
router.post('/', authenticate, upload.single('document'), createClaim); // Authenticate user & handle file upload

module.exports = router;
