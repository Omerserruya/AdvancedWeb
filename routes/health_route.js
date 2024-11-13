const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      message: 'Server is healthy',
    });
  });

module.exports = router;
  