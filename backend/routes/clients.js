import express from 'express';
import { body, validationResult } from 'express-validator';
import { getConnection } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all clients
router.get('/', async (req, res) => {
  try {
    const connection = getConnection();
    const [clients] = await connection.execute(`
      SELECT c.*, COUNT(r.id_reservation) as total_reservations
      FROM client c
      LEFT JOIN client_reservation cr ON c.id_client = cr.id_client
      LEFT JOIN reservation r ON cr.id_reservation = r.id_reservation
      GROUP BY c.id_client
      ORDER BY c.nom, c.prenom
    `);

    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get client by ID
router.get('/:id', async (req, res) => {
  try {
    const connection = getConnection();
    const [client] = await connection.execute(
      'SELECT * FROM client WHERE id_client = ?',
      [req.params.id]
    );

    if (client.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(client[0]);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create client
router.post('/', [
  body('nom').trim().isLength({ min: 2 }),
  body('prenom').trim().isLength({ min: 2 }),
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nom, prenom, email } = req.body;
    const connection = getConnection();

    const [result] = await connection.execute(
      'INSERT INTO client (nom, prenom, email) VALUES (?, ?, ?)',
      [nom, prenom, email]
    );

    const [newClient] = await connection.execute(
      'SELECT * FROM client WHERE id_client = ?',
      [result.insertId]
    );

    res.status(201).json(newClient[0]);
  } catch (error) {
    console.error('Error creating client:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update client
router.put('/:id', [
  body('nom').trim().isLength({ min: 2 }),
  body('prenom').trim().isLength({ min: 2 }),
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nom, prenom, email } = req.body;
    const connection = getConnection();

    const [result] = await connection.execute(
      'UPDATE client SET nom = ?, prenom = ?, email = ? WHERE id_client = ?',
      [nom, prenom, email, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const [updatedClient] = await connection.execute(
      'SELECT * FROM client WHERE id_client = ?',
      [req.params.id]
    );

    res.json(updatedClient[0]);
  } catch (error) {
    console.error('Error updating client:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete client
router.delete('/:id', async (req, res) => {
  try {
    const connection = getConnection();
    
    const [result] = await connection.execute(
      'DELETE FROM client WHERE id_client = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;