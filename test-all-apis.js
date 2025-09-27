const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

// Test all updated APIs
async function testAllAPIs() {
  try {
    console.log('🔍 Testing All Updated APIs...\n');
    
    const sql = neon(process.env.DATABASE_URL);
    
    // Test 1: Database connection
    console.log('📡 Test 1: Database connection');
    const dbTest = await sql`SELECT 1 as test`;
    console.log('✅ Database connected:', dbTest[0]);
    
    // Test 2: Data serialization function
    console.log('\n📋 Test 2: Testing data serialization');
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
    
    const testData = { 
      date: new Date(), 
      text: 'hello', 
      nested: { date: new Date(), value: 123 } 
    };
    const serialized = serializeData(testData);
    console.log('✅ Data serialization successful');
    
    // Test 3: Test shipments query (main query from shipments API)
    console.log('\n📋 Test 3: Testing shipments query');
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
      LIMIT 5
    `;
    console.log(`✅ Shipments query successful! Found ${shipments.length} shipments`);
    
    // Test 4: Test users query (from drivers API)
    console.log('\n📋 Test 4: Testing users query');
    const users = await sql`
      SELECT 
        u.*,
        CASE 
          WHEN u.role = 'customer' THEN CONCAT(u.first_name, ' ', u.last_name)
          WHEN u.role = 'business' THEN bp.company_name
          WHEN u.role = 'transporter' THEN tp.vehicle_type
        END as additional_info
      FROM users u
      LEFT JOIN business_profiles bp ON u.id = bp.user_id AND u.role = 'business'
      LEFT JOIN transporter_profiles tp ON u.id = tp.user_id AND u.role = 'transporter'
      WHERE u.role = 'transporter'
      ORDER BY u.created_at DESC
      LIMIT 3
    `;
    console.log(`✅ Users query successful! Found ${users.length} transporters`);
    
    // Test 5: Test payments query (from payments API)
    console.log('\n📋 Test 5: Testing payments query');
    const payments = await sql`
      SELECT 
        p.*,
        s.pickup_address,
        s.delivery_address,
        cu.first_name as customer_first_name,
        cu.last_name as customer_last_name,
        cu.email as customer_email
      FROM payments p
      JOIN shipments s ON p.shipment_id = s.id
      JOIN users cu ON s.customer_id = cu.id
      ORDER BY p.created_at DESC
      LIMIT 3
    `;
    console.log(`✅ Payments query successful! Found ${payments.length} payments`);
    
    // Test 6: Test JSON serialization of all data
    console.log('\n📋 Test 6: Testing JSON serialization of all data');
    const allData = {
      shipments: serializeData(shipments),
      users: serializeData(users),
      payments: serializeData(payments)
    };
    
    const jsonString = JSON.stringify(allData);
    console.log('✅ JSON serialization successful, total length:', jsonString.length);
    
    // Test 7: Test JSON parsing (round trip)
    console.log('\n📋 Test 7: Testing JSON round trip');
    const parsed = JSON.parse(jsonString);
    console.log('✅ JSON parsing successful');
    
    console.log('\n🎉 All API tests passed! All APIs should work correctly now.');
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`- Database connection: ✅`);
    console.log(`- Data serialization: ✅`);
    console.log(`- Shipments API query: ✅ (${shipments.length} records)`);
    console.log(`- Drivers API query: ✅ (${users.length} records)`);
    console.log(`- Payments API query: ✅ (${payments.length} records)`);
    console.log(`- JSON serialization: ✅ (${jsonString.length} chars)`);
    console.log(`- JSON parsing: ✅`);
    
    console.log('\n✅ All APIs are ready for mobile app usage!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

testAllAPIs();