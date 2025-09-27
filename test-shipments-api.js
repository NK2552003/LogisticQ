const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

// Test the shipments API endpoint directly
async function testShipmentsAPI() {
  try {
    console.log('🔍 Testing Shipments API endpoint...');
    
    // Test 1: GET all shipments
    console.log('\n📋 Test 1: GET all shipments');
    const response1 = await fetch('http://localhost:8081/api/shipments');
    const data1 = await response1.text();
    console.log('Status:', response1.status);
    console.log('Headers:', Object.fromEntries(response1.headers.entries()));
    console.log('Raw response:', data1);
    
    try {
      const json1 = JSON.parse(data1);
      console.log('Parsed JSON:', json1);
    } catch (e) {
      console.log('❌ Failed to parse JSON:', e.message);
    }
    
    // Test 2: GET with query parameters
    console.log('\n📋 Test 2: GET with query parameters (status=pending&unassigned=true)');
    const response2 = await fetch('http://localhost:8081/api/shipments?status=pending&unassigned=true');
    const data2 = await response2.text();
    console.log('Status:', response2.status);
    console.log('Raw response:', data2);
    
    try {
      const json2 = JSON.parse(data2);
      console.log('Parsed JSON:', json2);
    } catch (e) {
      console.log('❌ Failed to parse JSON:', e.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Wait a bit for the server to start
setTimeout(testShipmentsAPI, 3000);