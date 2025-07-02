import axios from 'axios';

async function testClientCreation() {
  try {
    console.log('📋 Testing client registration...');
    
    // Register a new client
    const registerResponse = await axios.post('http://localhost:3001/api/auth/register', {
      nom: 'Test',
      prenom: 'Client2',
      email: 'test2@client.com',
      password: 'testpassword123'
    });
    
    console.log('✅ Client registration successful!');
    console.log('📧 Client:', registerResponse.data.user);
    console.log('🎫 Token:', registerResponse.data.token ? 'Generated' : 'Missing');
    
    // Test login with the new client
    console.log('\n🔐 Testing client login...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/client/login', {
      email: 'test2@client.com',
      password: 'testpassword123'
    });
    
    console.log('✅ Client login successful!');
    console.log('📧 User:', loginResponse.data.user);
    
    return loginResponse.data.token;
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    return null;
  }
}

testClientCreation();
