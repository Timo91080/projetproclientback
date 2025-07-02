import express from 'express';
import { body, validationResult } from 'express-validator';
import { getConnection } from '../config/database.js';
import { authenticateAnyToken } from '../middleware/flexibleAuth.js';

const router = express.Router();

// All routes require authentication (admin or client)
router.use(authenticateAnyToken);

// Get reservations
router.get('/', async (req, res) => {
  try {
    const connection = getConnection();
    
    // If client, get only their reservations
    if (req.userType === 'client') {
      const clientId = req.client.id_client;
      
      const [reservations] = await connection.execute(`
        SELECT 
          r.id_reservation,
          r.date_reservation,
          r.id_station,
          s.plateforme,
          GROUP_CONCAT(CONCAT(c.prenom, ' ', c.nom) SEPARATOR ', ') as clients,
          COUNT(DISTINCT cr.id_client) as nombre_clients,
          sess.id_session,
          sess.debut_session,
          sess.fin_session
        FROM reservation r
        JOIN stationjeu s ON r.id_station = s.id_station
        LEFT JOIN client_reservation cr ON r.id_reservation = cr.id_reservation
        LEFT JOIN client c ON cr.id_client = c.id_client
        LEFT JOIN sessiondejeu sess ON r.id_reservation = sess.id_reservation
        WHERE cr.id_client = ?
        GROUP BY r.id_reservation
        ORDER BY r.date_reservation DESC
      `, [clientId]);
      
      return res.json(reservations);
    }
    
    // If admin, get all reservations
    const [reservations] = await connection.execute(`
      SELECT 
        r.id_reservation,
        r.date_reservation,
        r.id_station,
        s.plateforme,
        GROUP_CONCAT(CONCAT(c.prenom, ' ', c.nom) SEPARATOR ', ') as clients,
        COUNT(DISTINCT cr.id_client) as nombre_clients,
        sess.id_session,
        sess.debut_session,
        sess.fin_session
      FROM reservation r
      JOIN stationjeu s ON r.id_station = s.id_station
      LEFT JOIN client_reservation cr ON r.id_reservation = cr.id_reservation
      LEFT JOIN client c ON cr.id_client = c.id_client
      LEFT JOIN sessiondejeu sess ON r.id_reservation = sess.id_reservation
      GROUP BY r.id_reservation
      ORDER BY r.date_reservation DESC
    `);

    res.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get my reservations (client only)
router.get('/my', async (req, res) => {
  try {
    // Only clients can access this route
    if (req.userType !== 'client') {
      return res.status(403).json({ message: 'Access denied. Client access only.' });
    }
    
    const connection = getConnection();
    const clientId = req.client.id_client;
    
    const [reservations] = await connection.execute(`
      SELECT 
        r.id_reservation,
        r.date_reservation,
        r.id_station,
        s.plateforme,
        GROUP_CONCAT(CONCAT(c.prenom, ' ', c.nom) SEPARATOR ', ') as clients,
        COUNT(DISTINCT cr.id_client) as nombre_clients,
        ses.id_session,
        ses.debut_session,
        ses.fin_session
      FROM reservation r
      JOIN stationjeu s ON r.id_station = s.id_station
      JOIN client_reservation cr ON r.id_reservation = cr.id_reservation
      JOIN client c ON cr.id_client = c.id_client
      LEFT JOIN sessiondejeu ses ON r.id_reservation = ses.id_reservation
      WHERE cr.id_client = ?
      GROUP BY r.id_reservation, r.date_reservation, r.id_station, s.plateforme, ses.id_session, ses.debut_session, ses.fin_session
      ORDER BY r.date_reservation DESC
    `, [clientId]);

    res.json(reservations);
  } catch (error) {
    console.error('Error fetching client reservations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get reservation by ID
router.get('/:id', async (req, res) => {
  try {
    const connection = getConnection();
    const [reservation] = await connection.execute(`
      SELECT 
        r.id_reservation,
        r.date_reservation,
        r.id_station,
        s.plateforme,
        sess.id_session,
        sess.debut_session,
        sess.fin_session
      FROM reservation r
      JOIN stationjeu s ON r.id_station = s.id_station
      LEFT JOIN sessiondejeu sess ON r.id_reservation = sess.id_reservation
      WHERE r.id_reservation = ?
    `, [req.params.id]);

    if (reservation.length === 0) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Get clients for this reservation
    const [clients] = await connection.execute(`
      SELECT c.id_client, c.nom, c.prenom, c.email
      FROM client c
      JOIN client_reservation cr ON c.id_client = cr.id_client
      WHERE cr.id_reservation = ?
    `, [req.params.id]);

    res.json({
      ...reservation[0],
      clients
    });
  } catch (error) {
    console.error('Error fetching reservation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create reservation
router.post('/', [
  body('date_reservation').isISO8601(),
  body('id_station').isInt({ min: 1 }),
  body('client_ids').isArray({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date_reservation, id_station, client_ids } = req.body;
    const connection = getConnection();

    await connection.beginTransaction();

    try {
      // Create reservation
      const [reservationResult] = await connection.execute(
        'INSERT INTO reservation (date_reservation, id_station) VALUES (?, ?)',
        [date_reservation, id_station]
      );

      const reservationId = reservationResult.insertId;

      // Link clients to reservation
      for (const clientId of client_ids) {
        await connection.execute(
          'INSERT INTO client_reservation (id_client, id_reservation) VALUES (?, ?)',
          [clientId, reservationId]
        );
      }

      await connection.commit();

      // Get created reservation
      const [newReservation] = await connection.execute(`
        SELECT 
          r.id_reservation,
          r.date_reservation,
          r.id_station,
          s.plateforme,
          GROUP_CONCAT(CONCAT(c.prenom, ' ', c.nom) SEPARATOR ', ') as clients,
          COUNT(DISTINCT cr.id_client) as nombre_clients
        FROM reservation r
        JOIN stationjeu s ON r.id_station = s.id_station
        LEFT JOIN client_reservation cr ON r.id_reservation = cr.id_reservation
        LEFT JOIN client c ON cr.id_client = c.id_client
        WHERE r.id_reservation = ?
        GROUP BY r.id_reservation
      `, [reservationId]);

      res.status(201).json(newReservation[0]);
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete reservation
router.delete('/:id', async (req, res) => {
  try {
    const connection = getConnection();
    
    const [result] = await connection.execute(
      'DELETE FROM reservation WHERE id_reservation = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.json({ message: 'Reservation deleted successfully' });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;