const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.json({ message: 'Wallet endpoint - To be implemented' }));

module.exports = router;
