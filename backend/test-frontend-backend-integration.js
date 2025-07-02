// async function testFrontendBackendIntegration() {
  console.log('Test d\'integration Frontend-Backend...');
  console.log(`URL API: ${API_URL}`);
  
  try {
    // 1. Test de l'endpoint de profil unifie
    console.log('\n1. Test de l\'endpoint de profil unifie...');intégration Frontend-Backend pour les nouvelles fonctionnalités
const API_URL = 'http://localhost:3001/api';

async function testFrontendBackendIntegration() {
  console.log('🔗 Test d'intégration Frontend-Backend...');
  console.log(`📡 URL API: ${API_URL}`);
  
  try {
    // 1. Test de l'endpoint de profil unifié
    console.log('\n1️⃣ Test de l\'endpoint de profil unifié...');
    
    // Créer un utilisateur de test
    const registerResponse = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nom: 'Frontend',
        prenom: 'Test',
        email: 'frontend.test@example.com',
        password: 'frontend123'
      })
    });

    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('✅ Inscription réussie');
      
      // Test du login unifié
      const loginResponse = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'frontend.test@example.com',
          password: 'frontend123'
        })
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log('✅ Login unifié réussi');
        console.log(`   Type utilisateur: ${loginData.userType}`);
        
        const token = loginData.token;
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // 2. Test du profil
        console.log('\n2️⃣ Test récupération profil...');
        const profileResponse = await fetch(`${API_URL}/auth/profile`, { headers });
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          console.log('✅ Profil récupéré avec succès');
          console.log(`   Format: ${JSON.stringify(profileData, null, 2)}`);
        } else {
          console.log('❌ Erreur récupération profil');
        }

        // 3. Test changement de mot de passe
        console.log('\n3️⃣ Test changement mot de passe...');
        const changePasswordResponse = await fetch(`${API_URL}/auth/change-password`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            currentPassword: 'frontend123',
            newPassword: 'newfrontend123'
          })
        });

        if (changePasswordResponse.ok) {
          console.log('✅ Changement de mot de passe réussi');
          
          // Test reconnexion avec nouveau mot de passe
          console.log('\n4️⃣ Test reconnexion avec nouveau mot de passe...');
          const newLoginResponse = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: 'frontend.test@example.com',
              password: 'newfrontend123'
            })
          });

          if (newLoginResponse.ok) {
            const newLoginData = await newLoginResponse.json();
            console.log('✅ Reconnexion avec nouveau mot de passe réussie');
            
            const newToken = newLoginData.token;
            const newHeaders = {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json'
            };

            // 5. Test suppression de compte
            console.log('\n5️⃣ Test suppression de compte...');
            const deleteResponse = await fetch(`${API_URL}/auth/delete-account`, {
              method: 'DELETE',
              headers: newHeaders,
              body: JSON.stringify({
                password: 'newfrontend123'
              })
            });

            if (deleteResponse.ok) {
              console.log('✅ Suppression de compte réussie');
              
              // Vérifier que le compte n'existe plus
              console.log('\n6️⃣ Vérification suppression...');
              const verifyDeleteResponse = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: 'frontend.test@example.com',
                  password: 'newfrontend123'
                })
              });

              if (!verifyDeleteResponse.ok) {
                console.log('✅ Compte bien supprimé (login impossible)');
              } else {
                console.log('❌ Erreur: le compte devrait être supprimé');
              }
            } else {
              const errorData = await deleteResponse.json();
              console.log('❌ Erreur suppression:', errorData.message);
            }
          } else {
            console.log('❌ Erreur reconnexion avec nouveau mot de passe');
          }
        } else {
          const errorData = await changePasswordResponse.json();
          console.log('❌ Erreur changement mot de passe:', errorData.message);
        }
      } else {
        console.log('❌ Erreur login unifié');
      }
    } else {
      const errorData = await registerResponse.json();
      if (errorData.message === 'Email already exists') {
        console.log('ℹ️ Email existe déjà, test avec utilisateur existant...');
        // Continuer le test avec l'utilisateur existant
      } else {
        console.log('❌ Erreur inscription:', errorData.message);
      }
    }

    console.log('\n🎉 Tests d\'intégration Frontend-Backend terminés !');

  } catch (error) {
    console.error('❌ Erreur dans les tests d\'intégration:', error.message);
    console.log('\n🔧 Solutions possibles:');
    console.log('- Vérifiez que le serveur backend est démarré');
    console.log('- Vérifiez que l\'URL API est correcte');
    console.log('- Vérifiez la configuration CORS');
  }
}

// Simuler l'appel depuis un environnement frontend
if (typeof window === 'undefined') {
  // On est dans Node.js, on peut exécuter directement
  testFrontendBackendIntegration();
} else {
  // On est dans le navigateur
  console.log('Ce test doit être exécuté dans la console du navigateur');
}
