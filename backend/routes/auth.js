import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { getConnection } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { authenticateClientToken } from '../middleware/clientAuth.js';

const router = express.Router();

// Unified Login (Admin and Client)
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

    // Try admin login first
    const [admin] = await connection.execute(
      'SELECT * FROM admin WHERE email = ?',
      [email]
    );

    if (admin.length > 0) {
      const adminData = admin[0];
      const isPasswordValid = await bcrypt.compare(password, adminData.password);

      if (isPasswordValid) {
        const token = jwt.sign(
          { adminId: adminData.id_admin, email: adminData.email, type: 'admin' },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        return res.json({
          token,
          userType: 'admin',
          user: {
            id: adminData.id_admin,
            email: adminData.email,
            nom: adminData.nom,
            prenom: adminData.prenom
          }
        });
      }
    }

    // Try client login
    const [client] = await connection.execute(
      'SELECT * FROM client WHERE email = ?',
      [email]
    );

    if (client.length > 0) {
      const clientData = client[0];
      const isPasswordValid = await bcrypt.compare(password, clientData.password);

      if (isPasswordValid) {
        const token = jwt.sign(
          { clientId: clientData.id_client, email: clientData.email, type: 'client' },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        return res.json({
          token,
          userType: 'client',
          user: {
            id_client: clientData.id_client,
            email: clientData.email,
            nom: clientData.nom,
            prenom: clientData.prenom
          }
        });
      }
    }

    return res.status(401).json({ message: 'Invalid credentials' });
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

// Change client password
router.put('/client/change-password', [
  body('currentPassword').isLength({ min: 6 }),
  body('newPassword').isLength({ min: 6 })
], authenticateClientToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const connection = getConnection();

    // Get current client data
    const [client] = await connection.execute(
      'SELECT password FROM client WHERE id_client = ?',
      [req.client.id_client]
    );

    if (client.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, client[0].password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await connection.execute(
      'UPDATE client SET password = ? WHERE id_client = ?',
      [hashedNewPassword, req.client.id_client]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete client account
router.delete('/client/delete-account', [
  body('password').isLength({ min: 6 })
], authenticateClientToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { password } = req.body;
    const connection = getConnection();

    // Get client data to verify password
    const [client] = await connection.execute(
      'SELECT password FROM client WHERE id_client = ?',
      [req.client.id_client]
    );

    if (client.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, client[0].password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    // Start transaction to safely delete all related data
    await connection.beginTransaction();

    try {
      // Delete client reservations
      await connection.execute(
        'DELETE FROM client_reservation WHERE id_client = ?',
        [req.client.id_client]
      );

      // Delete any sessions associated with this client
      await connection.execute(
        'DELETE FROM session WHERE id_client = ?',
        [req.client.id_client]
      );

      // Delete the client account
      await connection.execute(
        'DELETE FROM client WHERE id_client = ?',
        [req.client.id_client]
      );

      await connection.commit();
      res.json({ message: 'Account deleted successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Universal Change Password (Admin & Client)
router.put('/change-password', [
  body('currentPassword').isLength({ min: 6 }),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const connection = getConnection();

    let userData, tableName, idField;

    // Determine if user is admin or client
    if (decoded.type === 'admin' || decoded.adminId) {
      tableName = 'admin';
      idField = 'id_admin';
      const userId = decoded.adminId;
      
      const [admin] = await connection.execute(
        `SELECT password FROM ${tableName} WHERE ${idField} = ?`,
        [userId]
      );
      
      if (admin.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      userData = admin[0];
    } else if (decoded.type === 'client' || decoded.clientId) {
      tableName = 'client';
      idField = 'id_client';
      const userId = decoded.clientId;
      
      const [client] = await connection.execute(
        `SELECT password FROM ${tableName} WHERE ${idField} = ?`,
        [userId]
      );
      
      if (client.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      userData = client[0];
    } else {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const userId = decoded.adminId || decoded.clientId;
    await connection.execute(
      `UPDATE ${tableName} SET password = ? WHERE ${idField} = ?`,
      [hashedNewPassword, userId]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Universal Delete Account (Client only - Admin cannot delete their own account)
router.delete('/delete-account', [
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { password } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const connection = getConnection();

    // Only clients can delete their accounts
    if (decoded.type === 'admin' || decoded.adminId) {
      return res.status(403).json({ message: 'Admins cannot delete their own accounts' });
    }

    if (decoded.type !== 'client' && !decoded.clientId) {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    const clientId = decoded.clientId;

    // Get client data to verify password
    const [client] = await connection.execute(
      'SELECT password FROM client WHERE id_client = ?',
      [clientId]
    );

    if (client.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, client[0].password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    // Start transaction to safely delete all related data
    await connection.beginTransaction();

    try {
      // Delete client reservations (if table exists)
      try {
        await connection.execute(
          'DELETE FROM client_reservation WHERE id_client = ?',
          [clientId]
        );
      } catch (error) {
        // Table might not exist, continue
      }

      // Delete any sessions associated with this client (if table exists)
      try {
        await connection.execute(
          'DELETE FROM session WHERE id_client = ?',
          [clientId]
        );
      } catch (error) {
        // Table might not exist, continue
      }

      // Delete the client account
      await connection.execute(
        'DELETE FROM client WHERE id_client = ?',
        [clientId]
      );

      await connection.commit();
      res.json({ message: 'Account deleted successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Universal Profile (Admin & Client)
router.get('/profile', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const connection = getConnection();

    // Determine if user is admin or client
    if (decoded.type === 'admin' || decoded.adminId) {
      const userId = decoded.adminId;
      const [admin] = await connection.execute(
        'SELECT id_admin, email, nom, prenom FROM admin WHERE id_admin = ?',
        [userId]
      );

      if (admin.length === 0) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      res.json({
        userType: 'admin',
        user: admin[0]
      });
    } else if (decoded.type === 'client' || decoded.clientId) {
      const userId = decoded.clientId;
      const [client] = await connection.execute(
        'SELECT id_client, email, nom, prenom FROM client WHERE id_client = ?',
        [userId]
      );

      if (client.length === 0) {
        return res.status(404).json({ message: 'Client not found' });
      }

      res.json({
        userType: 'client',
        user: client[0]
      });
    } else {
      return res.status(401).json({ message: 'Invalid token type' });
    }
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;