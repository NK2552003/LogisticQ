const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function checkAndCreateTables() {
  try {
    console.log('🔍 Checking existing tables and creating missing ones...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // First check what tables currently exist
    console.log('\n📋 Checking existing tables...');
    const existingTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('✅ Existing tables:');
    const existingTableNames = existingTables.map(t => t.table_name);
    existingTableNames.forEach(name => console.log(`  - ${name}`));
    
    // Read and execute the setup SQL file
    const setupSqlPath = path.join(__dirname, '..', 'database', 'setup.sql');
    const setupSql = fs.readFileSync(setupSqlPath, 'utf8');
    
    console.log('\n📝 Running database setup script...');
    
    // Split the SQL into individual statements and execute them
    const statements = setupSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await sql.unsafe(statement);
          // Only log table creation statements
          if (statement.includes('CREATE TABLE')) {
            const tableName = statement.match(/CREATE TABLE[^(]*IF NOT EXISTS\s+(\w+)/i)?.[1];
            console.log(`✅ Created/verified table: ${tableName}`);
          }
        } catch (error) {
          // Log but don't fail for "already exists" errors
          if (error.message.includes('already exists')) {
            const tableName = statement.match(/CREATE TABLE[^(]*IF NOT EXISTS\s+(\w+)/i)?.[1];
            if (tableName) {
              console.log(`ℹ️  Table already exists: ${tableName}`);
            }
          } else if (!error.message.includes('CREATE INDEX')) {
            console.error('❌ Failed to execute:', statement.split('\n')[0].substring(0, 50) + '...');
            console.error('Error:', error.message);
          }
        }
      }
    }
    
    // Now check what tables exist after running the setup
    console.log('\n📋 Final table list:');
    const finalTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    finalTables.forEach(table => console.log(`  ✅ ${table.table_name}`));
    
    // Now create additional tables that might be needed based on the app structure
    console.log('\n🚀 Creating additional LogisticQ specific tables...');
    
    // Create shipments table
    await createShipmentsTable();
    
    // Create tracking events table
    await createTrackingEventsTable();
    
    // Create chat messages table
    await createChatMessagesTable();
    
    // Create ratings and reviews table
    await createRatingsTable();
    
    // Create payments table
    await createPaymentsTable();
    
    // Create notifications table
    await createNotificationsTable();
    
    console.log('\n🎉 Database setup completed successfully!');
    
    // Final verification
    const allTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log(`\n📊 Total tables created: ${allTables.length}`);
    allTables.forEach(table => console.log(`  📋 ${table.table_name}`));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

async function createShipmentsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS shipments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number VARCHAR(50) UNIQUE NOT NULL,
        business_id UUID REFERENCES users(id) ON DELETE CASCADE,
        customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
        transporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
        
        -- Pickup details
        pickup_address TEXT NOT NULL,
        pickup_contact_name VARCHAR(255),
        pickup_contact_phone VARCHAR(20),
        pickup_date TIMESTAMP WITH TIME ZONE,
        pickup_time_window VARCHAR(50),
        pickup_instructions TEXT,
        
        -- Delivery details
        delivery_address TEXT NOT NULL,
        delivery_contact_name VARCHAR(255),
        delivery_contact_phone VARCHAR(20),
        delivery_date TIMESTAMP WITH TIME ZONE,
        delivery_time_window VARCHAR(50),
        delivery_instructions TEXT,
        
        -- Shipment details
        package_description TEXT,
        package_weight DECIMAL(10,2),
        package_dimensions VARCHAR(100),
        package_value DECIMAL(10,2),
        item_count INTEGER DEFAULT 1,
        service_type VARCHAR(50) DEFAULT 'standard', -- standard, express, same_day, premium
        
        -- Status and tracking
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'assigned', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'returned')),
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        tracking_number VARCHAR(100) UNIQUE,
        
        -- Financial
        quoted_price DECIMAL(10,2),
        final_price DECIMAL(10,2),
        payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'cancelled')),
        
        -- Timestamps
        estimated_pickup_time TIMESTAMP WITH TIME ZONE,
        estimated_delivery_time TIMESTAMP WITH TIME ZONE,
        actual_pickup_time TIMESTAMP WITH TIME ZONE,
        actual_delivery_time TIMESTAMP WITH TIME ZONE,
        
        -- Additional info
        special_requirements TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // Create indexes for shipments
    await sql`CREATE INDEX IF NOT EXISTS idx_shipments_business_id ON shipments(business_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_shipments_customer_id ON shipments(customer_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_shipments_transporter_id ON shipments(transporter_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_shipments_order_number ON shipments(order_number);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON shipments(created_at);`;
    
    console.log('✅ Created shipments table with indexes');
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.error('❌ Failed to create shipments table:', error.message);
    } else {
      console.log('ℹ️  Shipments table already exists');
    }
  }
}

