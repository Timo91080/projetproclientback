import axios from 'axios';

async function testAdminRoutes() {
  try {
    console.log('🔐 Logging in as admin...');
    
    // Login first
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@gamezone.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful!');
    
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    
    // Test clients route
    console.log('\n📋 Testing /api/clients...');
    try {
      const clientsResponse = await axios.get('http://localhost:3001/api/clients', { headers });
      console.log('✅ Clients route accessible, found', clientsResponse.data.length, 'clients');
    } catch (error) {
      console.log('❌ Clients route error:', error.response?.status, error.response?.statusText);
    }
    
    // Test stations route
    console.log('\n🖥️ Testing /api/stations...');
    try {
      const stationsResponse = await axios.get('http://localhost:3001/api/stations', { headers });
      console.log('✅ Stations route accessible, found', stationsResponse.data.length, 'stations');
    } catch (error) {
      console.log('❌ Stations route error:', error.response?.status, error.response?.statusText);
    }
    
    // Test reservations route
    console.log('\n📅 Testing /api/reservations...');
    try {
      const reservationsResponse = await axios.get('http://localhost:3001/api/reservations', { headers });
      console.log('✅ Reservations route accessible, found', reservationsResponse.data.length, 'reservations');
    } catch (error) {
      console.log('❌ Reservations route error:', error.response?.status, error.response?.statusText);
    }
    
    // Test sessions route
    console.log('\n🎮 Testing /api/sessions...');
    try {
      const sessionsResponse = await axios.get('http://localhost:3001/api/sessions', { headers });
      console.log('✅ Sessions route accessible, found', sessionsResponse.data.length, 'sessions');
    } catch (error) {
      console.log('❌ Sessions route error:', error.response?.status, error.response?.statusText);
    }
    
    // Test dashboard route
    console.log('\n📊 Testing /api/dashboard/stats...');
    try {
      const dashboardResponse = await axios.get('http://localhost:3001/api/dashboard/stats', { headers });
      console.log('✅ Dashboard route accessible:', dashboardResponse.data);
    } catch (error) {
      console.log('❌ Dashboard route error:', error.response?.status, error.response?.statusText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAdminRoutes();
