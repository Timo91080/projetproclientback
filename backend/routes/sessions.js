import express from 'express';
import { body, validationResult } from 'express-validator';
import { getConnection } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all sessions
router.get('/', async (req, res) => {
  try {
    const connection = getConnection();
    const [sessions] = await connection.execute(`
      SELECT 
        s.id_session,
        s.debut_session,
        s.fin_session,
        s.id_reservation,
        r.date_reservation,
        st.id_station,
        st.plateforme,
        GROUP_CONCAT(CONCAT(c.prenom, ' ', c.nom) SEPARATOR ', ') as clients,
        CASE 
          WHEN s.fin_session IS NULL THEN 'En cours'
          ELSE 'Terminée'
        END as status
      FROM sessiondejeu s
      JOIN reservation r ON s.id_reservation = r.id_reservation
      JOIN stationjeu st ON r.id_station = st.id_station
      LEFT JOIN client_reservation cr ON r.id_reservation = cr.id_reservation
      LEFT JOIN client c ON cr.id_client = c.id_client
      GROUP BY s.id_session
      ORDER BY s.debut_session DESC
    `);

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start session
router.post('/start', [
  body('id_reservation').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id_reservation } = req.body;
    const connection = getConnection();

    // Check if reservation exists and doesn't already have an active session
    const [existingSession] = await connection.execute(
      'SELECT * FROM sessiondejeu WHERE id_reservation = ? AND fin_session IS NULL',
      [id_reservation]
    );

    if (existingSession.length > 0) {
      return res.status(400).json({ message: 'Session already active for this reservation' });
    }

    const [result] = await connection.execute(
      'INSERT INTO sessiondejeu (debut_session, id_reservation) VALUES (NOW(), ?)',
      [id_reservation]
    );

    const [newSession] = await connection.execute(`
      SELECT 
        s.id_session,
        s.debut_session,
        s.fin_session,
        s.id_reservation,
        r.date_reservation,
        st.id_station,
        st.plateforme,
        GROUP_CONCAT(CONCAT(c.prenom, ' ', c.nom) SEPARATOR ', ') as clients
      FROM sessiondejeu s
      JOIN reservation r ON s.id_reservation = r.id_reservation
      JOIN stationjeu st ON r.id_station = st.id_station
      LEFT JOIN client_reservation cr ON r.id_reservation = cr.id_reservation
      LEFT JOIN client c ON cr.id_client = c.id_client
      WHERE s.id_session = ?
      GROUP BY s.id_session
    `, [result.insertId]);

    res.status(201).json(newSession[0]);
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// End session
router.put('/:id/end', async (req, res) => {
  try {
    const connection = getConnection();
    
    const [result] = await connection.execute(
      'UPDATE sessiondejeu SET fin_session = NOW() WHERE id_session = ? AND fin_session IS NULL',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Active session not found' });
    }

    const [updatedSession] = await connection.execute(`
      SELECT 
        s.id_session,
        s.debut_session,
        s.fin_session,
        s.id_reservation,
        r.date_reservation,
        st.id_station,
        st.plateforme,
        GROUP_CONCAT(CONCAT(c.prenom, ' ', c.nom) SEPARATOR ', ') as clients
      FROM sessiondejeu s
      JOIN reservation r ON s.id_reservation = r.id_reservation
      JOIN stationjeu st ON r.id_station = st.id_station
      LEFT JOIN client_reservation cr ON r.id_reservation = cr.id_reservation
      LEFT JOIN client c ON cr.id_client = c.id_client
      WHERE s.id_session = ?
      GROUP BY s.id_session
    `, [req.params.id]);

    res.json(updatedSession[0]);
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete session
router.delete('/:id', async (req, res) => {
  try {
    const connection = getConnection();
    
    const [result] = await connection.execute(
      'DELETE FROM sessiondejeu WHERE id_session = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;