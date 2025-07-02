// Test du login unifié depuis mobile
const API_URL = 'http://172.20.10.6:3001/api';

async function testMobileUnifiedLogin() {
  console.log('📱 Test du login unifié depuis mobile...');
  console.log(`📡 URL API: ${API_URL}`);
  
  try {
    // 1. Test connexion admin depuis mobile
    console.log('\n1️⃣ Test connexion admin depuis mobile...');
    const adminLoginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@gamezone.com',
        password: 'admin123'
      })
    });

    if (adminLoginResponse.ok) {
      const adminData = await adminLoginResponse.json();
      console.log('✅ Connexion admin mobile réussie:', adminData.userType);
      
      // Test profil admin
      const adminProfileResponse = await fetch(`${API_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${adminData.token}`
        }
      });
      
      if (adminProfileResponse.ok) {
        const profileData = await adminProfileResponse.json();
        console.log('✅ Profil admin récupéré:', profileData.userType);
      }
    } else {
      console.log('❌ Erreur connexion admin mobile');
    }

    // 2. Créer un compte client mobile
    console.log('\n2️⃣ Création compte client mobile...');
    const registerResponse = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nom: 'Mobile',
        prenom: 'User',
        email: 'mobile.user@test.com',
        password: 'mobile123'
      })
    });

    if (registerResponse.ok) {
      console.log('✅ Compte client mobile créé');
    } else {
      const errorData = await registerResponse.json();
      console.log('❌ Erreur création compte:', errorData.message);
    }

    // 3. Test connexion client via login unifié
    console.log('\n3️⃣ Test connexion client mobile...');
    const clientLoginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'mobile.user@test.com',
        password: 'mobile123'
      })
    });

    if (clientLoginResponse.ok) {
      const clientData = await clientLoginResponse.json();
      console.log('✅ Connexion client mobile réussie:', clientData.userType);
      
      const token = clientData.token;

      // 4. Test changement mot de passe mobile
      console.log('\n4️⃣ Test changement mot de passe mobile...');
      const changePasswordResponse = await fetch(`${API_URL}/auth/change-password`, {
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
        console.log('✅ Mot de passe changé depuis mobile');

        // 5. Test reconnexion avec nouveau mot de passe
        console.log('\n5️⃣ Test reconnexion mobile...');
        const newLoginResponse = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'mobile.user@test.com',
            password: 'newmobile123'
          })
        });

        if (newLoginResponse.ok) {
          const newLoginData = await newLoginResponse.json();
          console.log('✅ Reconnexion mobile réussie');

          // 6. Test suppression compte mobile
          console.log('\n6️⃣ Test suppression compte mobile...');
          const deleteResponse = await fetch(`${API_URL}/auth/delete-account`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newLoginData.token}`
            },
            body: JSON.stringify({
              password: 'newmobile123'
            })
          });

          if (deleteResponse.ok) {
            console.log('✅ Compte supprimé depuis mobile');
          } else {
            const errorData = await deleteResponse.json();
            console.log('❌ Erreur suppression mobile:', errorData.message);
          }
        }
      } else {
        const errorData = await changePasswordResponse.json();
        console.log('❌ Erreur changement mot de passe mobile:', errorData.message);
      }
    } else {
      console.log('❌ Erreur connexion client mobile');
    }

    console.log('\n🎉 Tests mobile terminés !');

  } catch (error) {
    console.error('❌ Erreur dans les tests mobile:', error.message);
    console.log('\n🔧 Solutions possibles:');
    console.log('- Vérifiez que le serveur backend est démarré');
    console.log('- Vérifiez la connectivité réseau mobile');
    console.log('- Vérifiez que l\'URL API est correcte');
  }
}

// Exécuter les tests
testMobileUnifiedLogin();
