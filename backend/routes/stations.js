import express from 'express';
import { body, validationResult } from 'express-validator';
import { getConnection } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { authenticateClientToken } from '../middleware/clientAuth.js';

const router = express.Router();

// Public routes for clients (no auth required for viewing stations)
// Get all stations (public for clients)
router.get('/', async (req, res) => {
  try {
    const connection = getConnection();
    
    // Get all stations first
    const [stations] = await connection.execute(`
      SELECT 
        s.id_station,
        s.plateforme,
        b.config_pc,
        e.nombre_manettes
      FROM stationjeu s
      LEFT JOIN bureau b ON s.id_station = b.id_station
      LEFT JOIN espaceconsole e ON s.id_station = e.id_station
      ORDER BY s.id_station
    `);

    // For each station, check availability separately
    const stationsWithAvailability = [];
    
    for (const station of stations) {
      // Check for active sessions
      const [activeSessions] = await connection.execute(`
        SELECT COUNT(*) as count
        FROM reservation r
        JOIN sessiondejeu s ON r.id_reservation = s.id_reservation
        WHERE r.id_station = ? AND s.fin_session IS NULL
      `, [station.id_station]);

      // Check for future reservations (today and later)
      const [futureReservations] = await connection.execute(`
        SELECT COUNT(*) as count
        FROM reservation r
        WHERE r.id_station = ? 
        AND r.date_reservation >= CURDATE()
        AND r.id_reservation NOT IN (
          SELECT s.id_reservation FROM sessiondejeu s WHERE s.fin_session IS NOT NULL
        )
      `, [station.id_station]);

      const hasActiveSessions = activeSessions[0].count > 0;
      const hasFutureReservations = futureReservations[0].count > 0;
      const available = !hasActiveSessions && !hasFutureReservations;

      stationsWithAvailability.push({
        ...station,
        available,
        total_reservations: futureReservations[0].count
      });
    }

    res.json(stationsWithAvailability);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des stations:', error);
    res.status(500).json({ message: 'Erreur serveur interne' });
  }
});

