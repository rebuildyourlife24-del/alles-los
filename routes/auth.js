const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
const { sendMail } = require('../services/email');
const authMiddleware = require('../middleware/auth');
const { JWT_SECRET, JWT_EXPIRES_IN, FRONTEND_URL } = require('../config/env');

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Alle velden verplicht' });

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length)
      return res.status(409).json({ success: false, message: 'E-mail al in gebruik' });

    const hash = await bcrypt.hash(password, 12);
    const verifyToken = crypto.randomBytes(32).toString('hex');

    await db.query(
      'INSERT INTO users (name, email, password_hash, verify_token, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hash, verifyToken, 'user']
    );

    await sendMail({
      to: email,
      subject: 'Bevestig je REBUILD account',
      html: `<p>Hoi ${name},</p><p><a href="${FRONTEND_URL}/api/auth/verify-email?token=${verifyToken}">Bevestig je e-mail</a></p>`,
    });

    res.status(201).json({ success: true, message: 'Registratie gelukt. Check je e-mail.' });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ success: false, message: 'Onjuiste gegevens' });

    if (!user.email_verified)
      return res.status(403).json({ success: false, message: 'E-mail nog niet bevestigd' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
});

router.get('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.query;
    const [rows] = await db.query('SELECT id FROM users WHERE verify_token = ?', [token]);
    if (!rows.length)
      return res.status(400).json({ success: false, message: 'Ongeldige token' });

    await db.query('UPDATE users SET email_verified = 1, verify_token = NULL WHERE id = ?', [rows[0].id]);
    res.json({ success: true, message: 'E-mail bevestigd. Je kunt nu inloggen.' });
  } catch (err) { next(err); }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    const [rows] = await db.query('SELECT id, name FROM users WHERE email = ?', [email]);
    if (!rows.length)
      return res.json({ success: true, message: 'Als dit e-mailadres bekend is, ontvang je een link.' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000);
    await db.query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?', [resetToken, expires, rows[0].id]);

    await sendMail({
      to: email,
      subject: 'Wachtwoord resetten - REBUILD',
      html: `<p>Hoi ${rows[0].name},</p><p><a href="${FRONTEND_URL}/reset-password?token=${resetToken}">Reset je wachtwoord</a> (geldig 1 uur)</p>`,
    });

    res.json({ success: true, message: 'Resetlink verstuurd.' });
  } catch (err) { next(err); }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const [rows] = await db.query(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
      [token]
    );
    if (!rows.length)
      return res.status(400).json({ success: false, message: 'Token ongeldig of verlopen' });

    const hash = await bcrypt.hash(password, 12);
    await db.query('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?', [hash, rows[0].id]);
    res.json({ success: true, message: 'Wachtwoord gewijzigd.' });
  } catch (err) { next(err); }
});

router.post('/resend-verification', async (req, res, next) => {
  try {
    const { email } = req.body;
    const [rows] = await db.query('SELECT id, name, email_verified FROM users WHERE email = ?', [email]);
    if (!rows.length || rows[0].email_verified)
      return res.json({ success: true, message: 'Als van toepassing, ontvang je een nieuwe verificatiemail.' });

    const verifyToken = crypto.randomBytes(32).toString('hex');
    await db.query('UPDATE users SET verify_token = ? WHERE id = ?', [verifyToken, rows[0].id]);

    await sendMail({
      to: email,
      subject: 'Bevestig je REBUILD account',
      html: `<p><a href="${FRONTEND_URL}/api/auth/verify-email?token=${verifyToken}">Bevestig je e-mail</a></p>`,
    });

    res.json({ success: true, message: 'Verificatiemail opnieuw verstuurd.' });
  } catch (err) { next(err); }
});

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Gebruiker niet gevonden' });
    res.json({ success: true, user: rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
