const fetch = require('node-fetch');

async function testAPIEndpoint() {
  try {
    console.log('🧪 Testing user API endpoint...');
    
    const testUser = {
      email: `test_endpoint_${Date.now()}@example.com`,
      firstName: 'Endpoint',
      lastName: 'Test',
      clerkUserId: `clerk_endpoint_${Date.now()}`,
      password: 'hashedpassword123'
    };
    
    console.log('📝 Sending POST request to /user endpoint...');
    console.log('Test data:', {
      email: testUser.email,
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      clerkUserId: testUser.clerkUserId
    });
    
    const response = await fetch('http://localhost:8081/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });
    
    const responseText = await response.text();
    console.log('📊 Response status:', response.status);
    console.log('📄 Response body:', responseText);
    
    if (response.ok) {
      const responseData = JSON.parse(responseText);
      console.log('✅ API endpoint is working correctly!');
      console.log('Created user:', responseData.user);
    } else {
      console.log('❌ API endpoint returned an error');
      console.log('Status:', response.status);
      console.log('Error:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Failed to test API endpoint:');
    console.error('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure your development server is running with: npm start');
    }
  }
}

testAPIEndpoint();