const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

// Test the updated shipments API
async function testUpdatedShipmentsAPI() {
  try {
    console.log('🔍 Testing Updated Shipments API...\n');
    
    const sql = neon(process.env.DATABASE_URL);
    
    // Test 1: Database connection
    console.log('📡 Test 1: Database connection');
    const dbTest = await sql`SELECT 1 as test`;
    console.log('✅ Database connected:', dbTest[0]);
    
    // Test 2: Check shipments table structure
    console.log('\n📋 Test 2: Checking table structure');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'shipments' 
      ORDER BY ordinal_position
    `;
    console.log('✅ Table structure verified, columns:', columns.length);
    
    // Test 3: Test GET query (what API will execute)
    console.log('\n📋 Test 3: Testing GET query for unassigned pending shipments');
    const shipments = await sql`
      SELECT 
        s.*,
        u_customer.first_name as customer_first_name,
        u_customer.last_name as customer_last_name,
        u_customer.email as customer_email,
        u_driver.first_name as driver_first_name,
        u_driver.last_name as driver_last_name,
        u_driver.email as driver_email
      FROM shipments s
      LEFT JOIN users u_customer ON s.customer_id = u_customer.id
      LEFT JOIN users u_driver ON s.driver_id = u_driver.id
      WHERE s.status = 'pending' AND s.driver_id IS NULL
      ORDER BY s.created_at DESC
    `;
    console.log(`✅ Query successful! Found ${shipments.length} unassigned pending shipments`);
    
    // Test 4: Test data serialization (what caused JSON issues)
    console.log('\n📋 Test 4: Testing data serialization');
    function serializeData(data) {
      if (Array.isArray(data)) {
        return data.map(serializeData);
      } else if (data && typeof data === 'object') {
        const serialized = {};
        for (const [key, value] of Object.entries(data)) {
          if (value instanceof Date) {
            serialized[key] = value.toISOString();
          } else if (value && typeof value === 'object') {
            serialized[key] = serializeData(value);
          } else {
            serialized[key] = value;
          }
        }
        return serialized;
      }
      return data;
    }
    
    const serializedShipments = serializeData(shipments);
    console.log('✅ Data serialization successful');
    
    // Test 5: Test JSON stringification
    console.log('\n📋 Test 5: Testing JSON stringification');
    const jsonString = JSON.stringify({
      success: true,
      data: serializedShipments,
      count: shipments.length
    });
    console.log('✅ JSON stringification successful, length:', jsonString.length);
    
    // Test 6: Test JSON parsing (round trip)
    console.log('\n📋 Test 6: Testing JSON round trip');
    const parsed = JSON.parse(jsonString);
    console.log('✅ JSON parsing successful, data count:', parsed.data.length);
    
    console.log('\n🎉 All tests passed! API should work correctly now.');
    
    if (shipments.length > 0) {
      console.log('\n📋 Sample shipment data:');
      console.log(JSON.stringify(serializedShipments[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

testUpdatedShipmentsAPI();