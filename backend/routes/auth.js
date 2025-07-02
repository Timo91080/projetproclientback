import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { getConnection } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const connection = getConnection();

    const [admin] = await connection.execute(
      'SELECT * FROM admin WHERE email = ?',
      [email]
    );

    if (admin.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const adminData = admin[0];
    const isPasswordValid = await bcrypt.compare(password, adminData.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { adminId: adminData.id_admin, email: adminData.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      admin: {
        id: adminData.id_admin,
        email: adminData.email,
        nom: adminData.nom,
        prenom: adminData.prenom
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Register client
router.post('/register', [
  body('nom').trim().isLength({ min: 2 }),
  body('prenom').trim().isLength({ min: 2 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nom, prenom, email, password } = req.body;
    const connection = getConnection();

    // Check if email already exists
    const [existingClient] = await connection.execute(
      'SELECT id_client FROM client WHERE email = ?',
      [email]
    );

    if (existingClient.length > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new client
    const [result] = await connection.execute(
      'INSERT INTO client (nom, prenom, email, password) VALUES (?, ?, ?, ?)',
      [nom, prenom, email, hashedPassword]
    );

    const clientId = result.insertId;

    // Generate JWT token
    const token = jwt.sign(
      { clientId, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      token,
      user: {
        id_client: clientId,
        nom,
        prenom,
        email
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Client login
router.post('/client/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const connection = getConnection();

    const [client] = await connection.execute(
      'SELECT * FROM client WHERE email = ?',
      [email]
    );

    if (client.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const clientData = client[0];
    const isPasswordValid = await bcrypt.compare(password, clientData.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { clientId: clientData.id_client, email: clientData.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id_client: clientData.id_client,
        email: clientData.email,
        nom: clientData.nom,
        prenom: clientData.prenom
      }
    });
  } catch (error) {
    console.error('Client login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Verify token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ admin: req.admin });
});

// Verify client token
router.get('/client/verify', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify client still exists in database
    const connection = getConnection();
    const [client] = await connection.execute(
      'SELECT id_client, email, nom, prenom FROM client WHERE id_client = ?',
      [decoded.clientId]
    );

    if (client.length === 0) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    res.json({ user: client[0] });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
});

export default router;