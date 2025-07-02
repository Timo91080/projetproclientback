import express from 'express';
import { getConnection } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const connection = getConnection();

    // Get total counts
    const [totalClients] = await connection.execute('SELECT COUNT(*) as count FROM client');
    const [totalStations] = await connection.execute('SELECT COUNT(*) as count FROM stationjeu');
    const [totalReservations] = await connection.execute('SELECT COUNT(*) as count FROM reservation');
    const [activeSessions] = await connection.execute('SELECT COUNT(*) as count FROM sessiondejeu WHERE fin_session IS NULL');

    // Get reservations for today
    const [todayReservations] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM reservation 
      WHERE DATE(date_reservation) = CURDATE()
    `);

    // Get sessions for today
    const [todaySessions] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM sessiondejeu 
      WHERE DATE(debut_session) = CURDATE()
    `);

    // Get station utilization
    const [stationStats] = await connection.execute(`
      SELECT 
        s.plateforme,
        COUNT(s.id_station) as total_stations,
        COUNT(r.id_reservation) as total_reservations
      FROM stationjeu s
      LEFT JOIN reservation r ON s.id_station = r.id_station
      GROUP BY s.plateforme
    `);

    // Get recent activity
    const [recentSessions] = await connection.execute(`
      SELECT 
        s.id_session,
        s.debut_session,
        s.fin_session,
        st.plateforme,
        st.id_station,
        GROUP_CONCAT(CONCAT(c.prenom, ' ', c.nom) SEPARATOR ', ') as clients
      FROM sessiondejeu s
      JOIN reservation r ON s.id_reservation = r.id_reservation
      JOIN stationjeu st ON r.id_station = st.id_station
      LEFT JOIN client_reservation cr ON r.id_reservation = cr.id_reservation
      LEFT JOIN client c ON cr.id_client = c.id_client
      GROUP BY s.id_session
      ORDER BY s.debut_session DESC
      LIMIT 5
    `);

    res.json({
      totalClients: totalClients[0].count,
      totalStations: totalStations[0].count,
      totalReservations: totalReservations[0].count,
      activeSessions: activeSessions[0].count,
      todayReservations: todayReservations[0].count,
      todaySessions: todaySessions[0].count,
      stationStats,
      recentSessions
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;