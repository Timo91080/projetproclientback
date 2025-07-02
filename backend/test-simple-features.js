// Test simple des nouvelles fonctionnalites
const API_URL = 'http://localhost:3001/api';

async function testNewFeatures() {
  console.log('Test des nouvelles fonctionnalites...');
  
  try {
    // Test du login unifie avec un compte existant
    console.log('\nTest login unifie...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@gamezone.com',
        password: 'admin123'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('Login reussi - Type:', loginData.userType);
      
      const token = loginData.token;
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Test du profil
      console.log('\nTest profil...');
      const profileResponse = await fetch(`${API_URL}/auth/profile`, { headers });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('Profil recupere:', profileData.userType);
      } else {
        console.log('Erreur profil');
      }

      console.log('\nTests termines avec succes !');
    } else {
      console.log('Erreur login');
    }

  } catch (error) {
    console.error('Erreur:', error.message);
  }
}

testNewFeatures();
