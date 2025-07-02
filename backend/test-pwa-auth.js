import axios from 'axios';

async function testPWAAuth() {
  try {
    console.log('🧪 Testing PWA authentication with CORS fix...');
    
    const API_URL = 'http://localhost:3001/api';
    
    // Test registration
    console.log('\n📝 Testing registration...');
    try {
      const registerResponse = await axios.post(`${API_URL}/auth/register`, {
        nom: 'TestPWA',
        prenom: 'User',
        email: 'pwauserontest@test.com',
        password: 'testpassword123'
      });
      
      console.log('✅ Registration successful!');
      console.log('👤 User:', registerResponse.data.user);
      console.log('🎫 Token:', registerResponse.data.token ? 'Generated' : 'Missing');
      
      // Test login with same credentials
      console.log('\n🔐 Testing login...');
      const loginResponse = await axios.post(`${API_URL}/auth/client/login`, {
        email: 'pwauserontest@test.com',
        password: 'testpassword123'
      });
      
      console.log('✅ Login successful!');
      console.log('👤 User:', loginResponse.data.user);
      
    } catch (regError) {
      if (regError.response?.data?.message === 'Email already exists') {
        console.log('ℹ️ Email already exists, testing login directly...');
        
        const loginResponse = await axios.post(`${API_URL}/auth/client/login`, {
          email: 'pwauserontest@test.com',
          password: 'testpassword123'
        });
        
        console.log('✅ Login successful!');
        console.log('👤 User:', loginResponse.data.user);
      } else {
        throw regError;
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testPWAAuth();
