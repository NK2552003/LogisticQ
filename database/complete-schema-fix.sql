-- LogisticQ Complete Database Schema Fix
-- This script will fix all database inconsistencies and create missing tables/columns

-- ============================================================================
-- 1. Fix Users Table - Add missing columns referenced in APIs
-- ============================================================================

-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Update existing users to populate name field from first_name + last_name
UPDATE users 
SET name = CONCAT(first_name, ' ', last_name)
WHERE name IS NULL AND (first_name IS NOT NULL OR last_name IS NOT NULL);

-- Create index for name column
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);

-- ============================================================================
-- 2. Fix Transporter Profiles - Add current_latitude/longitude columns
-- ============================================================================

-- Add separate latitude/longitude columns for easier API queries
ALTER TABLE transporter_profiles 
ADD COLUMN IF NOT EXISTS current_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS current_longitude DECIMAL(11, 8);

-- Create indexes for location queries
CREATE INDEX IF NOT EXISTS idx_transporter_lat_lng ON transporter_profiles(current_latitude, current_longitude);

-- ============================================================================
-- 3. Create Missing Tables
-- ============================================================================

-- Create chats table (referenced in chat API but missing)
CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for chats table
CREATE INDEX IF NOT EXISTS idx_chats_customer_id ON chats(customer_id);
CREATE INDEX IF NOT EXISTS idx_chats_transporter_id ON chats(transporter_id);
CREATE INDEX IF NOT EXISTS idx_chats_shipment_id ON chats(shipment_id);
CREATE INDEX IF NOT EXISTS idx_chats_status ON chats(status);

-- Create tracking table (alias for tracking_events to match API references)
CREATE OR REPLACE VIEW tracking AS 
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
FROM tracking_events;

-- Create ratings table (alias for ratings_reviews to match API references)
CREATE OR REPLACE VIEW ratings AS 
SELECT 
    id,
    shipment_id,
    reviewer_id,
    reviewee_id as transporter_id,
    rating,
    review_text,
    created_at,
    updated_at
FROM ratings_reviews;

-- ============================================================================
-- 4. Update Existing Tables Structure
-- ============================================================================

-- Ensure all profile tables have proper constraints
ALTER TABLE business_profiles ALTER COLUMN company_name SET NOT NULL;
ALTER TABLE transporter_profiles ALTER COLUMN vehicle_type SET NOT NULL;
ALTER TABLE transporter_profiles ALTER COLUMN vehicle_number SET NOT NULL;
ALTER TABLE transporter_profiles ALTER COLUMN license_number SET NOT NULL;

-- Add missing columns to shipments table if they don't exist
ALTER TABLE shipments 
ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS order_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);

-- Create unique indexes for tracking numbers
CREATE UNIQUE INDEX IF NOT EXISTS idx_shipments_order_number ON shipments(order_number) WHERE order_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number) WHERE tracking_number IS NOT NULL;

-- ============================================================================
-- 5. Fix Data Type Issues
-- ============================================================================

-- Ensure profile_completed is boolean type in users table
ALTER TABLE users ALTER COLUMN profile_completed TYPE BOOLEAN USING 
    CASE 
        WHEN profile_completed::text = 'true' OR profile_completed::text = '1' THEN TRUE
        WHEN profile_completed::text = 'false' OR profile_completed::text = '0' THEN FALSE
        ELSE FALSE
    END;

-- ============================================================================
-- 6. Create Additional Useful Tables
-- ============================================================================

