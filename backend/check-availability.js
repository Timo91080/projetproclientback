import { connectDatabase, getConnection } from './config/database.js';

async function checkDatabaseStatus() {
  try {
    await connectDatabase();
    const connection = getConnection();

    console.log('=== VERIFICATION DES SESSIONS ACTIVES ===');
    const [sessions] = await connection.execute(`
      SELECT 
        s.id_session,
        s.debut_session,
        s.fin_session,
        r.id_station,
        r.date_reservation,
        st.plateforme
      FROM sessiondejeu s
      JOIN reservation r ON s.id_reservation = r.id_reservation
      JOIN stationjeu st ON r.id_station = st.id_station
      WHERE s.fin_session IS NULL
      ORDER BY s.debut_session DESC
    `);

    console.log(`Sessions actives: ${sessions.length}`);
    sessions.forEach(s => {
      console.log(`- Station ${s.id_station} (${s.plateforme}): Session ${s.id_session} débutée à ${s.debut_session}`);
    });

    console.log('\n=== VERIFICATION DES RESERVATIONS FUTURES ===');
    const [reservations] = await connection.execute(`
      SELECT 
        r.id_reservation,
        r.id_station,
        r.date_reservation,
        st.plateforme,
        s.id_session,
        s.fin_session
      FROM reservation r
      JOIN stationjeu st ON r.id_station = st.id_station
      LEFT JOIN sessiondejeu s ON r.id_reservation = s.id_reservation
      WHERE r.date_reservation >= NOW() - INTERVAL 1 DAY
      ORDER BY r.date_reservation
    `);

    console.log(`Réservations (24h): ${reservations.length}`);
    reservations.forEach(r => {
      const status = r.id_session ? (r.fin_session ? 'Terminée' : 'Active') : 'En attente';
      console.log(`- Station ${r.id_station} (${r.plateforme}): Réservation ${r.id_reservation} pour ${r.date_reservation} - ${status}`);
    });

    console.log('\n=== VERIFICATION DISPONIBILITE STATIONS ===');
    const [stationsStatus] = await connection.execute(`
      SELECT 
        s.id_station,
        s.plateforme,
        COUNT(DISTINCT r.id_reservation) as total_reservations,
        COUNT(DISTINCT active_sessions.id_session) as active_sessions_count,
        COUNT(DISTINCT future_res.id_reservation) as future_reservations_count,
        CASE 
          WHEN COUNT(DISTINCT active_sessions.id_session) > 0 THEN 'OCCUPEE - Session active'
          WHEN COUNT(DISTINCT future_res.id_reservation) > 0 THEN 'OCCUPEE - Réservation future'
          ELSE 'DISPONIBLE'
        END as status
      FROM stationjeu s
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
      GROUP BY s.id_station, s.plateforme
      ORDER BY s.id_station
    `);

    console.log(`Status des stations:`);
    stationsStatus.forEach(s => {
      console.log(`- Station ${s.id_station} (${s.plateforme}): ${s.status}`);
      console.log(`  * Sessions actives: ${s.active_sessions_count}`);
      console.log(`  * Réservations futures: ${s.future_reservations_count}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    process.exit(0);
  }
}

checkDatabaseStatus();
