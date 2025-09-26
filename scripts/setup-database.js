const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Read the setup SQL file
    const setupSqlPath = path.join(__dirname, '..', 'database', 'setup.sql');
    const setupSql = fs.readFileSync(setupSqlPath, 'utf8');
    
    console.log('📝 Running database setup script...');
    
    // Split the SQL into individual statements and execute them
    const statements = setupSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await sql.unsafe(statement);
          console.log('✅ Executed:', statement.split('\n')[0].substring(0, 50) + '...');
        } catch (error) {
          // Log but don't fail for "already exists" errors
          if (error.message.includes('already exists')) {
            console.log('ℹ️  Already exists:', statement.split('\n')[0].substring(0, 50) + '...');
          } else {
            console.error('❌ Failed to execute:', statement.split('\n')[0].substring(0, 50) + '...');
            console.error('Error:', error.message);
          }
        }
      }
    }
    
    console.log('\n🎉 Database setup completed!');
    
    // Verify the table was created correctly
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `;
    
    if (tableCheck[0].exists) {
      console.log('✅ Users table verified');
      
      // Get table structure to verify constraints
      const columns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position;
      `;
      
      console.log('\nTable structure:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
      
      // Check constraints
      const constraints = await sql`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = 'users' AND table_schema = 'public';
      `;
      
      console.log('\nConstraints:');
      constraints.forEach(constraint => {
        console.log(`  - ${constraint.constraint_name}: ${constraint.constraint_type}`);
      });
      
    } else {
      console.log('❌ Users table was not created properly');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

setupDatabase();