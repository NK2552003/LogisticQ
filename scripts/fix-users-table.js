const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function fixUserTable() {
  try {
    console.log('🔧 Fixing users table constraints...');
    
    // First, let's check current constraints
    console.log('📊 Current table structure:');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `;
    
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Check if there are any NULL values in clerk_user_id that would prevent adding NOT NULL constraint
    const nullCheck = await sql`
      SELECT COUNT(*) as null_count 
      FROM users 
      WHERE clerk_user_id IS NULL;
    `;
    
    console.log(`\n📋 Found ${nullCheck[0].null_count} rows with NULL clerk_user_id`);
    
    if (nullCheck[0].null_count > 0) {
      console.log('⚠️  Cannot add NOT NULL constraint with existing NULL values');
      console.log('Cleaning up NULL values...');
      
      // Delete rows with NULL clerk_user_id (these are likely test data)
      const deleteResult = await sql`
        DELETE FROM users WHERE clerk_user_id IS NULL;
      `;
      console.log(`🧹 Deleted ${deleteResult.count} rows with NULL clerk_user_id`);
    }
    
    // Now add the NOT NULL constraint to clerk_user_id
    console.log('🔒 Adding NOT NULL constraint to clerk_user_id...');
    try {
      await sql`ALTER TABLE users ALTER COLUMN clerk_user_id SET NOT NULL;`;
      console.log('✅ Added NOT NULL constraint to clerk_user_id');
    } catch (error) {
      if (error.message.includes('already')) {
        console.log('ℹ️  NOT NULL constraint already exists');
      } else {
        console.error('❌ Failed to add NOT NULL constraint:', error.message);
      }
    }
    
    // Add unique constraint if it doesn't exist
    console.log('🔑 Adding UNIQUE constraint to clerk_user_id...');
    try {
      await sql`ALTER TABLE users ADD CONSTRAINT users_clerk_user_id_key UNIQUE (clerk_user_id);`;
      console.log('✅ Added UNIQUE constraint to clerk_user_id');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  UNIQUE constraint already exists');
      } else {
        console.error('❌ Failed to add UNIQUE constraint:', error.message);
      }
    }
    
    // Verify the final structure
    console.log('\n🎯 Final table structure:');
    const finalColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `;
    
    finalColumns.forEach(col => {
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
    
    console.log('\n🎉 Users table is now properly configured!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Failed to fix users table:');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixUserTable();