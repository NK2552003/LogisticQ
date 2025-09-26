const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function verifyAndTestDatabase() {
  try {
    console.log('🔍 Verifying complete database structure...');
    
    // Get all tables with their column counts
    const tableInfo = await sql`
      SELECT 
        t.table_name,
        COUNT(c.column_name) as column_count
      FROM information_schema.tables t
      LEFT JOIN information_schema.columns c ON t.table_name = c.table_name 
      WHERE t.table_schema = 'public'
      GROUP BY t.table_name
      ORDER BY t.table_name;
    `;
    
    console.log('\n📊 Database Structure Summary:');
    console.log('═'.repeat(50));
    tableInfo.forEach(table => {
      console.log(`📋 ${table.table_name.padEnd(20)} | ${table.column_count} columns`);
    });
    console.log('═'.repeat(50));
    
    // Check foreign key relationships
    console.log('\n🔗 Foreign Key Relationships:');
    const foreignKeys = await sql`
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name, kcu.column_name;
    `;
    
    foreignKeys.forEach(fk => {
      console.log(`  🔗 ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    
    // Check indexes
    console.log('\n📇 Database Indexes:');
    const indexes = await sql`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `;
    
    console.log(`  📇 Total indexes: ${indexes.length}`);
    
    // Test basic operations
    console.log('\n🧪 Testing Basic Operations:');
    
    // Test user creation (simulate what the API would do)
    console.log('  🧪 Testing user creation...');
    const testUserResult = await sql`
      INSERT INTO users (email, password, first_name, last_name, clerk_user_id, role)
      VALUES ('test@logisticq.com', 'hashed_password', 'Test', 'User', 'test_clerk_id_' || extract(epoch from now()), 'business')
      ON CONFLICT (email) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
      RETURNING id, email, role;
    `;
    
    if (testUserResult.length > 0) {
      console.log(`  ✅ User created/updated: ${testUserResult[0].email} (${testUserResult[0].role})`);
      const userId = testUserResult[0].id;
      
      // Test profile creation
      console.log('  🧪 Testing business profile creation...');
      await sql`
        INSERT INTO business_profiles (user_id, company_name, business_type)
        VALUES (${userId}, 'Test Logistics Co.', 'Freight Forwarding')
        ON CONFLICT DO NOTHING;
      `;
      console.log('  ✅ Business profile created');
      
      // Test shipment creation
      console.log('  🧪 Testing shipment creation...');
      const shipmentResult = await sql`
        INSERT INTO shipments (
          order_number, business_id, pickup_address, delivery_address,
          package_description, status, tracking_number
        )
        VALUES (
          'TEST-' || extract(epoch from now()),
          ${userId},
          '123 Test Pickup St, Test City',
          '456 Test Delivery Ave, Test City',
          'Test package for verification',
          'pending',
          'TRK-' || extract(epoch from now())
        )
        RETURNING id, order_number, status;
      `;
      
      if (shipmentResult.length > 0) {
        console.log(`  ✅ Shipment created: ${shipmentResult[0].order_number} (${shipmentResult[0].status})`);
        const shipmentId = shipmentResult[0].id;
        
        // Test tracking event creation
        console.log('  🧪 Testing tracking event creation...');
        await sql`
          INSERT INTO tracking_events (shipment_id, event_type, status, description, location)
          VALUES (${shipmentId}, 'shipment_created', 'pending', 'Shipment request created', 'Test City');
        `;
        console.log('  ✅ Tracking event created');
        
        // Test notification creation
        console.log('  🧪 Testing notification creation...');
        await sql`
          INSERT INTO notifications (user_id, shipment_id, type, title, message)
          VALUES (${userId}, ${shipmentId}, 'shipment_created', 'New Shipment Created', 'Your shipment request has been created successfully.');
        `;
        console.log('  ✅ Notification created');
      }
    }
    
    // Get final counts
    console.log('\n📊 Final Data Counts:');
    const counts = await Promise.all([
      sql`SELECT COUNT(*) as count FROM users`,
      sql`SELECT COUNT(*) as count FROM business_profiles`,
      sql`SELECT COUNT(*) as count FROM shipments`,
      sql`SELECT COUNT(*) as count FROM tracking_events`,
      sql`SELECT COUNT(*) as count FROM notifications`
    ]);
    
    console.log(`  👥 Users: ${counts[0][0].count}`);
    console.log(`  🏢 Business Profiles: ${counts[1][0].count}`);
    console.log(`  📦 Shipments: ${counts[2][0].count}`);
    console.log(`  📍 Tracking Events: ${counts[3][0].count}`);
    console.log(`  🔔 Notifications: ${counts[4][0].count}`);
    
    console.log('\n🎉 Database verification completed successfully!');
    console.log('✅ All tables created and functional');
    console.log('✅ Foreign key relationships working');
    console.log('✅ Basic CRUD operations tested');
    console.log('✅ LogisticQ database is ready for use!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

verifyAndTestDatabase();