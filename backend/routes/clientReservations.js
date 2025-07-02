import express from 'express';
import { body, validationResult } from 'express-validator';
import { getConnection } from '../config/database.js';
import { authenticateClientToken } from '../middleware/clientAuth.js';

const router = express.Router();

// All client reservation routes require client authentication
router.use(authenticateClientToken);

// Get my reservations
router.get('/my', async (req, res) => {
  try {
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

// Create reservation
router.post('/', [
  body('date_reservation').isISO8601().withMessage('Date de réservation invalide'),
  body('id_station').isInt({ min: 1 }).withMessage('ID station invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date_reservation, id_station } = req.body;
    const clientId = req.client.id_client;
    const connection = getConnection();

    // Check if station exists
    const [station] = await connection.execute(
      'SELECT id_station, plateforme FROM stationjeu WHERE id_station = ?',
      [id_station]
    );

    if (station.length === 0) {
      return res.status(404).json({ message: 'Station not found' });
    }

    // Check if the date is in the future
    const reservationDate = new Date(date_reservation);
    const now = new Date();
    if (reservationDate <= now) {
      return res.status(400).json({ message: 'La date de réservation doit être dans le futur' });
    }

    // Check if there's already a reservation for this station at this time
    const [existingReservation] = await connection.execute(
      'SELECT id_reservation FROM reservation WHERE id_station = ? AND date_reservation = ?',
      [id_station, date_reservation]
    );

    if (existingReservation.length > 0) {
      return res.status(409).json({ message: 'Cette station est déjà réservée à cette heure' });
    }

    // Start transaction
    await connection.beginTransaction();

    try {
      // Create reservation
      const [result] = await connection.execute(
        'INSERT INTO reservation (date_reservation, id_station) VALUES (?, ?)',
        [date_reservation, id_station]
      );

      const reservationId = result.insertId;

      // Link client to reservation
      await connection.execute(
        'INSERT INTO client_reservation (id_client, id_reservation) VALUES (?, ?)',
        [clientId, reservationId]
      );

      await connection.commit();

      // Fetch the created reservation
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
        JOIN client_reservation cr ON r.id_reservation = cr.id_reservation
        JOIN client c ON cr.id_client = c.id_client
        WHERE r.id_reservation = ?
        GROUP BY r.id_reservation, r.date_reservation, r.id_station, s.plateforme
      `, [reservationId]);

      res.status(201).json(newReservation[0]);
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating reservation:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ message: 'Réservation déjà existante' });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

// Cancel reservation (only if not started)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.client.id_client;
    const connection = getConnection();

    // Validate reservation ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'ID de réservation invalide' });
    }

    // Check if reservation belongs to client and is not started
    const [reservation] = await connection.execute(`
      SELECT r.id_reservation, r.date_reservation, ses.id_session
      FROM reservation r
      JOIN client_reservation cr ON r.id_reservation = cr.id_reservation
      LEFT JOIN sessiondejeu ses ON r.id_reservation = ses.id_reservation
      WHERE r.id_reservation = ? AND cr.id_client = ?
    `, [id, clientId]);

    if (reservation.length === 0) {
      return res.status(404).json({ message: 'Réservation non trouvée ou non autorisée' });
    }

    if (reservation[0].id_session) {
      return res.status(400).json({ message: 'Impossible d\'annuler une session déjà commencée' });
    }

    // Check if reservation is in the future (allow cancellation up to 1 hour before)
    const reservationDate = new Date(reservation[0].date_reservation);
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    if (reservationDate <= oneHourFromNow) {
      return res.status(400).json({ message: 'Impossible d\'annuler une réservation moins d\'une heure avant l\'heure prévue' });
    }

    // Start transaction
    await connection.beginTransaction();

    try {
      // Delete client_reservation link first (foreign key constraint)
      await connection.execute(
        'DELETE FROM client_reservation WHERE id_reservation = ? AND id_client = ?',
        [id, clientId]
      );

      // Check if there are other clients for this reservation
      const [otherClients] = await connection.execute(
        'SELECT COUNT(*) as count FROM client_reservation WHERE id_reservation = ?',
        [id]
      );

      // If no other clients, delete the reservation entirely
      if (otherClients[0].count === 0) {
        await connection.execute(
          'DELETE FROM reservation WHERE id_reservation = ?',
          [id]
        );
      }

      await connection.commit();
      res.json({ message: 'Réservation annulée avec succès' });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
