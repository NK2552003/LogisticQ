const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function fixTrackingEventsTable() {
    console.log('🔧 Fixing tracking_events table to add missing latitude and longitude fields...');
    
    try {
        // Add latitude and longitude columns if they don't exist
        await sql`
            ALTER TABLE tracking_events 
            ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
            ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8)
        `;
        
        console.log('✅ Added latitude and longitude columns to tracking_events table');
        
        // Create missing indexes that had syntax issues
        const indexQueries = [
            'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
            'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)', 
            'CREATE INDEX IF NOT EXISTS idx_users_name ON users(name)',
            'CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_transporter_profiles_user_id ON transporter_profiles(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON customer_profiles(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_admin_profiles_user_id ON admin_profiles(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_transporter_lat_lng ON transporter_profiles(current_latitude, current_longitude)',
            'CREATE INDEX IF NOT EXISTS idx_transporter_available ON transporter_profiles(is_available)',
            'CREATE INDEX IF NOT EXISTS idx_transporter_verified ON transporter_profiles(is_verified)',
            'CREATE INDEX IF NOT EXISTS idx_shipments_business_id ON shipments(business_id)',
            'CREATE INDEX IF NOT EXISTS idx_shipments_customer_id ON shipments(customer_id)',
            'CREATE INDEX IF NOT EXISTS idx_shipments_transporter_id ON shipments(transporter_id)',
            'CREATE INDEX IF NOT EXISTS idx_shipments_driver_id ON shipments(driver_id)',
            'CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status)',
            'CREATE INDEX IF NOT EXISTS idx_shipments_payment_status ON shipments(payment_status)',
            'CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON shipments(created_at)',
            'CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment_id ON tracking_events(shipment_id)',
            'CREATE INDEX IF NOT EXISTS idx_tracking_events_timestamp ON tracking_events(timestamp)',
            'CREATE INDEX IF NOT EXISTS idx_tracking_events_status ON tracking_events(status)',
            'CREATE INDEX IF NOT EXISTS idx_payments_shipment_id ON payments(shipment_id)',
            'CREATE INDEX IF NOT EXISTS idx_payments_payer_id ON payments(payer_id)',
            'CREATE INDEX IF NOT EXISTS idx_payments_payee_id ON payments(payee_id)',
            'CREATE INDEX IF NOT EXISTS idx_payments_transporter_id ON payments(transporter_id)',
            'CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)',
            'CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id)',
            'CREATE INDEX IF NOT EXISTS idx_chats_customer_id ON chats(customer_id)',
            'CREATE INDEX IF NOT EXISTS idx_chats_transporter_id ON chats(transporter_id)',
            'CREATE INDEX IF NOT EXISTS idx_chats_shipment_id ON chats(shipment_id)',
            'CREATE INDEX IF NOT EXISTS idx_chats_status ON chats(status)',
            'CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id)',
            'CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id)',
            'CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at)'
        ];

        console.log('📊 Creating missing indexes...');
        let successCount = 0;
        let skipCount = 0;

        for (const indexQuery of indexQueries) {
            try {
                await sql`${sql(indexQuery)}`;
                successCount++;
            } catch (error) {
                if (error.message.includes('already exists')) {
                    skipCount++;
                } else {
                    console.warn(`⚠️  Index creation warning: ${error.message.substring(0, 100)}`);
                }
            }
        }

        console.log(`✅ Indexes processed: ${successCount} created, ${skipCount} already existed`);

        // Drop the old ratings_reviews table and rename ratings if needed
        try {
            await sql`DROP TABLE IF EXISTS ratings_reviews CASCADE`;
            console.log('✅ Dropped old ratings_reviews table');
        } catch (error) {
            console.log('⚠️  ratings_reviews table not found (already cleaned up)');
        }

        // Create the ratings table if it doesn't exist (with correct API field names)
        await sql`
            CREATE TABLE IF NOT EXISTS ratings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
                reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
                transporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                review_text TEXT,
                review_type VARCHAR(50) CHECK (review_type IN ('service', 'communication', 'timeliness', 'overall')),
                is_public BOOLEAN DEFAULT TRUE,
                response_text TEXT,
                response_date TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        console.log('✅ Ensured ratings table exists with correct schema');

        // Create rating indexes
        const ratingIndexes = [
            'CREATE INDEX IF NOT EXISTS idx_ratings_shipment_id ON ratings(shipment_id)',
            'CREATE INDEX IF NOT EXISTS idx_ratings_reviewer_id ON ratings(reviewer_id)', 
            'CREATE INDEX IF NOT EXISTS idx_ratings_transporter_id ON ratings(transporter_id)',
            'CREATE INDEX IF NOT EXISTS idx_ratings_rating ON ratings(rating)'
        ];

        for (const indexQuery of ratingIndexes) {
            try {
                await sql`${sql(indexQuery)}`;
            } catch (error) {
                if (!error.message.includes('already exists')) {
                    console.warn(`⚠️  Rating index warning: ${error.message}`);
                }
            }
        }

        // Verify the fixes
        console.log('🔍 Verifying fixes...');

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
            console.log('✅ Tracking events table: All required fields now present');
        } else {
            console.log(`❌ Tracking events table: Still missing fields: ${missingTrackingFields.join(', ')}`);
        }

        // Check if ratings table exists
        const ratingsTable = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'ratings' AND table_schema = 'public'
        `;

        if (ratingsTable.length > 0) {
            console.log('✅ Ratings table: Exists with correct name');
        } else {
            console.log('❌ Ratings table: Still missing');
        }

        console.log('🎉 Database fixes completed successfully!');

    } catch (error) {
        console.error('❌ Error fixing database:', error.message);
        throw error;
    }
}

// Run the fix
if (require.main === module) {
    fixTrackingEventsTable()
        .then(() => {
            console.log('✅ All fixes applied successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Fix process failed:', error);
            process.exit(1);
        });
}

module.exports = { fixTrackingEventsTable };