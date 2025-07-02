// Test de connectivité mobile - Hotspot
const API_URL = 'http://172.20.10.6:3001/api';

async function testConnectivity() {
  console.log('🔍 Test de connectivité mobile (Hotspot)...');
  console.log(`📡 URL API: ${API_URL}`);
  
  try {
    // Test de base de l'API
    console.log('\n1. Test du endpoint health...');
    const healthResponse = await fetch(`${API_URL.replace('/api', '')}/api/health`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Serveur accessible:', healthData);
    } else {
      console.log('❌ Erreur health check:', healthResponse.status);
    }

    // Test des stations
    console.log('\n2. Test des stations...');
    const stationsResponse = await fetch(`${API_URL}/stations`);
    
    if (stationsResponse.ok) {
      const stations = await stationsResponse.json();
      console.log('✅ Stations accessibles:', stations.length, 'stations trouvées');
    } else {
      console.log('❌ Erreur stations:', stationsResponse.status);
    }

  } catch (error) {
    console.error('❌ Erreur de connectivité:', error);
    console.log('\n🔧 Solutions possibles:');
    console.log('- Vérifiez que le serveur backend est démarré');
    console.log('- Vérifiez que votre téléphone est connecté au même hotspot');
    console.log('- Vérifiez que le pare-feu Windows autorise les connexions');
  }
}

// Exécuter le test
testConnectivity();
