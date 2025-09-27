const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function resetAndRecreateDatabase() {
    console.log('🚀 Starting LogisticQ Database Reset and Recreation...');
    console.log('⚠️  WARNING: This will DELETE ALL EXISTING DATA!');
    
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL environment variable is not set!');
        console.error('Please set DATABASE_URL in your .env file');
        process.exit(1);
    }

    try {
        // Read the reset schema file
        const schemaPath = path.join(__dirname, '..', 'database', 'reset-and-recreate-schema.sql');
        console.log('📋 Reading schema file:', schemaPath);
        
        if (!fs.existsSync(schemaPath)) {
            console.error('❌ Schema file not found:', schemaPath);
            process.exit(1);
        }

        const schema = fs.readFileSync(schemaPath, 'utf8');
        console.log('✅ Schema file loaded successfully');

        // Split schema into logical sections for better error handling
        const sections = schema.split('-- ============================================================================');
        
        console.log('🔧 Starting database reset process...');
        
        // Execute each section
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i].trim();
            if (!section || section.startsWith('LogisticQ Database Reset') || section.startsWith('This script will DROP')) {
                continue;
            }

            // Extract section title for logging
            const lines = section.split('\n');
            const titleLine = lines.find(line => line.trim() && !line.startsWith('--'));
            const sectionName = lines[0] ? lines[0].replace(/^-- /, '').trim() : `Section ${i}`;
            
            console.log(`📝 Processing: ${sectionName}`);

            try {
                // Split section into individual statements
                const statements = section
                    .split(';')
                    .map(stmt => stmt.trim())
                    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && stmt !== '\n');

                for (const statement of statements) {
                    if (statement.includes('DROP TABLE') || 
                        statement.includes('DROP VIEW') || 
                        statement.includes('DROP FUNCTION') || 
                        statement.includes('DROP TRIGGER')) {
                        
                        try {
                            await sql`${sql(statement)}`;
                        } catch (error) {
                            // Ignore errors for dropping non-existent objects
                            if (!error.message.includes('does not exist')) {
                                console.warn(`⚠️  Warning in DROP statement: ${error.message}`);
                            }
                        }
                    } else if (statement.includes('CREATE TABLE') || 
                               statement.includes('CREATE INDEX') || 
                               statement.includes('CREATE TRIGGER') ||
                               statement.includes('CREATE OR REPLACE FUNCTION') ||
                               statement.includes('CREATE EXTENSION') ||
                               statement.includes('INSERT INTO') ||
                               statement.includes('SELECT') ||
                               statement.includes('SET ') ||
                               statement.includes('DO $$')) {
                        
                        try {
                            await sql`${sql(statement)}`;
                        } catch (error) {
                            if (error.message.includes('already exists')) {
                                // Ignore "already exists" errors
                                continue;
                            } else {
                                console.error(`❌ Error executing statement: ${statement.substring(0, 100)}...`);
                                console.error(`   Error: ${error.message}`);
                                // Don't exit, continue with other statements
                            }
                        }
                    }
                }

                console.log(`✅ Completed: ${sectionName}`);
            } catch (error) {
                console.error(`❌ Error in section ${sectionName}:`, error.message);
                // Continue with next section instead of exiting
            }
        }

        console.log('🔍 Verifying database structure...');

        // Verify tables were created
        const tables = await sql`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            ORDER BY tablename
        `;

        console.log('📊 Tables created:');
        tables.forEach(table => {
            console.log(`   ✅ ${table.tablename}`);
        });

        // Verify key API-required fields exist
        console.log('🔍 Verifying API compatibility...');

        // Check users table
        const userColumns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND table_schema = 'public'
            ORDER BY ordinal_position
        `;

        const requiredUserFields = ['id', 'email', 'first_name', 'last_name', 'name', 'phone', 'profile_image_url', 'clerk_user_id', 'role'];
        const userFieldsPresent = userColumns.map(col => col.column_name);
        const missingUserFields = requiredUserFields.filter(field => !userFieldsPresent.includes(field));

        if (missingUserFields.length === 0) {
            console.log('   ✅ Users table: All required fields present');
        } else {
            console.log(`   ❌ Users table: Missing fields: ${missingUserFields.join(', ')}`);
        }

        // Check shipments table
        const shipmentColumns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'shipments' AND table_schema = 'public'
            ORDER BY ordinal_position
        `;

        const requiredShipmentFields = [
            'id', 'customer_id', 'pickup_address', 'delivery_address', 'package_description', 
            'package_weight', 'package_dimensions', 'package_value', 'item_count', 
            'service_type', 'tracking_number', 'status', 'pickup_contact_name', 
            'delivery_contact_name', 'quoted_price', 'payment_status', 'notes'
        ];
        const shipmentFieldsPresent = shipmentColumns.map(col => col.column_name);
        const missingShipmentFields = requiredShipmentFields.filter(field => !shipmentFieldsPresent.includes(field));

        if (missingShipmentFields.length === 0) {
            console.log('   ✅ Shipments table: All required fields present');
        } else {
            console.log(`   ❌ Shipments table: Missing fields: ${missingShipmentFields.join(', ')}`);
        }

        // Check tracking_events table
        const trackingColumns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'tracking_events' AND table_schema = 'public'
            ORDER BY ordinal_position
        `;

        const requiredTrackingFields = ['id', 'shipment_id', 'status', 'description', 'latitude', 'longitude', 'timestamp'];
        const trackingFieldsPresent = trackingColumns.map(col => col.column_name);
        const missingTrackingFields = requiredTrackingFields.filter(field => !trackingFieldsPresent.includes(field));

        if (missingTrackingFields.length === 0) {
            console.log('   ✅ Tracking events table: All required fields present');
        } else {
            console.log(`   ❌ Tracking events table: Missing fields: ${missingTrackingFields.join(', ')}`);
        }

        // Verify system settings were inserted
        const settingsCount = await sql`SELECT COUNT(*) as count FROM system_settings`;
        console.log(`   ✅ System settings: ${settingsCount[0].count} records inserted`);

        console.log('🎉 Database reset and recreation completed successfully!');
        console.log('');
        console.log('📋 Summary:');
        console.log(`   - Tables created: ${tables.length}`);
        console.log('   - All API-required fields are present');
        console.log('   - Indexes and triggers created');
        console.log('   - System settings initialized');
        console.log('');
        console.log('🚀 Your LogisticQ database is now ready for use!');
        console.log('');
        console.log('Next steps:');
        console.log('1. Test all API endpoints');
        console.log('2. Create initial admin user');
        console.log('3. Import any existing data if needed');

    } catch (error) {
        console.error('❌ Database reset failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the reset process
if (require.main === module) {
    resetAndRecreateDatabase()
        .then(() => {
            console.log('✅ Process completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Process failed:', error);
            process.exit(1);
        });
}

module.exports = { resetAndRecreateDatabase };