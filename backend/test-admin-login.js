import axios from 'axios';

async function testAdminLogin() {
  try {
    console.log('🔐 Testing admin login...');
    
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@gamezone.com',
      password: 'admin123'
    });
    
    console.log('✅ Login successful!');
    console.log('📧 Admin:', response.data.admin);
    console.log('🎫 Token:', response.data.token ? 'Generated' : 'Missing');
    console.log('📝 Full response:', JSON.stringify(response.data, null, 2));
    
    // Test token verification
    const verifyResponse = await axios.get('http://localhost:3001/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${response.data.token}`
      }
    });
    
    console.log('✅ Token verification successful!');
    console.log('👤 Verified admin:', verifyResponse.data.admin);
    
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
  }
}

testAdminLogin();
