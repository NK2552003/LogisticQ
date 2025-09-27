-- ============================================================================
-- LogisticQ Complete Database Schema - API Compatible Version
-- ============================================================================
-- This schema is fully compatible with all API endpoints
-- All field mismatches have been resolved
-- Generated on: 2025-09-27
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geographic data

-- ============================================================================
-- CORE USERS TABLE
-- ============================================================================

-- Users table - Core user authentication and profile data
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    name VARCHAR(255) GENERATED ALWAYS AS (CONCAT(first_name, ' ', last_name)) STORED, -- Auto-generated full name
    phone_number VARCHAR(20),
    phone VARCHAR(20), -- Additional phone field for API compatibility
    address TEXT,
    profile_image_url TEXT, -- For user avatars
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) CHECK (role IN ('business', 'transporter', 'customer', 'admin')),
    profile_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);

-- ============================================================================
-- PROFILE TABLES
-- ============================================================================

-- Business profile table
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

-- Transporter profile table - Enhanced with all required fields
CREATE TABLE IF NOT EXISTS transporter_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vehicle_type VARCHAR(100) NOT NULL,
    vehicle_number VARCHAR(50) NOT NULL,
    license_number VARCHAR(100) NOT NULL,
    vehicle_capacity_kg DECIMAL(10,2),
    service_areas TEXT[], -- Array of service areas
    is_verified BOOLEAN DEFAULT FALSE,
    verification_documents JSONB,
    current_location POINT, -- PostGIS point for precise location
    current_latitude DECIMAL(10, 8), -- For API compatibility
    current_longitude DECIMAL(11, 8), -- For API compatibility
    is_available BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3,2) DEFAULT 0,
    total_deliveries INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer profile table
CREATE TABLE IF NOT EXISTS customer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    preferred_delivery_address TEXT,
    delivery_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Admin profile table
CREATE TABLE IF NOT EXISTS admin_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    admin_level VARCHAR(50) DEFAULT 'standard', -- standard, super_admin
    permissions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SHIPMENTS TABLE - API COMPATIBLE
-- ============================================================================

-- Shipments table with all API-required fields
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(100) UNIQUE, -- Business order reference
    tracking_number VARCHAR(100) UNIQUE, -- Customer tracking reference
    business_id UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    transporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES users(id) ON DELETE SET NULL, -- API compatibility
    
    -- Pickup details
    pickup_address TEXT NOT NULL,
    pickup_contact_name VARCHAR(255),
    pickup_contact_phone VARCHAR(20),
    pickup_instructions TEXT,
    
    -- Delivery details
    delivery_address TEXT NOT NULL,
    delivery_contact_name VARCHAR(255),
    delivery_contact_phone VARCHAR(20),
    delivery_instructions TEXT,
    
    -- Package details
    package_description TEXT NOT NULL,
    package_weight DECIMAL(10,2),
    package_dimensions VARCHAR(255), -- String format for API compatibility
    package_value DECIMAL(10,2),
    item_count INTEGER DEFAULT 1,
    
    -- Service details
    service_type VARCHAR(50) DEFAULT 'standard',
    priority VARCHAR(20) DEFAULT 'standard' CHECK (priority IN ('low', 'standard', 'high', 'urgent')),
    
    -- Status and tracking
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending', 'assigned', 'picked_up', 'in_transit', 
        'out_for_delivery', 'delivered', 'cancelled', 'failed'
    )),
    
    -- Pricing
    quoted_price DECIMAL(10,2),
    estimated_cost DECIMAL(10,2),
    final_cost DECIMAL(10,2),
    
    -- Payment
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN (
        'pending', 'processing', 'completed', 'failed', 'refunded'
    )),
    
    -- Special requirements and notes
    special_requirements TEXT,
    notes TEXT,
    
    -- Dates
    pickup_scheduled_at TIMESTAMP WITH TIME ZONE,
    pickup_actual_at TIMESTAMP WITH TIME ZONE,
    delivery_scheduled_at TIMESTAMP WITH TIME ZONE,
    delivery_actual_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    additional_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TRACKING EVENTS TABLE
-- ============================================================================

-- Tracking events table with API-compatible fields
CREATE TABLE IF NOT EXISTS tracking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    event_type VARCHAR(100), -- picked_up, in_transit, delivered, etc.
    status VARCHAR(50),
    description TEXT, -- Maps to 'notes' in API
    location VARCHAR(255), -- Human readable location
    coordinates POINT, -- GPS coordinates (PostGIS)
    latitude DECIMAL(10, 8), -- Separate latitude for API
    longitude DECIMAL(11, 8), -- Separate longitude for API
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    additional_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================

