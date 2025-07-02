import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

async function testUnifiedLogin() {
  console.log('🔐 Test du système de connexion unifié...');
  
  try {
    // 1. Test connexion admin
    console.log('\n1️⃣ Test connexion administrateur...');
    const adminLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@gamezone.com',
      password: 'admin123'
    });
    
    console.log('✅ Connexion admin réussie:');
    console.log(`   Type: ${adminLoginResponse.data.userType}`);
    console.log(`   Email: ${adminLoginResponse.data.user.email}`);
    
    const adminToken = adminLoginResponse.data.token;
    const adminHeaders = {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    };

    // 2. Test profil admin
    console.log('\n2️⃣ Test récupération profil admin...');
    const adminProfileResponse = await axios.get(`${API_BASE}/auth/profile`, { headers: adminHeaders });
    console.log('✅ Profil admin récupéré:', adminProfileResponse.data.userType);

    // 3. Test changement mot de passe admin
    console.log('\n3️⃣ Test changement mot de passe admin...');
    try {
      await axios.put(`${API_BASE}/auth/change-password`, {
        currentPassword: 'admin123',
        newPassword: 'newadmin123'
      }, { headers: adminHeaders });
      console.log('✅ Mot de passe admin changé');

      // Remettre l'ancien mot de passe
      await axios.put(`${API_BASE}/auth/change-password`, {
        currentPassword: 'newadmin123',
        newPassword: 'admin123'
      }, { headers: adminHeaders });
      console.log('✅ Mot de passe admin restauré');
    } catch (error) {
      console.log('❌ Erreur changement mot de passe admin:', error.response?.data?.message);
    }

    // 4. Créer un compte client pour les tests
    console.log('\n4️⃣ Création d\'un compte client pour les tests...');
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      nom: 'TestUser',
      prenom: 'Unified',
      email: 'unified.test@example.com',
      password: 'password123'
    });
    console.log('✅ Compte client créé');

    // 5. Test connexion client avec le login unifié
    console.log('\n5️⃣ Test connexion client avec login unifié...');
    const clientLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'unified.test@example.com',
      password: 'password123'
    });
    
    console.log('✅ Connexion client réussie:');
    console.log(`   Type: ${clientLoginResponse.data.userType}`);
    console.log(`   Email: ${clientLoginResponse.data.user.email}`);
    
    const clientToken = clientLoginResponse.data.token;
    const clientHeaders = {
      'Authorization': `Bearer ${clientToken}`,
      'Content-Type': 'application/json'
    };

    // 6. Test profil client
    console.log('\n6️⃣ Test récupération profil client...');
    const clientProfileResponse = await axios.get(`${API_BASE}/auth/profile`, { headers: clientHeaders });
    console.log('✅ Profil client récupéré:', clientProfileResponse.data.userType);

    // 7. Test changement mot de passe client
    console.log('\n7️⃣ Test changement mot de passe client...');
    await axios.put(`${API_BASE}/auth/change-password`, {
      currentPassword: 'password123',
      newPassword: 'newpassword123'
    }, { headers: clientHeaders });
    console.log('✅ Mot de passe client changé');

    // 8. Test connexion avec nouveau mot de passe
    console.log('\n8️⃣ Test connexion avec nouveau mot de passe...');
    const newLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'unified.test@example.com',
      password: 'newpassword123'
    });
    console.log('✅ Connexion avec nouveau mot de passe réussie');

    const newClientToken = newLoginResponse.data.token;
    const newClientHeaders = {
      'Authorization': `Bearer ${newClientToken}`,
      'Content-Type': 'application/json'
    };

    // 9. Test suppression compte client
    console.log('\n9️⃣ Test suppression compte client...');
    await axios.delete(`${API_BASE}/auth/delete-account`, {
      headers: newClientHeaders,
      data: { password: 'newpassword123' }
    });
    console.log('✅ Compte client supprimé');

    // 10. Vérifier que le compte n'existe plus
    console.log('\n🔟 Vérification suppression...');
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        email: 'unified.test@example.com',
        password: 'newpassword123'
      });
      console.log('❌ Erreur: le compte devrait être supprimé');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Compte bien supprimé');
      }
    }

    // 11. Test que l'admin ne peut pas supprimer son compte
    console.log('\n1️⃣1️⃣ Test restriction suppression compte admin...');
    try {
      await axios.delete(`${API_BASE}/auth/delete-account`, {
        headers: adminHeaders,
        data: { password: 'admin123' }
      });
      console.log('❌ Erreur: l\'admin ne devrait pas pouvoir supprimer son compte');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Restriction admin confirmée');
      }
    }

    console.log('\n🎉 Tous les tests du login unifié sont passés !');

  } catch (error) {
    console.error('❌ Erreur dans les tests:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
}

// Exécuter les tests
testUnifiedLogin();
