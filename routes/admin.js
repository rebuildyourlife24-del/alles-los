const router = require('express').Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.get('/users', authMiddleware, isAdmin, async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, email_verified, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, users: rows });
  } catch (err) { next(err); }
});

module.exports = router;
