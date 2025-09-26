// API Testing utility for debugging Expo Router API issues
import { fetchAPI } from '../lib/fetch';

export const testAPIEndpoints = async () => {
  console.log('🧪 Starting API endpoint tests...');
  
  const tests = [
    {
      name: 'GET /drivers (basic)',
      url: '/drivers',
      method: 'GET'
    },
    {
      name: 'GET /drivers (with params)',
      url: '/drivers?role=transporter&available=true',
      method: 'GET'
    },
    {
      name: 'GET /user (with test user)',
      url: '/user?clerkUserId=user_33FmYimX195onPz4E7GGFHGnTbq',
      method: 'GET'
    },
    {
      name: 'GET /shipments',
      url: '/shipments',
      method: 'GET'
    }
  ];

  for (const test of tests) {
    try {
      console.log(`\n🧪 Testing: ${test.name}`);
      const options = test.method === 'GET' ? {} : { method: test.method };
      const response = await fetchAPI(test.url, options);
      console.log(`✅ ${test.name} - SUCCESS:`, response);
    } catch (error) {
      console.error(`❌ ${test.name} - FAILED:`, error);
    }
  }
  
  console.log('\n🧪 API endpoint tests completed!');
};

export const testSpecificEndpoint = async (url: string, options?: RequestInit) => {
  console.log(`🧪 Testing specific endpoint: ${url}`);
  try {
    const response = await fetchAPI(url, options);
    console.log(`✅ Success:`, response);
    return response;
  } catch (error) {
    console.error(`❌ Failed:`, error);
    throw error;
  }
};