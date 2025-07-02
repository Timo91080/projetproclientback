import { connectDatabase, getConnection } from './config/database.js'

async function testMobileScenario() {
  try {
    await connectDatabase()
    const connection = getConnection()

    console.log('🧪 Test du scénario mobile - GameZone PWA')
    console.log('='*50)

    // Test 1: Vérifier les stations disponibles
    console.log('\n1. Test des stations disponibles:')
    const [stations] = await connection.execute(`
      SELECT s.id_station, s.plateforme, 
             CASE WHEN active_sessions.id_session IS NOT NULL THEN 0 ELSE 1 END as available
      FROM stationjeu s
      LEFT JOIN (
        SELECT id_station, id_session 
        FROM sessiondejeu 
        WHERE fin_session IS NULL
      ) active_sessions ON s.id_station = active_sessions.id_station
      ORDER BY s.id_station
      LIMIT 5
    `)

    stations.forEach(station => {
      console.log(`   Station ${station.id_station} (${station.plateforme}): ${station.available ? '✅ Disponible' : '❌ Occupée'}`)
    })

    // Test 2: Simulation de réservation mobile
    console.log('\n2. Test de réservation mobile:')
    const testDate = new Date()
    testDate.setHours(14, 0, 0, 0) // 14h00 aujourd'hui
    const reservationTime = testDate.toISOString().slice(0, 19).replace('T', ' ')

    console.log(`   Date de test: ${reservationTime}`)
    
    // Vérifier les conflits pour une station
    const testStationId = stations[0]?.id_station
    if (testStationId) {
      const [conflicts] = await connection.execute(`
        SELECT COUNT(*) as conflicts
        FROM reservation r
        WHERE r.id_station = ? 
        AND DATE(r.date_reservation) = DATE(?)
        AND ABS(TIMESTAMPDIFF(MINUTE, r.date_reservation, ?)) < 60
      `, [testStationId, reservationTime, reservationTime])

      console.log(`   Station ${testStationId} - Conflits: ${conflicts[0].conflicts}`)
    }

    // Test 3: Vérification PWA
    console.log('\n3. URLs à tester sur mobile:')
    console.log('   📱 App PWA: http://192.168.1.34:4173/')
    console.log('   🧪 Test PWA: http://192.168.1.34:4173/pwa-test.html')
    console.log('   🔧 API Test: http://192.168.1.34:3001/api/stations')

    // Test 4: Instructions pour les tests mobiles
    console.log('\n4. Instructions de test mobile:')
    console.log('   📱 iPhone:')
    console.log('     - Ouvrir Safari')
    console.log('     - Aller sur http://192.168.1.34:4173/')
    console.log('     - Tester la sélection de créneaux horaires')
    console.log('     - Vérifier le bouton d\'installation PWA')
    
    console.log('   🤖 Android:')
    console.log('     - Ouvrir Chrome')
    console.log('     - Aller sur http://192.168.1.34:4173/')
    console.log('     - Chercher "Ajouter à l\'écran d\'accueil" dans le menu')
    console.log('     - Vérifier l\'installation PWA')

    console.log('\n5. Points de vérification:')
    console.log('   ✅ Les boutons de créneau sont-ils cliquables sur tactile?')
    console.log('   ✅ L\'input date s\'ouvre-t-il correctement?')
    console.log('   ✅ L\'app peut-elle être ajoutée à l\'écran d\'accueil?')
    console.log('   ✅ Les icônes s\'affichent-elles correctement?')
    console.log('   ✅ L\'app fonctionne-t-elle hors ligne (après première visite)?')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  } finally {
    process.exit(0)
  }
}

testMobileScenario()
