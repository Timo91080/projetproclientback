import axios from 'axios';

async function testClientRoutes() {
  try {
    console.log('🔐 Logging in as client...');
    
    // Login as client first
    const loginResponse = await axios.post('http://localhost:3001/api/auth/client/login', {
      email: 'test@client.com',
      password: 'testpassword123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Client login successful!');
    
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    
    // Test client reservations route
    console.log('\n📅 Testing /api/reservations (client view)...');
    try {
      const reservationsResponse = await axios.get('http://localhost:3001/api/reservations', { headers });
      console.log('✅ Reservations route accessible, found', reservationsResponse.data.length, 'reservations (client filtered)');
    } catch (error) {
      console.log('❌ Reservations route error:', error.response?.status, error.response?.statusText);
    }
    
    // Test /my reservations route
    console.log('\n📋 Testing /api/reservations/my...');
    try {
      const myReservationsResponse = await axios.get('http://localhost:3001/api/reservations/my', { headers });
      console.log('✅ My reservations route accessible, found', myReservationsResponse.data.length, 'personal reservations');
    } catch (error) {
      console.log('❌ My reservations route error:', error.response?.status, error.response?.statusText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testClientRoutes();
