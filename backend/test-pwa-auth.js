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
      
      // Test unified login
      console.log('\n🔐 Testing unified login...');
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: 'pwauserontest@test.com',
        password: 'testpassword123'
      });
      
      console.log('✅ Unified login successful!');
      console.log('👤 User:', loginResponse.data.user);
      console.log('🏷️ User Type:', loginResponse.data.userType);
      
      const token = loginResponse.data.token;
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Test profile retrieval
      console.log('\n👤 Testing profile retrieval...');
      const profileResponse = await axios.get(`${API_URL}/auth/profile`, { headers });
      console.log('✅ Profile retrieved successfully!');
      console.log('📋 Profile:', profileResponse.data);

      // Test password change
      console.log('\n🔑 Testing password change...');
      await axios.put(`${API_URL}/auth/change-password`, {
        currentPassword: 'testpassword123',
        newPassword: 'newtestpassword123'
      }, { headers });
      console.log('✅ Password changed successfully!');

      // Test login with new password
      console.log('\n🔐 Testing login with new password...');
      const newLoginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: 'pwauserontest@test.com',
        password: 'newtestpassword123'
      });
      console.log('✅ Login with new password successful!');
      
      const newToken = newLoginResponse.data.token;
      const newHeaders = {
        'Authorization': `Bearer ${newToken}`,
        'Content-Type': 'application/json'
      };

      // Test account deletion
      console.log('\n🗑️ Testing account deletion...');
      await axios.delete(`${API_URL}/auth/delete-account`, {
        headers: newHeaders,
        data: { password: 'newtestpassword123' }
      });
      console.log('✅ Account deleted successfully!');

      console.log('\n🎉 All PWA authentication tests passed!');
      
    } catch (regError) {
      if (regError.response?.data?.message === 'Email already exists') {
        console.log('ℹ️ Email already exists, testing unified login directly...');
        
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
          email: 'pwauserontest@test.com',
          password: 'testpassword123'
        });
        
        console.log('✅ Unified login successful!');
        console.log('👤 User:', loginResponse.data.user);
        console.log('🏷️ User Type:', loginResponse.data.userType);
        
        const token = loginResponse.data.token;
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // Test existing user functionality
        console.log('\n👤 Testing profile for existing user...');
        const profileResponse = await axios.get(`${API_URL}/auth/profile`, { headers });
        console.log('✅ Existing user profile retrieved!');
        console.log('📋 Profile:', profileResponse.data);

        // Test password change
        console.log('\n🔑 Testing password change...');
        await axios.put(`${API_URL}/auth/change-password`, {
          currentPassword: 'testpassword123',
          newPassword: 'newtestpassword123'
        }, { headers });
        console.log('✅ Password changed successfully!');

        // Test login with new password
        console.log('\n🔐 Testing login with new password...');
        const newLoginResponse = await axios.post(`${API_URL}/auth/login`, {
          email: 'pwauserontest@test.com',
          password: 'newtestpassword123'
        });
        console.log('✅ Login with new password successful!');
        
        const newToken = newLoginResponse.data.token;
        const newHeaders = {
          'Authorization': `Bearer ${newToken}`,
          'Content-Type': 'application/json'
        };

        // Test account deletion
        console.log('\n🗑️ Testing account deletion...');
        await axios.delete(`${API_URL}/auth/delete-account`, {
          headers: newHeaders,
          data: { password: 'newtestpassword123' }
        });
        console.log('✅ Account deleted successfully!');

        console.log('\n🎉 All PWA authentication tests passed!');
      } else {
        throw regError;
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testPWAAuth();