-- Payments table with API-compatible fields
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    payer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    payee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    transporter_id UUID REFERENCES users(id) ON DELETE SET NULL, -- For API compatibility
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50) CHECK (payment_method IN ('card', 'bank_transfer', 'wallet', 'cash', 'cod')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    transaction_id VARCHAR(255),
    gateway_transaction_id VARCHAR(255),
    gateway_response JSONB,
    processing_fee DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2),
    refund_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CHATS AND MESSAGING
-- ============================================================================

-- Chats table for organizing conversations
CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'location', 'document')),
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- RATINGS AND REVIEWS
-- ============================================================================

-- Ratings table for API compatibility
CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transporter_id UUID REFERENCES users(id) ON DELETE CASCADE, -- API field name
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_type VARCHAR(50) CHECK (review_type IN ('service', 'communication', 'timeliness', 'overall')),
    is_public BOOLEAN DEFAULT TRUE,
    response_text TEXT,
    response_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(100) CHECK (notification_type IN (
        'shipment_created', 'shipment_assigned', 'pickup_scheduled', 'picked_up',
        'in_transit', 'out_for_delivery', 'delivered', 'payment_received',
        'rating_received', 'message_received', 'system_alert'
    )),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT FALSE,
    is_sent BOOLEAN DEFAULT FALSE,
    send_via_push BOOLEAN DEFAULT TRUE,
    send_via_email BOOLEAN DEFAULT FALSE,
    send_via_sms BOOLEAN DEFAULT FALSE,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- DOCUMENTS AND FILES
-- ============================================================================

-- Documents table for file uploads
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
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

-- ============================================================================
-- SYSTEM TABLES
-- ============================================================================

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR OPTIMAL PERFORMANCE
-- ============================================================================

-- Profile table indexes
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_transporter_profiles_user_id ON transporter_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON customer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_user_id ON admin_profiles(user_id);

-- Transporter location indexes
CREATE INDEX IF NOT EXISTS idx_transporter_location ON transporter_profiles USING GIST(current_location);
CREATE INDEX IF NOT EXISTS idx_transporter_lat_lng ON transporter_profiles(current_latitude, current_longitude);
CREATE INDEX IF NOT EXISTS idx_transporter_available ON transporter_profiles(is_available);
CREATE INDEX IF NOT EXISTS idx_transporter_verified ON transporter_profiles(is_verified);

