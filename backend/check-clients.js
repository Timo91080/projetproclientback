import { connectDatabase, getConnection } from './config/database.js';

async function checkClients() {
  try {
    await connectDatabase();
    const connection = getConnection();
    const [clients] = await connection.execute('SELECT id_client, email, nom, prenom FROM client');
    
    console.log('📋 Clients in database:');
    clients.forEach(client => {
      console.log(`- ID: ${client.id_client}, Email: ${client.email}, Name: ${client.prenom} ${client.nom}`);
    });
    
    if (clients.length === 0) {
      console.log('❌ No clients found in database');
    }
  } catch (error) {
    console.error('❌ Error checking clients:', error);
  }
}

checkClients();
