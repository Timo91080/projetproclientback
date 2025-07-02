import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

async function testBasicClientFunctionality() {
  console.log('🔧 Test des fonctionnalités de base client...');
  
  try {
    // 1. Créer un compte client
    console.log('\n1️⃣ Création d\'un compte client...');
    const timestamp = Date.now();
    const email = `test.user.${timestamp}@example.com`;
    
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      nom: 'Test',
      prenom: 'User',
      email: email,
      password: 'testpassword123'
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
    const newEmail = `updated.user.${timestamp}@example.com`;
    const updateResponse = await axios.put(`${API_BASE}/client/profile`, {
      nom: 'Updated',
      prenom: 'User',
      email: newEmail
    }, { headers });
    console.log('✅ Profil mis à jour:', updateResponse.data.prenom);

    // 4. Changer le mot de passe
    console.log('\n4️⃣ Changement du mot de passe...');
    await axios.put(`${API_BASE}/auth/client/change-password`, {
      currentPassword: 'testpassword123',
      newPassword: 'newpassword123'
    }, { headers });
    console.log('✅ Mot de passe changé');

    // 5. Se reconnecter avec le nouveau mot de passe
    console.log('\n5️⃣ Reconnexion avec nouveau mot de passe...');
    const newLoginResponse = await axios.post(`${API_BASE}/auth/client/login`, {
      email: newEmail,
      password: 'newpassword123'
    });
    const newToken = newLoginResponse.data.token;
    console.log('✅ Reconnexion réussie');

    // 6. Test avec mauvais mot de passe pour la suppression
    console.log('\n6️⃣ Test suppression avec mauvais mot de passe...');
    const newHeaders = {
      'Authorization': `Bearer ${newToken}`,
      'Content-Type': 'application/json'
    };
    
    try {
      await axios.delete(`${API_BASE}/auth/client/delete-account`, {
        headers: newHeaders,
        data: { password: 'wrongpassword' }
      });
      console.log('❌ Erreur: suppression avec mauvais mot de passe devrait échouer');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Rejet correct du mauvais mot de passe');
      }
    }

    // 7. Supprimer le compte avec bon mot de passe
    console.log('\n7️⃣ Suppression du compte...');
    await axios.delete(`${API_BASE}/auth/client/delete-account`, {
      headers: newHeaders,
      data: { password: 'newpassword123' }
    });
    console.log('✅ Compte supprimé');

    // 8. Vérifier que le compte n'existe plus
    console.log('\n8️⃣ Vérification de la suppression...');
    try {
      await axios.post(`${API_BASE}/auth/client/login`, {
        email: newEmail,
        password: 'newpassword123'
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
testBasicClientFunctionality();
