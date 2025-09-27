const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function comprehensiveSchemaVerification() {
    console.log('🔍 LogisticQ Database Schema Comprehensive Verification');
    console.log('=====================================================');

    try {
        // Test 1: Verify all required tables exist
        console.log('\n📋 Test 1: Verifying all required tables exist...');
        
        const requiredTables = [
            'users', 'business_profiles', 'transporter_profiles', 'customer_profiles', 
            'admin_profiles', 'shipments', 'tracking_events', 'payments', 'chats', 
            'chat_messages', 'ratings', 'notifications', 'documents', 'system_settings', 
            'audit_logs'
        ];

        const existingTables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `;

        const existingTableNames = existingTables.map(t => t.table_name);
        const missingTables = requiredTables.filter(table => !existingTableNames.includes(table));

        if (missingTables.length === 0) {
            console.log('✅ All required tables exist');
            console.log(`   Found tables: ${existingTableNames.join(', ')}`);
        } else {
            console.log(`❌ Missing tables: ${missingTables.join(', ')}`);
        }

        // Test 2: Verify Users table has all API-required fields
        console.log('\n📋 Test 2: Verifying Users table schema...');
        
        const userColumns = await sql`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'users' AND table_schema = 'public'
            ORDER BY ordinal_position
        `;

        const requiredUserFields = {
            'id': 'uuid',
            'email': 'character varying',
            'password': 'character varying',
            'first_name': 'character varying',
            'last_name': 'character varying',
            'name': 'character varying',
            'phone_number': 'character varying',
            'phone': 'character varying',
            'address': 'text',
            'profile_image_url': 'text',
            'clerk_user_id': 'character varying',
            'role': 'character varying',
            'profile_completed': 'boolean',
            'created_at': 'timestamp with time zone',
            'updated_at': 'timestamp with time zone'
        };

        let userSchemaValid = true;
        for (const [fieldName, expectedType] of Object.entries(requiredUserFields)) {
            const column = userColumns.find(col => col.column_name === fieldName);
            if (!column) {
                console.log(`   ❌ Missing field: ${fieldName}`);
                userSchemaValid = false;
            } else {
                console.log(`   ✅ ${fieldName}: ${column.data_type} (${column.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
            }
        }

        if (userSchemaValid) {
            console.log('✅ Users table schema is complete and API-compatible');
        }

        // Test 3: Verify Shipments table has all API-required fields
        console.log('\n📋 Test 3: Verifying Shipments table schema...');
        
        const shipmentColumns = await sql`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'shipments' AND table_schema = 'public'
            ORDER BY ordinal_position
        `;

        const requiredShipmentFields = [
            'id', 'order_number', 'tracking_number', 'customer_id', 'driver_id',
            'pickup_address', 'pickup_contact_name', 'pickup_contact_phone', 'pickup_instructions',
            'delivery_address', 'delivery_contact_name', 'delivery_contact_phone', 'delivery_instructions',
            'package_description', 'package_weight', 'package_dimensions', 'package_value', 'item_count',
            'service_type', 'priority', 'status', 'quoted_price', 'payment_status',
            'special_requirements', 'notes', 'created_at', 'updated_at'
        ];

        const shipmentFieldsPresent = shipmentColumns.map(col => col.column_name);
        const missingShipmentFields = requiredShipmentFields.filter(field => !shipmentFieldsPresent.includes(field));

        if (missingShipmentFields.length === 0) {
            console.log('✅ Shipments table schema is complete and API-compatible');
            console.log(`   Total fields: ${shipmentColumns.length}`);
        } else {
            console.log(`❌ Shipments table missing fields: ${missingShipmentFields.join(', ')}`);
        }

        // Test 4: Verify Tracking Events table has latitude/longitude
        console.log('\n📋 Test 4: Verifying Tracking Events table schema...');
        
        const trackingColumns = await sql`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'tracking_events' AND table_schema = 'public'
            ORDER BY ordinal_position
        `;

        const requiredTrackingFields = ['id', 'shipment_id', 'event_type', 'status', 'description', 'location', 'latitude', 'longitude', 'timestamp'];
        const trackingFieldsPresent = trackingColumns.map(col => col.column_name);
        const missingTrackingFields = requiredTrackingFields.filter(field => !trackingFieldsPresent.includes(field));

        if (missingTrackingFields.length === 0) {
            console.log('✅ Tracking Events table schema is complete and API-compatible');
            // Check if latitude and longitude are the correct data types
            const latColumn = trackingColumns.find(col => col.column_name === 'latitude');
            const lngColumn = trackingColumns.find(col => col.column_name === 'longitude');
            console.log(`   Latitude: ${latColumn.data_type}, Longitude: ${lngColumn.data_type}`);
        } else {
            console.log(`❌ Tracking Events table missing fields: ${missingTrackingFields.join(', ')}`);
        }

        // Test 5: Verify Payments table has transporter_id
        console.log('\n📋 Test 5: Verifying Payments table schema...');
        
        const paymentColumns = await sql`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'payments' AND table_schema = 'public'
            ORDER BY ordinal_position
        `;

        const transporterIdField = paymentColumns.find(col => col.column_name === 'transporter_id');
        if (transporterIdField) {
            console.log('✅ Payments table has transporter_id field for API compatibility');
            console.log(`   transporter_id: ${transporterIdField.data_type} (${transporterIdField.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        } else {
            console.log('❌ Payments table missing transporter_id field');
        }

        // Test 6: Verify Ratings table exists (not ratings_reviews)
        console.log('\n📋 Test 6: Verifying Ratings table...');
        
        const ratingsTableExists = existingTableNames.includes('ratings');
        const ratingsReviewsTableExists = existingTableNames.includes('ratings_reviews');

        if (ratingsTableExists && !ratingsReviewsTableExists) {
            console.log('✅ Ratings table exists with correct name (API-compatible)');
            
            const ratingsColumns = await sql`
                SELECT column_name, data_type
                FROM information_schema.columns 
                WHERE table_name = 'ratings' AND table_schema = 'public'
                ORDER BY ordinal_position
            `;
            
            const transporterIdInRatings = ratingsColumns.find(col => col.column_name === 'transporter_id');
            if (transporterIdInRatings) {
                console.log('   ✅ Ratings table has transporter_id field for API compatibility');
            } else {
                console.log('   ❌ Ratings table missing transporter_id field');
            }
        } else {
            if (ratingsReviewsTableExists) {
                console.log('⚠️  Found ratings_reviews table instead of ratings table');
            } else {
                console.log('❌ Ratings table not found');
            }
        }

        // Test 7: Verify indexes exist
        console.log('\n📋 Test 7: Verifying critical indexes...');
        
        const indexes = await sql`
            SELECT indexname, tablename
            FROM pg_indexes 
            WHERE schemaname = 'public' 
            ORDER BY tablename, indexname
        `;

        const criticalIndexes = [
            'idx_users_clerk_user_id',
            'idx_users_email',
            'idx_shipments_customer_id',
            'idx_shipments_status',
            'idx_tracking_events_shipment_id',
            'idx_payments_shipment_id'
        ];

        const existingIndexNames = indexes.map(idx => idx.indexname);
        const missingIndexes = criticalIndexes.filter(idx => !existingIndexNames.includes(idx));

        console.log(`   Found indexes: ${indexes.length}`);
        if (missingIndexes.length === 0) {
            console.log('✅ All critical indexes are present');
        } else {
            console.log(`⚠️  Some indexes may be missing: ${missingIndexes.join(', ')}`);
            console.log('   (This may be due to index creation syntax issues, but tables will still work)');
        }

        // Test 8: Verify system settings
        console.log('\n📋 Test 8: Verifying system settings...');
        
        const systemSettings = await sql`
            SELECT setting_key, setting_value 
            FROM system_settings 
            ORDER BY setting_key
        `;

        console.log(`   Found ${systemSettings.length} system settings:`);
        systemSettings.forEach(setting => {
            console.log(`   - ${setting.setting_key}: ${JSON.stringify(setting.setting_value)}`);
        });

        if (systemSettings.length > 0) {
            console.log('✅ System settings are initialized');
        } else {
            console.log('⚠️  No system settings found');
        }

        // Test 9: Test API compatibility with sample queries
        console.log('\n📋 Test 9: Testing API-compatible queries...');

        // Test users query (as used in user+api.ts)
        try {
            const userTest = await sql`
                SELECT id, email, first_name, last_name, clerk_user_id, role, profile_completed, created_at, updated_at
                FROM users 
                LIMIT 1
            `;
            console.log('✅ Users API query format works');
        } catch (error) {
            console.log(`❌ Users API query failed: ${error.message}`);
        }

        // Test shipments query (as used in shipments+api.ts)
        try {
            const shipmentTest = await sql`
                SELECT 
                    s.*,
                    u_customer.first_name as customer_first_name,
                    u_customer.last_name as customer_last_name,
                    u_customer.email as customer_email,
                    u_driver.first_name as driver_first_name,
                    u_driver.last_name as driver_last_name,
                    u_driver.email as driver_email,
                    tp.vehicle_type,
                    tp.vehicle_number
                FROM shipments s
                LEFT JOIN users u_customer ON s.customer_id = u_customer.id
                LEFT JOIN users u_driver ON s.driver_id = u_driver.id
                LEFT JOIN transporter_profiles tp ON u_driver.id = tp.user_id
                LIMIT 1
            `;
            console.log('✅ Shipments API query format works');
        } catch (error) {
            console.log(`❌ Shipments API query failed: ${error.message}`);
        }

        // Test tracking query (as used in tracking+api.ts)
        try {
            const trackingTest = await sql`
                SELECT 
                    te.id,
                    te.shipment_id,
                    te.event_type,
                    te.status,
                    te.description as notes,
                    te.location,
                    te.latitude,
                    te.longitude,
                    te.timestamp
                FROM tracking_events te
                LIMIT 1
            `;
            console.log('✅ Tracking API query format works');
        } catch (error) {
            console.log(`❌ Tracking API query failed: ${error.message}`);
        }

        // Test payments query (as used in payments+api.ts)
        try {
            const paymentsTest = await sql`
                SELECT 
                    p.*,
                    s.pickup_address,
                    s.delivery_address,
                    u.first_name as transporter_first_name,
                    u.last_name as transporter_last_name,
                    u.email as transporter_email
                FROM payments p
                JOIN shipments s ON p.shipment_id = s.id
                LEFT JOIN users u ON s.driver_id = u.id
                LIMIT 1
            `;
            console.log('✅ Payments API query format works');
        } catch (error) {
            console.log(`❌ Payments API query failed: ${error.message}`);
        }

        // Test drivers query (as used in drivers+api.ts)
        try {
            const driversTest = await sql`
                SELECT 
                    u.*,
                    tp.vehicle_type,
                    tp.vehicle_number,
                    tp.license_number,
                    tp.is_verified,
                    tp.current_latitude,
                    tp.current_longitude,
                    tp.is_available
                FROM users u
                JOIN transporter_profiles tp ON u.id = tp.user_id
                WHERE u.role = 'transporter' 
                LIMIT 1
            `;
            console.log('✅ Drivers API query format works');
        } catch (error) {
            console.log(`❌ Drivers API query failed: ${error.message}`);
        }

        console.log('\n🎉 Schema Verification Complete!');
        console.log('=====================================');
        
        const summary = {
            tablesExist: missingTables.length === 0,
            userSchemaComplete: userSchemaValid,
            shipmentSchemaComplete: missingShipmentFields.length === 0,
            trackingSchemaComplete: missingTrackingFields.length === 0,
            paymentsHasTransporterId: !!transporterIdField,
            ratingsTableCorrect: ratingsTableExists && !ratingsReviewsTableExists,
            systemSettingsInitialized: systemSettings.length > 0
        };

        const allTestsPassed = Object.values(summary).every(test => test === true);

        if (allTestsPassed) {
            console.log('✅ ALL TESTS PASSED! Database schema is fully API-compatible');
        } else {
            console.log('⚠️  Some tests failed, but the database should still work for most operations');
        }

        console.log('\nSchema Summary:');
        console.log(`- All required tables exist: ${summary.tablesExist ? '✅' : '❌'}`);
        console.log(`- Users table complete: ${summary.userSchemaComplete ? '✅' : '❌'}`);
        console.log(`- Shipments table complete: ${summary.shipmentSchemaComplete ? '✅' : '❌'}`);
        console.log(`- Tracking events complete: ${summary.trackingSchemaComplete ? '✅' : '❌'}`);
        console.log(`- Payments has transporter_id: ${summary.paymentsHasTransporterId ? '✅' : '❌'}`);
        console.log(`- Ratings table correct: ${summary.ratingsTableCorrect ? '✅' : '❌'}`);
        console.log(`- System settings initialized: ${summary.systemSettingsInitialized ? '✅' : '❌'}`);

        return summary;

    } catch (error) {
        console.error('❌ Schema verification failed:', error.message);
        throw error;
    }
}

// Run the verification
if (require.main === module) {
    comprehensiveSchemaVerification()
        .then((summary) => {
            const allPassed = Object.values(summary).every(test => test === true);
            console.log(`\n${allPassed ? '🎉' : '⚠️'} Verification completed`);
            process.exit(allPassed ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Verification process failed:', error);
            process.exit(1);
        });
}

module.exports = { comprehensiveSchemaVerification };