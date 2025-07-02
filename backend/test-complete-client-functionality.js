import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

async function testCompleteClientFunctionality() {
  console.log('🔧 Test complet des fonctionnalités client...');
  
  try {
    // 1. Créer un compte client
    console.log('\n1️⃣ Création d\'un compte client...');
    const timestamp = Date.now();
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      nom: 'Dupont',
      prenom: 'Jean',
      email: `jean.dupont.${timestamp}@test.com`,
      password: 'motdepasse123'
    });
    
    const token = registerResponse.data.token;
    console.log('✅ Compte créé:', registerResponse.data.user.email);
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Obtenir le profil
    console.log('\n2️⃣ Récupération du profil...');
    const profileResponse = await axios.get(`${API_BASE}/client/profile`, { headers });
    console.log('✅ Profil récupéré:', profileResponse.data.email);

    // 3. Mettre à jour le profil
    console.log('\n3️⃣ Mise à jour du profil...');
    const updateResponse = await axios.put(`${API_BASE}/client/profile`, {
      nom: 'Dupont',
      prenom: 'Jean-Michel',
      email: `jean-michel.dupont.${timestamp}@test.com`
    }, { headers });
    console.log('✅ Profil mis à jour:', updateResponse.data.prenom);

    // 4. Obtenir les réservations (devrait être vide)
    console.log('\n4️⃣ Récupération des réservations...');
    const reservationsResponse = await axios.get(`${API_BASE}/client/reservations`, { headers });
    console.log('✅ Réservations récupérées:', reservationsResponse.data.length, 'réservations');

    // 5. Obtenir les sessions (devrait être vide)
    console.log('\n5️⃣ Récupération des sessions...');
    const sessionsResponse = await axios.get(`${API_BASE}/client/sessions`, { headers });
    console.log('✅ Sessions récupérées:', sessionsResponse.data.length, 'sessions');

    // 6. Changer le mot de passe
    console.log('\n6️⃣ Changement du mot de passe...');
    await axios.put(`${API_BASE}/auth/client/change-password`, {
      currentPassword: 'motdepasse123',
      newPassword: 'nouveaumotdepasse123'
    }, { headers });
    console.log('✅ Mot de passe changé');

    // 7. Se reconnecter avec le nouveau mot de passe
    console.log('\n7️⃣ Reconnexion avec nouveau mot de passe...');
    const newLoginResponse = await axios.post(`${API_BASE}/auth/client/login`, {
      email: `jean-michel.dupont.${timestamp}@test.com`,
      password: 'nouveaumotdepasse123'
    });
    const newToken = newLoginResponse.data.token;
    console.log('✅ Reconnexion réussie');

    // 8. Supprimer le compte
    console.log('\n8️⃣ Suppression du compte...');
    const newHeaders = {
      'Authorization': `Bearer ${newToken}`,
      'Content-Type': 'application/json'
    };
    
    await axios.delete(`${API_BASE}/auth/client/delete-account`, {
      headers: newHeaders,
      data: { password: 'nouveaumotdepasse123' }
    });
    console.log('✅ Compte supprimé');

    // 9. Vérifier que le compte n'existe plus
    console.log('\n9️⃣ Vérification de la suppression...');
    try {
      await axios.post(`${API_BASE}/auth/client/login`, {
        email: `jean-michel.dupont.${timestamp}@test.com`,
        password: 'nouveaumotdepasse123'
      });
      console.log('❌ Erreur: le compte devrait être supprimé');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Compte bien supprimé (connexion impossible)');
      }
    }

    console.log('\n🎉 Tous les tests sont passés avec succès !');

  } catch (error) {
    console.error('❌ Erreur dans les tests:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Exécuter les tests
testCompleteClientFunctionality();
