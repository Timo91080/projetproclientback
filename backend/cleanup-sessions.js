import { connectDatabase, getConnection } from './config/database.js';

async function cleanupSessions() {
  try {
    await connectDatabase();
    const connection = getConnection();

    console.log('🧹 Nettoyage des sessions anciennes...');

    // Terminer toutes les sessions qui durent depuis plus de 4 heures
    const [longSessions] = await connection.execute(`
      UPDATE sessiondejeu 
      SET fin_session = NOW() 
      WHERE fin_session IS NULL 
      AND debut_session < DATE_SUB(NOW(), INTERVAL 4 HOUR)
    `);

    if (longSessions.affectedRows > 0) {
      console.log(`✅ ${longSessions.affectedRows} sessions longues terminées automatiquement`);
    }

    // Supprimer les réservations anciennes sans session
    const [oldReservations] = await connection.execute(`
      DELETE FROM reservation 
      WHERE date_reservation < DATE_SUB(NOW(), INTERVAL 1 DAY)
      AND id_reservation NOT IN (SELECT id_reservation FROM sessiondejeu)
    `);

    if (oldReservations.affectedRows > 0) {
      console.log(`✅ ${oldReservations.affectedRows} réservations anciennes supprimées`);
    }

    // Vérifier l'état final
    const [activeSessions] = await connection.execute(`
      SELECT COUNT(*) as count FROM sessiondejeu WHERE fin_session IS NULL
    `);

    const [futureReservations] = await connection.execute(`
      SELECT COUNT(*) as count FROM reservation WHERE date_reservation >= NOW()
    `);

    console.log(`📊 État final:`);
    console.log(`  - Sessions actives: ${activeSessions[0].count}`);
    console.log(`  - Réservations futures: ${futureReservations[0].count}`);

    // Forcer une réinitialisation de l'état des stations
    console.log('\n🔄 Mise à jour forcée de l\'état des stations...');
    
    const [stationsUpdate] = await connection.execute(`
      SELECT 
        s.id_station,
        s.plateforme,
        CASE 
          WHEN active_sessions.active_count > 0 THEN 0
          WHEN future_reservations.future_count > 0 THEN 0
          ELSE 1
        END as should_be_available
      FROM stationjeu s
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
    `);

    console.log(`État des stations après nettoyage:`);
    stationsUpdate.forEach(s => {
      const status = s.should_be_available ? '✅ DISPONIBLE' : '❌ OCCUPÉE';
      console.log(`  - Station ${s.id_station} (${s.plateforme}): ${status}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    process.exit(0);
  }
}

cleanupSessions();