-- Shipment indexes
CREATE INDEX IF NOT EXISTS idx_shipments_business_id ON shipments(business_id);
CREATE INDEX IF NOT EXISTS idx_shipments_customer_id ON shipments(customer_id);
CREATE INDEX IF NOT EXISTS idx_shipments_transporter_id ON shipments(transporter_id);
CREATE INDEX IF NOT EXISTS idx_shipments_driver_id ON shipments(driver_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_payment_status ON shipments(payment_status);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON shipments(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_shipments_order_number ON shipments(order_number) WHERE order_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number) WHERE tracking_number IS NOT NULL;

-- Tracking event indexes
CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment_id ON tracking_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_timestamp ON tracking_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_tracking_events_status ON tracking_events(status);

-- Payment indexes
CREATE INDEX IF NOT EXISTS idx_payments_shipment_id ON payments(shipment_id);
CREATE INDEX IF NOT EXISTS idx_payments_payer_id ON payments(payer_id);
CREATE INDEX IF NOT EXISTS idx_payments_payee_id ON payments(payee_id);
CREATE INDEX IF NOT EXISTS idx_payments_transporter_id ON payments(transporter_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);

-- Chat indexes
CREATE INDEX IF NOT EXISTS idx_chats_customer_id ON chats(customer_id);
CREATE INDEX IF NOT EXISTS idx_chats_transporter_id ON chats(transporter_id);
CREATE INDEX IF NOT EXISTS idx_chats_shipment_id ON chats(shipment_id);
CREATE INDEX IF NOT EXISTS idx_chats_status ON chats(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Rating indexes
CREATE INDEX IF NOT EXISTS idx_ratings_shipment_id ON ratings(shipment_id);
CREATE INDEX IF NOT EXISTS idx_ratings_reviewer_id ON ratings(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_ratings_transporter_id ON ratings(transporter_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rating ON ratings(rating);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_shipment_id ON notifications(shipment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_sent ON notifications(is_sent);

-- Document indexes
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_shipment_id ON documents(shipment_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_verified ON documents(is_verified);

-- System table indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_public ON system_settings(is_public);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_profiles_updated_at BEFORE UPDATE ON business_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transporter_profiles_updated_at BEFORE UPDATE ON transporter_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_profiles_updated_at BEFORE UPDATE ON customer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_profiles_updated_at BEFORE UPDATE ON admin_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON ratings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to get user's complete profile information
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
        COALESCE(u.phone, u.phone_number) as phone,
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

-- Function to create a new shipment with automatic tracking number generation
CREATE OR REPLACE FUNCTION create_shipment(
    p_customer_id UUID,
    p_pickup_address TEXT,
    p_delivery_address TEXT,
    p_package_description TEXT,
    p_package_weight DECIMAL DEFAULT NULL,
    p_package_dimensions VARCHAR DEFAULT NULL,
    p_package_value DECIMAL DEFAULT NULL,
    p_item_count INTEGER DEFAULT 1,
    p_service_type VARCHAR DEFAULT 'standard',
    p_priority VARCHAR DEFAULT 'standard',
    p_special_requirements TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS TABLE (
    shipment_id UUID,
    tracking_number VARCHAR,
    order_number VARCHAR
) AS $$
DECLARE
    v_shipment_id UUID;
    v_tracking_number VARCHAR(100);
    v_order_number VARCHAR(100);
BEGIN
    -- Generate unique tracking number
    v_tracking_number := 'TRK' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    
    -- Ensure tracking number is unique
    WHILE EXISTS (SELECT 1 FROM shipments WHERE tracking_number = v_tracking_number) LOOP
        v_tracking_number := 'TRK' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    END LOOP;
    
    -- Generate unique order number
    v_order_number := 'ORD' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    WHILE EXISTS (SELECT 1 FROM shipments WHERE order_number = v_order_number) LOOP
        v_order_number := 'ORD' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    END LOOP;
    
    -- Create shipment
    INSERT INTO shipments (
        customer_id, pickup_address, delivery_address, package_description,
        package_weight, package_dimensions, package_value, item_count,
        service_type, priority, status, tracking_number, order_number,
        special_requirements, notes, created_at, updated_at
    ) VALUES (
        p_customer_id, p_pickup_address, p_delivery_address, p_package_description,
        p_package_weight, p_package_dimensions, p_package_value, p_item_count,
        p_service_type, p_priority, 'pending', v_tracking_number, v_order_number,
        p_special_requirements, p_notes, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ) RETURNING id INTO v_shipment_id;
    
    -- Create initial tracking event
    INSERT INTO tracking_events (
        shipment_id, event_type, status, description, timestamp, created_at
    ) VALUES (
        v_shipment_id, 'created', 'pending', 'Shipment created and awaiting assignment', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    );
    
    -- Return shipment details
    RETURN QUERY SELECT v_shipment_id, v_tracking_number, v_order_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DEFAULT SYSTEM SETTINGS
-- ============================================================================

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description, is_public) VALUES
('app_version', '"1.0.0"', 'Current application version', true),
('maintenance_mode', 'false', 'Whether the app is in maintenance mode', true),
('default_currency', '"USD"', 'Default currency for payments', true),
('max_file_upload_mb', '10', 'Maximum file upload size in MB', false),
('notification_settings', '{"push_enabled": true, "email_enabled": true}', 'Default notification settings', false),
('pricing_model', '{"base_rate": 5.0, "per_km_rate": 1.5, "per_kg_rate": 0.5}', 'Default pricing model', false),
('supported_payment_methods', '["card", "bank_transfer", "wallet", "cash", "cod"]', 'Available payment methods', true),
('max_shipment_weight_kg', '1000', 'Maximum shipment weight in kg', true),
('default_service_radius_km', '50', 'Default service radius for transporters', false)
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- SAMPLE DATA FOR TESTING (OPTIONAL)
-- ============================================================================

-- Note: Uncomment the following section if you want to add sample data for testing

/*
-- Sample users
INSERT INTO users (email, password, first_name, last_name, phone_number, clerk_user_id, role, profile_completed) VALUES
('admin@logisticq.com', 'hashed_password_here', 'Admin', 'User', '+1234567890', 'clerk_admin_001', 'admin', true),
('customer@example.com', 'hashed_password_here', 'John', 'Doe', '+1234567891', 'clerk_customer_001', 'customer', true),
('transporter@example.com', 'hashed_password_here', 'Jane', 'Smith', '+1234567892', 'clerk_transporter_001', 'transporter', true),
('business@example.com', 'hashed_password_here', 'Business', 'Owner', '+1234567893', 'clerk_business_001', 'business', true)
ON CONFLICT (email) DO NOTHING;
*/

-- ============================================================================
-- SCHEMA COMPLETION VERIFICATION
-- ============================================================================

-- This schema includes all tables and fields required by the APIs:
-- ✅ Users table with all required fields (name, phone, profile_image_url, etc.)
-- ✅ Profile tables for all user roles
-- ✅ Shipments table with all API fields (pickup_contact_name, package_weight, etc.)
-- ✅ Tracking events with latitude/longitude fields
-- ✅ Payments table with transporter_id for API compatibility
-- ✅ Chat and messaging system
-- ✅ Ratings table (renamed from ratings_reviews for API compatibility)
-- ✅ Notifications system
-- ✅ Document management
-- ✅ System settings and audit logs
-- ✅ All required indexes for performance
-- ✅ Triggers for automatic timestamp updates
-- ✅ Utility functions for common operations
-- ✅ Default system settings

-- Database is now fully compatible with all existing API endpoints!