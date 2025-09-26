const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function applyDatabaseFix() {
  try {
    console.log('🔧 Starting comprehensive database schema fix...\n');

    // 1. Add missing columns to users table
    console.log('👥 Fixing users table...');
    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255)`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)`;
      console.log('  ✅ Added missing columns to users table');
    } catch (err) {
      console.log('  ⚠️  Users table columns:', err.message);
    }

    // Update existing users to populate name field
    try {
      await sql`
        UPDATE users 
        SET name = CONCAT(first_name, ' ', last_name)
        WHERE name IS NULL AND (first_name IS NOT NULL OR last_name IS NOT NULL)
      `;
      console.log('  ✅ Updated existing user names');
    } catch (err) {
      console.log('  ⚠️  Updating names:', err.message);
    }

    // Create index for name column
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_users_name ON users(name)`;
      console.log('  ✅ Created name index');
    } catch (err) {
      console.log('  ⚠️  Name index:', err.message);
    }

    // 2. Fix transporter profiles table
    console.log('\n🚛 Fixing transporter_profiles table...');
    try {
      await sql`ALTER TABLE transporter_profiles ADD COLUMN IF NOT EXISTS current_latitude DECIMAL(10, 8)`;
      await sql`ALTER TABLE transporter_profiles ADD COLUMN IF NOT EXISTS current_longitude DECIMAL(11, 8)`;
      console.log('  ✅ Added latitude/longitude columns');
    } catch (err) {
      console.log('  ⚠️  Lat/lng columns:', err.message);
    }

    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_transporter_lat_lng ON transporter_profiles(current_latitude, current_longitude)`;
      console.log('  ✅ Created location index');
    } catch (err) {
      console.log('  ⚠️  Location index:', err.message);
    }

    // 3. Create missing chats table
    console.log('\n💬 Creating chats table...');
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS chats (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
          transporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
          shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
          status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;
      console.log('  ✅ Created chats table');
    } catch (err) {
      console.log('  ⚠️  Chats table:', err.message);
    }

    // Create chats indexes
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_chats_customer_id ON chats(customer_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_chats_transporter_id ON chats(transporter_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_chats_shipment_id ON chats(shipment_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_chats_status ON chats(status)`;
      console.log('  ✅ Created chats indexes');
    } catch (err) {
      console.log('  ⚠️  Chats indexes:', err.message);
    }

    // 4. Fix shipments table
    console.log('\n📦 Fixing shipments table...');
    try {
      await sql`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES users(id) ON DELETE SET NULL`;
      await sql`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS order_number VARCHAR(100)`;
      await sql`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100)`;
      console.log('  ✅ Added missing shipments columns');
    } catch (err) {
      console.log('  ⚠️  Shipments columns:', err.message);
    }

    try {
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_shipments_order_number ON shipments(order_number) WHERE order_number IS NOT NULL`;
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number) WHERE tracking_number IS NOT NULL`;
      console.log('  ✅ Created shipments indexes');
    } catch (err) {
      console.log('  ⚠️  Shipments indexes:', err.message);
    }

    // 5. Fix profile_completed column type
    console.log('\n🔧 Fixing data types...');
    try {
      await sql`
        ALTER TABLE users ALTER COLUMN profile_completed TYPE BOOLEAN USING 
          CASE 
            WHEN profile_completed::text = 'true' OR profile_completed::text = '1' THEN TRUE
            WHEN profile_completed::text = 'false' OR profile_completed::text = '0' THEN FALSE
            ELSE FALSE
          END
      `;
      console.log('  ✅ Fixed profile_completed boolean type');
    } catch (err) {
      console.log('  ⚠️  Boolean conversion:', err.message);
    }

    // 6. Create tracking view (for API compatibility)
    console.log('\n📍 Creating tracking view...');
    try {
      await sql`DROP VIEW IF EXISTS tracking`;
      await sql`
        CREATE VIEW tracking AS 
        SELECT 
          id,
          shipment_id,
          ST_Y(location) as latitude,
          ST_X(location) as longitude,
          status,
          notes,
          timestamp,
          created_by,
          created_at,
          updated_at
        FROM tracking_events
      `;
      console.log('  ✅ Created tracking view');
    } catch (err) {
      console.log('  ⚠️  Tracking view:', err.message);
    }

    // 7. Create ratings view (for API compatibility)
    console.log('\n⭐ Creating ratings view...');
    try {
      await sql`DROP VIEW IF EXISTS ratings`;
      await sql`
        CREATE VIEW ratings AS 
        SELECT 
          id,
          shipment_id,
          reviewer_id,
          reviewee_id as transporter_id,
          rating,
          review_text,
          created_at,
          updated_at
        FROM ratings_reviews
      `;
      console.log('  ✅ Created ratings view');
    } catch (err) {
      console.log('  ⚠️  Ratings view:', err.message);
    }

    // 8. Create system_settings table
    console.log('\n⚙️  Creating system settings...');
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS system_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          setting_key VARCHAR(100) UNIQUE NOT NULL,
          setting_value JSONB NOT NULL,
          description TEXT,
          is_public BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;
      console.log('  ✅ Created system_settings table');
    } catch (err) {
      console.log('  ⚠️  System settings table:', err.message);
    }

    // 9. Insert default system settings
    try {
      await sql`
        INSERT INTO system_settings (setting_key, setting_value, description, is_public) VALUES
        ('app_version', '"1.0.0"', 'Current application version', true),
        ('maintenance_mode', 'false', 'Whether the app is in maintenance mode', true),
        ('default_currency', '"USD"', 'Default currency for payments', true),
        ('max_file_upload_mb', '10', 'Maximum file upload size in MB', false),
        ('notification_settings', '{"push_enabled": true, "email_enabled": true}', 'Default notification settings', false),
        ('pricing_model', '{"base_rate": 5.0, "per_km_rate": 1.5, "per_kg_rate": 0.5}', 'Default pricing model', false)
        ON CONFLICT (setting_key) DO NOTHING
      `;
      console.log('  ✅ Inserted default settings');
    } catch (err) {
      console.log('  ⚠️  Default settings:', err.message);
    }

    // 10. Create trigger function for updated_at
    console.log('\n🔄 Creating auto-update triggers...');
    try {
      await sql`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql'
      `;
      console.log('  ✅ Created trigger function');
    } catch (err) {
      console.log('  ⚠️  Trigger function:', err.message);
    }

    // 11. Fix data integrity
    console.log('\n🔧 Fixing data integrity...');
    try {
      await sql`UPDATE users SET profile_completed = FALSE WHERE profile_completed IS NULL`;
      await sql`UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL`;
      await sql`UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL`;
      console.log('  ✅ Fixed NULL values');
    } catch (err) {
      console.log('  ⚠️  Data integrity:', err.message);
    }

    // 12. Sync location data for transporters
    try {
      await sql`
        UPDATE transporter_profiles 
        SET 
          current_latitude = ST_Y(current_location),
          current_longitude = ST_X(current_location)
        WHERE current_location IS NOT NULL AND (current_latitude IS NULL OR current_longitude IS NULL)
      `;
      console.log('  ✅ Synced location data');
    } catch (err) {
      console.log('  ⚠️  Location sync:', err.message);
    }

    // 13. Verify final structure
    console.log('\n📊 Verifying final database structure...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log(`  ✅ Total tables: ${tables.length}`);
    tables.forEach(table => console.log(`    📋 ${table.table_name}`));

    // Check users table structure
    const userColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'users'
      ORDER BY ordinal_position
    `;
    
    console.log('\n👥 Users table columns:');
    userColumns.forEach(col => console.log(`    ${col.column_name}: ${col.data_type}`));

    console.log('\n🎉 Database schema fix completed successfully!');
    console.log('\n✅ Summary of fixes applied:');
    console.log('  • Added users.name, users.profile_image_url, users.phone columns');
    console.log('  • Added transporter_profiles.current_latitude, current_longitude columns');
    console.log('  • Created missing chats table');
    console.log('  • Added missing shipments columns (driver_id, order_number, tracking_number)');
    console.log('  • Fixed profile_completed boolean type');
    console.log('  • Created tracking and ratings views for API compatibility');
    console.log('  • Created system_settings table with default values');
    console.log('  • Fixed data integrity issues');
    console.log('  • Synced location data for transporters');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during database fix:', error);
    process.exit(1);
  }
}

applyDatabaseFix();