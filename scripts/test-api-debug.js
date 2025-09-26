// Test API endpoints to debug 405 errors
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(`${process.env.DATABASE_URL}`);

async function testAPIEndpoints() {
  try {
    console.log('🔍 Testing API endpoints...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    // Test database connection first
    console.log('\n📡 Testing database connection...');
    const dbTest = await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful:', dbTest);
    
    // Test users table
    console.log('\n👥 Testing users table...');
    const users = await sql`SELECT COUNT(*) as count FROM users`;
    console.log('✅ Users count:', users[0].count);
    
    // Test available drivers query
    console.log('\n🚛 Testing available drivers query...');
    const drivers = await sql`
      SELECT 
        u.*,
        tp.vehicle_type,
        tp.vehicle_number,
        tp.license_number,
        tp.is_verified,
        tp.current_latitude,
        tp.current_longitude,
        tp.is_available,
        AVG(r.rating) as average_rating,
        COUNT(r.id) as total_ratings
      FROM users u
      JOIN transporter_profiles tp ON u.id = tp.user_id
      LEFT JOIN ratings r ON u.id = r.transporter_id
      WHERE u.role = 'transporter' 
        AND tp.is_available = true 
        AND tp.is_verified = true
      GROUP BY u.id, tp.vehicle_type, tp.vehicle_number, 
               tp.license_number, tp.is_verified, tp.current_latitude, 
               tp.current_longitude, tp.is_available
      ORDER BY average_rating DESC NULLS LAST
      LIMIT 5
    `;
    console.log('✅ Available drivers found:', drivers.length);
    if (drivers.length > 0) {
      console.log('First driver:', drivers[0]);
    }
    
    // Test shipments table
    console.log('\n📦 Testing shipments table...');
    try {
      const shipments = await sql`SELECT COUNT(*) as count FROM shipments`;
      console.log('✅ Shipments count:', shipments[0].count);
    } catch (shipmentError) {
      console.log('⚠️  Shipments table issue:', shipmentError.message);
    }
    
    // Test specific user lookup (simulating the API call)
    console.log('\n🔍 Testing user lookup...');
    const testUsers = await sql`
      SELECT id, email, first_name, last_name, clerk_user_id, role, profile_completed, created_at, updated_at
      FROM users 
      LIMIT 3
    `;
    console.log('✅ Sample users:', testUsers.length);
    if (testUsers.length > 0) {
      console.log('First user:', testUsers[0]);
    }
    
    console.log('\n✅ All database tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
}

// Run the test
testAPIEndpoints();