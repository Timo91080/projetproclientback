import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

async function testClientAccountManagement() {
  console.log('🧪 Test de gestion de compte client...');
  
  try {
    // 1. Créer un compte client de test
    console.log('\n1️⃣ Création d\'un compte client de test...');
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      nom: 'Test',
      prenom: 'User',
      email: 'testuser@example.com',
      password: 'password123'
    });
    
    const token = registerResponse.data.token;
    const clientId = registerResponse.data.user.id_client;
    console.log('✅ Compte créé avec succès, ID:', clientId);
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Tester la vérification du token
    console.log('\n2️⃣ Vérification du token client...');
    const verifyResponse = await axios.get(`${API_BASE}/auth/client/verify`, { headers });
    console.log('✅ Token vérifié:', verifyResponse.data.user.email);

    // 3. Tester le changement de mot de passe
    console.log('\n3️⃣ Test de changement de mot de passe...');
    
    // Test avec mauvais mot de passe actuel
    try {
      await axios.put(`${API_BASE}/auth/client/change-password`, {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      }, { headers });
      console.log('❌ Erreur: changement avec mauvais mot de passe devrait échouer');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Rejet correct du mauvais mot de passe actuel');
      } else {
        console.log('❌ Erreur inattendue:', error.response?.status);
      }
    }

    // Test avec bon mot de passe actuel
    const changePasswordResponse = await axios.put(`${API_BASE}/auth/client/change-password`, {
      currentPassword: 'password123',
      newPassword: 'newpassword123'
    }, { headers });
    console.log('✅ Mot de passe changé avec succès');

    // 4. Tester la connexion avec le nouveau mot de passe
    console.log('\n4️⃣ Test de connexion avec le nouveau mot de passe...');
    const loginResponse = await axios.post(`${API_BASE}/auth/client/login`, {
      email: 'testuser@example.com',
      password: 'newpassword123'
    });
    console.log('✅ Connexion réussie avec le nouveau mot de passe');

    // 5. Tester la suppression de compte (avec mauvais mot de passe)
    console.log('\n5️⃣ Test de suppression de compte avec mauvais mot de passe...');
    try {
      await axios.delete(`${API_BASE}/auth/client/delete-account`, {
        headers,
        data: { password: 'wrongpassword' }
      });
      console.log('❌ Erreur: suppression avec mauvais mot de passe devrait échouer');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Rejet correct du mauvais mot de passe');
      } else {
        console.log('❌ Erreur inattendue:', error.response?.status);
      }
    }

    // 6. Tester la suppression de compte (avec bon mot de passe)
    console.log('\n6️⃣ Test de suppression de compte avec bon mot de passe...');
    const newToken = loginResponse.data.token;
    const newHeaders = {
      'Authorization': `Bearer ${newToken}`,
      'Content-Type': 'application/json'
    };

    const deleteResponse = await axios.delete(`${API_BASE}/auth/client/delete-account`, {
      headers: newHeaders,
      data: { password: 'newpassword123' }
    });
    console.log('✅ Compte supprimé avec succès');

    // 7. Vérifier que le compte n'existe plus
    console.log('\n7️⃣ Vérification que le compte est bien supprimé...');
    try {
      await axios.post(`${API_BASE}/auth/client/login`, {
        email: 'testuser@example.com',
        password: 'newpassword123'
      });
      console.log('❌ Erreur: la connexion devrait échouer après suppression');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Connexion échoue correctement après suppression');
      } else {
        console.log('❌ Erreur inattendue:', error.response?.status);
      }
    }

    console.log('\n🎉 Tous les tests sont passés avec succès !');

  } catch (error) {
    console.error('❌ Erreur dans les tests:', error.response?.data || error.message);
  }
}

// Exécuter les tests
testClientAccountManagement();
