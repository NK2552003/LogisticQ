const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    // Test basic connection
    const result = await sql`SELECT version()`;
    console.log('✅ Database connection successful!');
    console.log('PostgreSQL version:', result[0].version);
    
    // Check if users table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `;
    
    if (tableCheck[0].exists) {
      console.log('✅ Users table exists');
      
      // Get table structure
      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position;
      `;
      
      console.log('Table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    } else {
      console.log('❌ Users table does not exist');
      console.log('Run: psql $DATABASE_URL -f database/setup.sql');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('\n💡 Solution: Create the users table by running:');
      console.log('psql $DATABASE_URL -f database/setup.sql');
    } else if (error.message.includes('connection')) {
      console.log('\n💡 Solution: Check your DATABASE_URL in .env file');
    }
    
    process.exit(1);
  }
}

testConnection();