-- Create shipment_status_history table for tracking status changes
CREATE TABLE IF NOT EXISTS shipment_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shipment_status_history_shipment_id ON shipment_status_history(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_status_history_created_at ON shipment_status_history(created_at);

-- Create user_sessions table for tracking active sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    clerk_session_id VARCHAR(255),
    device_info JSONB,
    ip_address INET,
    is_active BOOLEAN DEFAULT TRUE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_clerk_id ON user_sessions(clerk_session_id);

-- Create system_settings table for app configuration
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_public ON system_settings(is_public);

-- ============================================================================
-- 7. Insert Default Data
-- ============================================================================

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description, is_public) VALUES
('app_version', '"1.0.0"', 'Current application version', true),
('maintenance_mode', 'false', 'Whether the app is in maintenance mode', true),
('default_currency', '"USD"', 'Default currency for payments', true),
('max_file_upload_mb', '10', 'Maximum file upload size in MB', false),
('notification_settings', '{"push_enabled": true, "email_enabled": true}', 'Default notification settings', false),
('pricing_model', '{"base_rate": 5.0, "per_km_rate": 1.5, "per_kg_rate": 0.5}', 'Default pricing model', false)
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- 8. Create Triggers for Automatic Updates
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables that have updated_at column
DO $$
DECLARE
    table_name TEXT;
    tables_with_updated_at TEXT[] := ARRAY[
        'users', 'business_profiles', 'transporter_profiles', 'customer_profiles', 
        'admin_profiles', 'shipments', 'tracking_events', 'chat_messages', 
        'ratings_reviews', 'payments', 'notifications', 'documents', 
        'service_areas', 'pricing_rules', 'chats', 'system_settings'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables_with_updated_at
    LOOP
        -- Drop trigger if it exists and recreate
        EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON %s', table_name, table_name);
        EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', table_name, table_name);
    END LOOP;
END $$;

-- ============================================================================
-- 9. Create Functions for Common Operations
-- ============================================================================

-- Function to get user's full profile information
CREATE OR REPLACE FUNCTION get_user_profile(user_clerk_id VARCHAR)
RETURNS TABLE (
    id UUID,
    email VARCHAR,
    name VARCHAR,
    phone VARCHAR,
    role VARCHAR,
    profile_completed BOOLEAN,
    profile_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.name,
        u.phone,
        u.role,
        u.profile_completed,
        CASE 
            WHEN u.role = 'business' THEN 
                jsonb_build_object(
                    'company_name', bp.company_name,
                    'business_type', bp.business_type,
                    'gst_number', bp.gst_number,
                    'business_address', bp.business_address,
                    'contact_person', bp.contact_person,
                    'business_phone', bp.business_phone,
                    'business_email', bp.business_email
                )
            WHEN u.role = 'transporter' THEN
                jsonb_build_object(
                    'vehicle_type', tp.vehicle_type,
                    'vehicle_number', tp.vehicle_number,
                    'license_number', tp.license_number,
                    'vehicle_capacity_kg', tp.vehicle_capacity_kg,
                    'service_areas', tp.service_areas,
                    'is_verified', tp.is_verified,
                    'is_available', tp.is_available,
                    'rating', tp.rating,
                    'total_deliveries', tp.total_deliveries,
                    'current_latitude', tp.current_latitude,
                    'current_longitude', tp.current_longitude
                )
            WHEN u.role = 'customer' THEN
                jsonb_build_object(
                    'preferred_delivery_address', cp.preferred_delivery_address,
                    'delivery_instructions', cp.delivery_instructions
                )
            WHEN u.role = 'admin' THEN
                jsonb_build_object(
                    'admin_level', ap.admin_level,
                    'permissions', ap.permissions
                )
            ELSE '{}'::jsonb
        END as profile_data
    FROM users u
    LEFT JOIN business_profiles bp ON u.id = bp.user_id AND u.role = 'business'
    LEFT JOIN transporter_profiles tp ON u.id = tp.user_id AND u.role = 'transporter'  
    LEFT JOIN customer_profiles cp ON u.id = cp.user_id AND u.role = 'customer'
    LEFT JOIN admin_profiles ap ON u.id = ap.user_id AND u.role = 'admin'
    WHERE u.clerk_user_id = user_clerk_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create a new shipment with tracking number generation
CREATE OR REPLACE FUNCTION create_shipment(
    p_business_id UUID,
    p_customer_id UUID,
    p_pickup_address TEXT,
    p_delivery_address TEXT,
    p_package_description TEXT,
    p_weight_kg DECIMAL DEFAULT NULL,
    p_dimensions JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    shipment_id UUID;
    tracking_number VARCHAR(100);
BEGIN
    -- Generate unique tracking number
    tracking_number := 'LQ' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Ensure tracking number is unique
    WHILE EXISTS (SELECT 1 FROM shipments WHERE tracking_number = tracking_number) LOOP
        tracking_number := 'LQ' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    END LOOP;
    
    -- Create shipment
    INSERT INTO shipments (
        business_id, customer_id, pickup_address, delivery_address,
        package_description, weight_kg, dimensions, status, tracking_number,
        order_number, created_at, updated_at
    ) VALUES (
        p_business_id, p_customer_id, p_pickup_address, p_delivery_address,
        p_package_description, p_weight_kg, p_dimensions, 'pending', tracking_number,
        'ORD' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ) RETURNING id INTO shipment_id;
    
    -- Create initial tracking event
    INSERT INTO tracking_events (
        shipment_id, status, notes, created_at
    ) VALUES (
        shipment_id, 'pending', 'Shipment created', CURRENT_TIMESTAMP
    );
    
    RETURN shipment_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. Final Data Integrity Checks and Fixes
-- ============================================================================

-- Update any NULL profile_completed values to FALSE
UPDATE users SET profile_completed = FALSE WHERE profile_completed IS NULL;

-- Ensure all timestamps are properly set
UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;

-- Sync current_location with current_latitude/longitude for existing transporters
UPDATE transporter_profiles 
SET 
    current_latitude = ST_Y(current_location),
    current_longitude = ST_X(current_location)
WHERE current_location IS NOT NULL AND (current_latitude IS NULL OR current_longitude IS NULL);

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'LogisticQ Database Schema Fix Completed Successfully!';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Fixed Issues:';
    RAISE NOTICE '✅ Added missing columns: users.name, users.profile_image_url, users.phone';
    RAISE NOTICE '✅ Added transporter_profiles.current_latitude, current_longitude';
    RAISE NOTICE '✅ Created missing chats table';
    RAISE NOTICE '✅ Created tracking and ratings views';
    RAISE NOTICE '✅ Fixed data type issues (profile_completed boolean)';
    RAISE NOTICE '✅ Added useful tables: shipment_status_history, user_sessions, system_settings';
    RAISE NOTICE '✅ Created automatic triggers for updated_at columns';
    RAISE NOTICE '✅ Added utility functions: get_user_profile(), create_shipment()';
    RAISE NOTICE '✅ Added default system settings';
    RAISE NOTICE '✅ Fixed data integrity issues';
    RAISE NOTICE '=================================================================';
END $$;