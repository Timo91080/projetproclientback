import { connectDatabase, getConnection } from './config/database.js';

async function addTestStations() {
  try {
    await connectDatabase();
    const connection = getConnection();

    console.log('🎮 Adding test stations...');

    // Check if stations already exist
    const [existingStations] = await connection.execute('SELECT COUNT(*) as count FROM stationjeu');
    
    if (existingStations[0].count > 0) {
      console.log('ℹ️ Stations already exist, skipping...');
      return;
    }

    // Start transaction
    await connection.beginTransaction();

    try {
      // Add PC Station 1
      const [pcResult1] = await connection.execute(
        'INSERT INTO stationjeu (plateforme) VALUES (?)',
        ['PC']
      );
      await connection.execute(
        'INSERT INTO bureau (id_station, config_pc) VALUES (?, ?)',
        [pcResult1.insertId, 'Intel i7-12700K, RTX 4070, 32GB RAM, SSD 1TB']
      );

      // Add PC Station 2
      const [pcResult2] = await connection.execute(
        'INSERT INTO stationjeu (plateforme) VALUES (?)',
        ['PC']
      );
      await connection.execute(
        'INSERT INTO bureau (id_station, config_pc) VALUES (?, ?)',
        [pcResult2.insertId, 'Intel i5-12400F, RTX 4060, 16GB RAM, SSD 512GB']
      );

      // Add Console Station 3
      const [consoleResult1] = await connection.execute(
        'INSERT INTO stationjeu (plateforme) VALUES (?)',
        ['Console']
      );
      await connection.execute(
        'INSERT INTO espaceconsole (id_station, nombre_manettes) VALUES (?, ?)',
        [consoleResult1.insertId, 4]
      );

      // Add Console Station 4
      const [consoleResult2] = await connection.execute(
        'INSERT INTO stationjeu (plateforme) VALUES (?)',
        ['Console']
      );
      await connection.execute(
        'INSERT INTO espaceconsole (id_station, nombre_manettes) VALUES (?, ?)',
        [consoleResult2.insertId, 2]
      );

      await connection.commit();
      console.log('✅ Test stations added successfully!');
      console.log('📊 Stations:');
      console.log('  - Station 1: PC Gaming (Intel i7, RTX 4070)');
      console.log('  - Station 2: PC Gaming (Intel i5, RTX 4060)');
      console.log('  - Station 3: Console (4 manettes)');
      console.log('  - Station 4: Console (2 manettes)');

    } catch (error) {
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error adding test stations:', error);
  } finally {
    process.exit(0);
  }
}

addTestStations();
