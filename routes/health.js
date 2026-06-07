const router = require('express').Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ success: true, status: 'ok', database: 'connected' });
  } catch {
    res.status(500).json({ success: false, status: 'error', database: 'disconnected' });
  }
});

module.exports = router;