async function createTrackingEventsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS tracking_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
        event_type VARCHAR(100) NOT NULL, -- pickup_scheduled, picked_up, in_transit, out_for_delivery, delivered, etc.
        status VARCHAR(50) NOT NULL,
        description TEXT,
        location VARCHAR(255),
        coordinates POINT,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        additional_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment_id ON tracking_events(shipment_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tracking_events_timestamp ON tracking_events(timestamp);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tracking_events_status ON tracking_events(status);`;
    
    console.log('✅ Created tracking_events table with indexes');
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.error('❌ Failed to create tracking_events table:', error.message);
    } else {
      console.log('ℹ️  Tracking events table already exists');
    }
  }
}

async function createChatMessagesTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
        receiver_id UUID REFERENCES users(id) ON DELETE SET NULL,
        message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'location', 'file', 'system')),
        content TEXT NOT NULL,
        metadata JSONB, -- For storing file info, location coordinates, etc.
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_chat_messages_shipment_id ON chat_messages(shipment_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver_id ON chat_messages(receiver_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);`;
    
    console.log('✅ Created chat_messages table with indexes');
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.error('❌ Failed to create chat_messages table:', error.message);
    } else {
      console.log('ℹ️  Chat messages table already exists');
    }
  }
}

async function createRatingsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS ratings_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
        reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
        reviewee_id UUID REFERENCES users(id) ON DELETE CASCADE,
        reviewer_type VARCHAR(50) CHECK (reviewer_type IN ('business', 'customer', 'transporter')),
        reviewee_type VARCHAR(50) CHECK (reviewee_type IN ('business', 'customer', 'transporter')),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT,
        categories JSONB, -- For specific ratings like punctuality, communication, etc.
        is_anonymous BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_ratings_shipment_id ON ratings_reviews(shipment_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ratings_reviewer_id ON ratings_reviews(reviewer_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ratings_reviewee_id ON ratings_reviews(reviewee_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ratings_rating ON ratings_reviews(rating);`;
    
    console.log('✅ Created ratings_reviews table with indexes');
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.error('❌ Failed to create ratings_reviews table:', error.message);
    } else {
      console.log('ℹ️  Ratings reviews table already exists');
    }
  }
}

async function createPaymentsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
        payer_id UUID REFERENCES users(id) ON DELETE CASCADE,
        payee_id UUID REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        payment_type VARCHAR(50) CHECK (payment_type IN ('shipment_cost', 'penalty', 'refund', 'bonus', 'commission')),
        payment_method VARCHAR(50), -- card, wallet, bank_transfer, cash, etc.
        payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
        payment_gateway VARCHAR(50), -- stripe, razorpay, etc.
        gateway_transaction_id VARCHAR(255),
        gateway_response JSONB,
        failure_reason TEXT,
        processed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_shipment_id ON payments(shipment_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_payer_id ON payments(payer_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_payee_id ON payments(payee_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);`;
    
    console.log('✅ Created payments table with indexes');
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.error('❌ Failed to create payments table:', error.message);
    } else {
      console.log('ℹ️  Payments table already exists');
    }
  }
}

async function createNotificationsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
        type VARCHAR(100) NOT NULL, -- shipment_update, payment_received, new_message, etc.
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSONB, -- Additional data for the notification
        is_read BOOLEAN DEFAULT FALSE,
        is_sent BOOLEAN DEFAULT FALSE, -- For push notifications
        priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        channels TEXT[], -- email, push, sms
        scheduled_for TIMESTAMP WITH TIME ZONE,
        sent_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_shipment_id ON notifications(shipment_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);`;
    
    console.log('✅ Created notifications table with indexes');
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.error('❌ Failed to create notifications table:', error.message);
    } else {
      console.log('ℹ️  Notifications table already exists');
    }
  }
}

checkAndCreateTables();