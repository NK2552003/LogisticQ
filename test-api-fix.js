const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

// Test database connection and API logic
async function testAPI() {
  try {
    console.log('🔍 Testing API functionality...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set ✅' : 'Not set ❌');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const sql = neon(process.env.DATABASE_URL);
    
    console.log('📡 Testing database connection...');
    
    // Test basic connection
    const result = await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful:', result);
    
    // Test shipments table exists
    console.log('📋 Checking shipments table...');
    const tableCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'shipments'
    `;
    
    if (tableCheck.length === 0) {
      console.log('❌ Shipments table does not exist');
      console.log('🔧 You may need to run the database setup script');
      return;
    }
    
    console.log('✅ Shipments table exists');
    
    // Test the actual query that was failing
    console.log('🔍 Testing shipments query with status=pending and unassigned=true...');
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
    if (shipments.length > 0) {
      console.log('📋 Sample shipment:', shipments[0]);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

testAPI();