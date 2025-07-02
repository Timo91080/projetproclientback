// Test de gestion de compte client depuis mobile
const API_URL = 'http://172.20.10.6:3001/api';

async function testMobileAccountManagement() {
  console.log('📱 Test de gestion de compte client depuis mobile...');
  console.log(`📡 URL API: ${API_URL}`);
  
  try {
    // 1. Créer un compte de test
    console.log('\n1️⃣ Création d\'un compte client...');
    const registerResponse = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nom: 'Mobile',
        prenom: 'Test',
        email: 'mobile@test.com',
        password: 'mobile123'
      })
    });

    if (!registerResponse.ok) {
      throw new Error(`Registration failed: ${registerResponse.status}`);
    }

    const registerData = await registerResponse.json();
    const token = registerData.token;
    console.log('✅ Compte créé:', registerData.user.email);

    // 2. Test changement de mot de passe
    console.log('\n2️⃣ Test changement de mot de passe...');
    const changePasswordResponse = await fetch(`${API_URL}/auth/client/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        currentPassword: 'mobile123',
        newPassword: 'newmobile123'
      })
    });

    if (changePasswordResponse.ok) {
      console.log('✅ Mot de passe changé avec succès');
    } else {
      const errorData = await changePasswordResponse.json();
      console.log('❌ Erreur changement mot de passe:', errorData.message);
    }

    // 3. Test de connexion avec nouveau mot de passe
    console.log('\n3️⃣ Test de connexion avec nouveau mot de passe...');
    const loginResponse = await fetch(`${API_URL}/auth/client/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'mobile@test.com',
        password: 'newmobile123'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      const newToken = loginData.token;
      console.log('✅ Connexion réussie avec nouveau mot de passe');

      // 4. Test suppression de compte
      console.log('\n4️⃣ Test suppression de compte...');
      const deleteResponse = await fetch(`${API_URL}/auth/client/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${newToken}`
        },
        body: JSON.stringify({
          password: 'newmobile123'
        })
      });

      if (deleteResponse.ok) {
        console.log('✅ Compte supprimé avec succès');
      } else {
        const errorData = await deleteResponse.json();
        console.log('❌ Erreur suppression:', errorData.message);
      }
    } else {
      console.log('❌ Échec de connexion avec nouveau mot de passe');
    }

    console.log('\n🎉 Tests mobile terminés !');

  } catch (error) {
    console.error('❌ Erreur dans les tests mobile:', error.message);
    console.log('\n🔧 Solutions possibles:');
    console.log('- Vérifiez que le serveur backend est démarré');
    console.log('- Vérifiez la connectivité réseau');
    console.log('- Vérifiez l\'URL API dans le code');
  }
}

// Exécuter les tests
testMobileAccountManagement();
