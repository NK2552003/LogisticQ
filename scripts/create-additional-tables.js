const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function createAdditionalTables() {
  try {
    console.log('🏗️  Creating additional useful tables...');
    
    // Create documents table for file uploads
    await sql`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
        document_type VARCHAR(100) NOT NULL, -- license, verification, shipment_photo, signature, etc.
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        file_url TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
        verified_at TIMESTAMP WITH TIME ZONE,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ Created documents table');

    // Create service_areas table for managing transporter service coverage
    await sql`
      CREATE TABLE IF NOT EXISTS service_areas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        transporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
        area_name VARCHAR(255) NOT NULL,
        area_type VARCHAR(50) CHECK (area_type IN ('city', 'state', 'zipcode', 'radius')),
        coordinates POINT, -- Center point for radius-based areas
        radius_km DECIMAL(10,2), -- For radius-based service areas
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ Created service_areas table');

    // Create pricing_rules table for dynamic pricing
    await sql`
      CREATE TABLE IF NOT EXISTS pricing_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rule_name VARCHAR(255) NOT NULL,
        rule_type VARCHAR(50) CHECK (rule_type IN ('distance', 'weight', 'service_type', 'priority', 'time_based')),
        base_rate DECIMAL(10,2),
        rate_per_unit DECIMAL(10,2), -- per km, per kg, etc.
        minimum_charge DECIMAL(10,2),
        maximum_charge DECIMAL(10,2),
        conditions JSONB, -- Complex conditions in JSON format
        is_active BOOLEAN DEFAULT TRUE,
        effective_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        effective_until TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ Created pricing_rules table');

    // Create audit_logs table for tracking important actions
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL, -- login, create_shipment, update_status, etc.
        resource_type VARCHAR(50), -- shipment, user, payment, etc.
        resource_id UUID,
        old_values JSONB,
        new_values JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ Created audit_logs table');

    // Create indexes for all new tables
    console.log('📝 Creating indexes for additional tables...');
    
    // Documents indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_documents_shipment_id ON documents(shipment_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_documents_verified ON documents(is_verified);`;
    
    // Service areas indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_service_areas_transporter_id ON service_areas(transporter_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_service_areas_active ON service_areas(is_active);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_service_areas_coordinates ON service_areas USING GIST(coordinates);`;
    
    // Pricing rules indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_pricing_rules_type ON pricing_rules(rule_type);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON pricing_rules(is_active);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pricing_rules_effective ON pricing_rules(effective_from, effective_until);`;
    
    // Audit logs indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);`;
    
    console.log('✅ Created all additional indexes');

    // Final verification
    console.log('\n📋 Complete database structure:');
    const allTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log(`\n📊 Total tables: ${allTables.length}`);
    allTables.forEach(table => console.log(`  ✅ ${table.table_name}`));

    // Show table purposes
    console.log('\n📋 Table purposes:');
    console.log('  👥 users - Core user authentication and basic info');
    console.log('  🏢 business_profiles - Business user extended info');
    console.log('  🚛 transporter_profiles - Transporter/driver extended info');
    console.log('  👤 customer_profiles - Customer extended info');
    console.log('  🔑 admin_profiles - Admin user extended info');
    console.log('  📦 shipments - Core shipment/order data');
    console.log('  📍 tracking_events - Shipment tracking history');
    console.log('  💬 chat_messages - In-app messaging');
    console.log('  ⭐ ratings_reviews - User ratings and reviews');
    console.log('  💳 payments - Payment transactions');
    console.log('  🔔 notifications - Push notifications and alerts');
    console.log('  📄 documents - File uploads and verification');
    console.log('  🗺️  service_areas - Transporter service coverage');
    console.log('  💰 pricing_rules - Dynamic pricing configuration');
    console.log('  📋 audit_logs - System activity tracking');

    console.log('\n🎉 Complete LogisticQ database setup finished!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create additional tables:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

createAdditionalTables();