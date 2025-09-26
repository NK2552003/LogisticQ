const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function createProfileTables() {
  try {
    console.log('🏗️  Creating profile tables...');
    
    // Create business_profiles table
    await sql`
      CREATE TABLE IF NOT EXISTS business_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        company_name VARCHAR(255) NOT NULL,
        business_type VARCHAR(100),
        gst_number VARCHAR(50),
        business_address TEXT,
        contact_person VARCHAR(255),
        business_phone VARCHAR(20),
        business_email VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ Created business_profiles table');

    // Create transporter_profiles table
    await sql`
      CREATE TABLE IF NOT EXISTS transporter_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        vehicle_type VARCHAR(100),
        vehicle_number VARCHAR(50),
        license_number VARCHAR(100),
        vehicle_capacity_kg DECIMAL(10,2),
        service_areas TEXT[],
        is_verified BOOLEAN DEFAULT FALSE,
        verification_documents JSONB,
        current_location POINT,
        is_available BOOLEAN DEFAULT TRUE,
        rating DECIMAL(3,2) DEFAULT 0,
        total_deliveries INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ Created transporter_profiles table');

    // Create customer_profiles table
    await sql`
      CREATE TABLE IF NOT EXISTS customer_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        preferred_delivery_address TEXT,
        delivery_instructions TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ Created customer_profiles table');

    // Create admin_profiles table
    await sql`
      CREATE TABLE IF NOT EXISTS admin_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        admin_level VARCHAR(50) DEFAULT 'standard',
        permissions JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ Created admin_profiles table');

    // Create indexes
    console.log('📝 Creating indexes...');
    
    await sql`CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_transporter_profiles_user_id ON transporter_profiles(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON customer_profiles(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_admin_profiles_user_id ON admin_profiles(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_transporter_location ON transporter_profiles USING GIST(current_location);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_transporter_available ON transporter_profiles(is_available);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_transporter_verified ON transporter_profiles(is_verified);`;
    
    console.log('✅ Created all indexes');

    // Verify all tables exist
    console.log('\n📋 Final verification - all tables:');
    const allTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log(`\n📊 Total tables: ${allTables.length}`);
    allTables.forEach(table => console.log(`  ✅ ${table.table_name}`));

    console.log('\n🎉 All profile tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create profile tables:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

createProfileTables();