// Get station by ID (public for clients)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = getConnection();
    
    const [stations] = await connection.execute(`
      SELECT 
        s.id_station,
        s.plateforme,
        b.config_pc,
        e.nombre_manettes,
        COUNT(DISTINCT r.id_reservation) as total_reservations,
        CASE 
          WHEN active_sessions.active_count > 0 THEN 0
          WHEN future_reservations.future_count > 0 THEN 0
          ELSE 1
        END as available
      FROM stationjeu s
      LEFT JOIN bureau b ON s.id_station = b.id_station
      LEFT JOIN espaceconsole e ON s.id_station = e.id_station
      LEFT JOIN reservation r ON s.id_station = r.id_station
      LEFT JOIN (
        SELECT r.id_station, COUNT(*) as active_count
        FROM reservation r
        JOIN sessiondejeu ses ON r.id_reservation = ses.id_reservation
        WHERE ses.fin_session IS NULL
        GROUP BY r.id_station
      ) active_sessions ON s.id_station = active_sessions.id_station
      LEFT JOIN (
        SELECT r.id_station, COUNT(*) as future_count
        FROM reservation r
        LEFT JOIN sessiondejeu ses ON r.id_reservation = ses.id_reservation
        WHERE r.date_reservation >= NOW() 
        AND (ses.id_session IS NULL OR ses.fin_session IS NULL)
        GROUP BY r.id_station
      ) future_reservations ON s.id_station = future_reservations.id_station
      WHERE s.id_station = ?
      GROUP BY s.id_station, active_sessions.active_count, future_reservations.future_count
    `, [id]);

    if (stations.length === 0) {
      return res.status(404).json({ message: 'Station not found' });
    }

    // Convert available from number to boolean
    const station = {
      ...stations[0],
      available: stations[0].available === 1
    };

    console.log(`📊 Station ${id} availability check:`);
    console.log(`  - Station: ${station.available ? '✅ Disponible' : '❌ Occupée'}`);
    console.log(`  - Sessions actives: ${stations[0].active_count || 0}`);
    console.log(`  - Réservations futures: ${stations[0].future_count || 0}`);

    res.json(station);
  } catch (error) {
    console.error('Error fetching station:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Check station availability for a specific date/time
router.get('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    const connection = getConnection();

    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }

    // Parse the requested date/time
    const requestedDateTime = new Date(date);
    const requestedHour = requestedDateTime.getHours();
    
    // Check for conflicts within the same hour window (1-hour slots)
    const [conflicts] = await connection.execute(`
      SELECT r.id_reservation, r.date_reservation, ses.id_session, ses.fin_session
      FROM reservation r
      LEFT JOIN sessiondejeu ses ON r.id_reservation = ses.id_reservation
      WHERE r.id_station = ? 
      AND DATE(r.date_reservation) = DATE(?)
      AND HOUR(r.date_reservation) = ?
      AND (ses.id_session IS NULL OR ses.fin_session IS NULL)
    `, [id, date, requestedHour]);

    // Also check for active sessions that might overlap
    const [activeSessions] = await connection.execute(`
      SELECT r.id_reservation, r.date_reservation, ses.debut_session, ses.fin_session
      FROM reservation r
      JOIN sessiondejeu ses ON r.id_reservation = ses.id_reservation
      WHERE r.id_station = ? 
      AND DATE(r.date_reservation) = DATE(?)
      AND ses.fin_session IS NULL
    `, [id, date]);

    const hasConflicts = conflicts.length > 0;
    const hasActiveSessions = activeSessions.length > 0;
    const available = !hasConflicts && !hasActiveSessions;
    
    console.log(`🔍 Availability check for Station ${id} at ${date}:`);
    console.log(`  - Conflicts found: ${conflicts.length}`);
    console.log(`  - Active sessions: ${activeSessions.length}`);
    console.log(`  - Available: ${available ? '✅' : '❌'}`);
    
    res.json({ 
      available,
      conflicts: conflicts.length,
      activeSessions: activeSessions.length,
      details: {
        conflictReservations: conflicts.map(c => ({
          id_reservation: c.id_reservation,
          date_reservation: c.date_reservation,
          has_session: !!c.id_session
        })),
        activeSessions: activeSessions.map(s => ({
          id_reservation: s.id_reservation,
          debut_session: s.debut_session
        }))
      }
    });
  } catch (error) {
    console.error('Error checking station availability:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get available stations with real-time availability check
router.get('/available', async (req, res) => {
  try {
    const { date, time } = req.query;
    const connection = getConnection();
    
    let whereClause = '';
    let params = [];
    
    if (date && time) {
      const requestedDateTime = `${date} ${time}:00`;
      whereClause = `
        AND s.id_station NOT IN (
          SELECT DISTINCT r.id_station 
          FROM reservation r 
          LEFT JOIN sessiondejeu ses ON r.id_reservation = ses.id_reservation
          WHERE DATE(r.date_reservation) = DATE(?)
          AND HOUR(r.date_reservation) = HOUR(?)
          AND (ses.id_session IS NULL OR ses.fin_session IS NULL)
        )
      `;
      params = [requestedDateTime, requestedDateTime];
    }
    
    const [stations] = await connection.execute(`
      SELECT 
        s.id_station,
        s.plateforme,
        b.config_pc,
        e.nombre_manettes,
        1 as available
      FROM stationjeu s
      LEFT JOIN bureau b ON s.id_station = b.id_station
      LEFT JOIN espaceconsole e ON s.id_station = e.id_station
      WHERE 1=1 ${whereClause}
      ORDER BY s.id_station
    `, params);

    console.log(`🔍 Available stations for ${date || 'any date'} ${time || 'any time'}:`, stations.length);
    
    res.json(stations.map(station => ({
      ...station,
      available: true
    })));
  } catch (error) {
    console.error('Error fetching available stations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin routes (require admin authentication)
// Create station
router.post('/', authenticateToken, [
  body('plateforme').isIn(['PC', 'Console']),
  body('config_pc').optional().trim(),
  body('nombre_manettes').optional().isInt({ min: 1, max: 8 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { plateforme, config_pc, nombre_manettes } = req.body;
    const connection = getConnection();

    // Start transaction
    await connection.beginTransaction();

    try {
      // Insert into stationjeu
      const [result] = await connection.execute(
        'INSERT INTO stationjeu (plateforme) VALUES (?)',
        [plateforme]
      );

      const stationId = result.insertId;

      // Insert into specific table based on platform
      if (plateforme === 'PC') {
        await connection.execute(
          'INSERT INTO bureau (id_station, config_pc) VALUES (?, ?)',
          [stationId, config_pc || 'Configuration standard']
        );
      } else if (plateforme === 'Console') {
        await connection.execute(
          'INSERT INTO espaceconsole (id_station, nombre_manettes) VALUES (?, ?)',
          [stationId, nombre_manettes || 2]
        );
      }

      await connection.commit();

      // Fetch the created station
      const [newStation] = await connection.execute(`
        SELECT 
          s.id_station,
          s.plateforme,
          b.config_pc,
          e.nombre_manettes
        FROM stationjeu s
        LEFT JOIN bureau b ON s.id_station = b.id_station
        LEFT JOIN espaceconsole e ON s.id_station = e.id_station
        WHERE s.id_station = ?
      `, [stationId]);

      res.status(201).json(newStation[0]);
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating station:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get station by ID
router.get('/:id', async (req, res) => {
  try {
    const connection = getConnection();
    const [station] = await connection.execute(`
      SELECT 
        s.id_station,
        s.plateforme,
        b.config_pc,
        e.nombre_manettes
      FROM stationjeu s
      LEFT JOIN bureau b ON s.id_station = b.id_station
      LEFT JOIN espaceconsole e ON s.id_station = e.id_station
      WHERE s.id_station = ?
    `, [req.params.id]);

    if (station.length === 0) {
      return res.status(404).json({ message: 'Station not found' });
    }

    res.json(station[0]);
  } catch (error) {
    console.error('Error fetching station:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create station
router.post('/', [
  body('plateforme').isIn(['PC', 'Console']),
  body('config_pc').optional().trim(),
  body('nombre_manettes').optional().isInt({ min: 1, max: 8 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { plateforme, config_pc, nombre_manettes } = req.body;
    const connection = getConnection();

    await connection.beginTransaction();

    try {
      // Create station
      const [stationResult] = await connection.execute(
        'INSERT INTO stationjeu (plateforme) VALUES (?)',
        [plateforme]
      );

      const stationId = stationResult.insertId;

      // Create specific station type
      if (plateforme === 'PC') {
        await connection.execute(
          'INSERT INTO bureau (id_station, config_pc) VALUES (?, ?)',
          [stationId, config_pc || '']
        );
      } else if (plateforme === 'Console') {
        await connection.execute(
          'INSERT INTO espaceconsole (id_station, nombre_manettes) VALUES (?, ?)',
          [stationId, nombre_manettes || 2]
        );
      }

      await connection.commit();

      // Get created station
      const [newStation] = await connection.execute(`
        SELECT 
          s.id_station,
          s.plateforme,
          b.config_pc,
          e.nombre_manettes
        FROM stationjeu s
        LEFT JOIN bureau b ON s.id_station = b.id_station
        LEFT JOIN espaceconsole e ON s.id_station = e.id_station
        WHERE s.id_station = ?
      `, [stationId]);

      res.status(201).json(newStation[0]);
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating station:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update station
router.put('/:id', [
  body('plateforme').isIn(['PC', 'Console']),
  body('config_pc').optional().trim(),
  body('nombre_manettes').optional().isInt({ min: 1, max: 8 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { plateforme, config_pc, nombre_manettes } = req.body;
    const connection = getConnection();

    await connection.beginTransaction();

    try {
      // Update station
      const [stationResult] = await connection.execute(
        'UPDATE stationjeu SET plateforme = ? WHERE id_station = ?',
        [plateforme, req.params.id]
      );

      if (stationResult.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Station not found' });
      }

      // Delete existing specific station data
      await connection.execute(
        'DELETE FROM bureau WHERE id_station = ?',
        [req.params.id]
      );
      await connection.execute(
        'DELETE FROM espaceconsole WHERE id_station = ?',
        [req.params.id]
      );

      // Create new specific station type
      if (plateforme === 'PC') {
        await connection.execute(
          'INSERT INTO bureau (id_station, config_pc) VALUES (?, ?)',
          [req.params.id, config_pc || '']
        );
      } else if (plateforme === 'Console') {
        await connection.execute(
          'INSERT INTO espaceconsole (id_station, nombre_manettes) VALUES (?, ?)',
          [req.params.id, nombre_manettes || 2]
        );
      }

      await connection.commit();

      // Get updated station
      const [updatedStation] = await connection.execute(`
        SELECT 
          s.id_station,
          s.plateforme,
          b.config_pc,
          e.nombre_manettes
        FROM stationjeu s
        LEFT JOIN bureau b ON s.id_station = b.id_station
        LEFT JOIN espaceconsole e ON s.id_station = e.id_station
        WHERE s.id_station = ?
      `, [req.params.id]);

      res.json(updatedStation[0]);
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error updating station:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete station
router.delete('/:id', async (req, res) => {
  try {
    const connection = getConnection();
    
    const [result] = await connection.execute(
      'DELETE FROM stationjeu WHERE id_station = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Station not found' });
    }

    res.json({ message: 'Station deleted successfully' });
  } catch (error) {
    console.error('Error deleting station:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Force refresh and cleanup - public route for debugging
router.post('/refresh', async (req, res) => {
  try {
    const connection = getConnection();
    
    console.log('🔄 Nettoyage et rafraîchissement forcé des stations...');
    
    // Terminate sessions running for more than 4 hours
    const [terminatedSessions] = await connection.execute(`
      UPDATE sessiondejeu 
      SET fin_session = NOW() 
      WHERE fin_session IS NULL 
      AND debut_session < DATE_SUB(NOW(), INTERVAL 4 HOUR)
    `);

    // Delete old reservations without sessions
    const [deletedReservations] = await connection.execute(`
      DELETE FROM reservation 
      WHERE date_reservation < DATE_SUB(NOW(), INTERVAL 1 DAY)
      AND id_reservation NOT IN (SELECT id_reservation FROM sessiondejeu)
    `);

    // Get fresh station data
    const [stations] = await connection.execute(`
      SELECT 
        s.id_station,
        s.plateforme,
        b.config_pc,
        e.nombre_manettes,
        COUNT(DISTINCT r.id_reservation) as total_reservations,
        COUNT(DISTINCT active_sessions.id_session) as active_sessions_count,
        COUNT(DISTINCT future_res.id_reservation) as future_reservations_count,
        CASE 
          WHEN COUNT(DISTINCT active_sessions.id_session) > 0 THEN 0
          WHEN COUNT(DISTINCT future_res.id_reservation) > 0 THEN 0
          ELSE 1
        END as available
      FROM stationjeu s
      LEFT JOIN bureau b ON s.id_station = b.id_station
      LEFT JOIN espaceconsole e ON s.id_station = e.id_station
      LEFT JOIN reservation r ON s.id_station = r.id_station
      LEFT JOIN sessiondejeu active_sessions ON r.id_reservation = active_sessions.id_reservation 
        AND active_sessions.fin_session IS NULL
      LEFT JOIN reservation future_res ON s.id_station = future_res.id_station 
        AND future_res.date_reservation >= NOW()
        AND future_res.id_reservation NOT IN (
          SELECT DISTINCT ses.id_reservation 
          FROM sessiondejeu ses 
          WHERE ses.fin_session IS NOT NULL
        )
      GROUP BY s.id_station, s.plateforme, b.config_pc, e.nombre_manettes
      ORDER BY s.id_station
    `);

    const cleanStations = stations.map(station => ({
      ...station,
      available: station.available === 1,
      last_updated: new Date().toISOString()
    }));

    console.log(`✅ Nettoyage terminé:`);
    console.log(`  - Sessions terminées: ${terminatedSessions.affectedRows}`);
    console.log(`  - Réservations supprimées: ${deletedReservations.affectedRows}`);
    console.log(`  - Stations disponibles: ${cleanStations.filter(s => s.available).length}/${cleanStations.length}`);

    res.json({
      message: 'Rafraîchissement effectué',
      stats: {
        terminatedSessions: terminatedSessions.affectedRows,
        deletedReservations: deletedReservations.affectedRows,
        availableStations: cleanStations.filter(s => s.available).length,
        totalStations: cleanStations.length
      },
      stations: cleanStations
    });
  } catch (error) {
    console.error('❌ Erreur lors du rafraîchissement:', error);
    res.status(500).json({ message: 'Erreur serveur interne' });
  }
});

export default router;