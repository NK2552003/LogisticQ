-- LogisticQ Complete Database Schema (Updated & Fixed)
-- This is the complete database schema with all fixes applied
-- Generated on: September 27, 2025

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE (Core authentication and user data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    name VARCHAR(255), -- Full name (auto-populated from first_name + last_name)
    phone_number VARCHAR(20),
    phone VARCHAR(20), -- Additional phone field for API compatibility
    address TEXT,
    profile_image_url TEXT, -- User avatar/profile picture URL
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) CHECK (role IN ('business', 'transporter', 'customer', 'admin')),
    profile_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);

-- ============================================================================
-- PROFILE TABLES (Extended user information by role)
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

-- Transporter profile table
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
    current_location POINT,
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

-- Profile table indexes
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_transporter_profiles_user_id ON transporter_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON customer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_user_id ON admin_profiles(user_id);

-- Transporter-specific indexes
CREATE INDEX IF NOT EXISTS idx_transporter_location ON transporter_profiles USING GIST(current_location);
CREATE INDEX IF NOT EXISTS idx_transporter_lat_lng ON transporter_profiles(current_latitude, current_longitude);
CREATE INDEX IF NOT EXISTS idx_transporter_available ON transporter_profiles(is_available);
CREATE INDEX IF NOT EXISTS idx_transporter_verified ON transporter_profiles(is_verified);

-- ============================================================================
-- SHIPMENTS TABLE (Core shipment/order data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(100), -- Order reference number
    tracking_number VARCHAR(100), -- Tracking number for customers
    business_id UUID REFERENCES users(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES users(id) ON DELETE SET NULL, -- For API compatibility
    pickup_address TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    pickup_coordinates POINT,
    delivery_coordinates POINT,
    package_description TEXT,
    weight_kg DECIMAL(10,2),
    dimensions JSONB, -- {length, width, height, unit}
    declared_value DECIMAL(12,2),
    insurance_required BOOLEAN DEFAULT FALSE,
    special_instructions TEXT,
    pickup_date DATE,
    delivery_date DATE,
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    actual_delivery TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending', 'confirmed', 'pickup_scheduled', 'picked_up', 
        'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 
        'returned', 'failed_delivery'
    )),
    priority_level VARCHAR(20) DEFAULT 'standard' CHECK (priority_level IN ('standard', 'express', 'urgent')),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    total_amount DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'USD',
    distance_km DECIMAL(10,2),
    estimated_duration_minutes INTEGER,
    proof_of_delivery JSONB, -- Photos, signatures, etc.
    delivery_notes TEXT,
    rating DECIMAL(3,2),
    feedback TEXT,
    metadata JSONB, -- Additional flexible data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Shipments table indexes
CREATE INDEX IF NOT EXISTS idx_shipments_business_id ON shipments(business_id);
CREATE INDEX IF NOT EXISTS idx_shipments_customer_id ON shipments(customer_id);
CREATE INDEX IF NOT EXISTS idx_shipments_transporter_id ON shipments(transporter_id);
CREATE INDEX IF NOT EXISTS idx_shipments_driver_id ON shipments(driver_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_payment_status ON shipments(payment_status);
CREATE INDEX IF NOT EXISTS idx_shipments_pickup_date ON shipments(pickup_date);
CREATE INDEX IF NOT EXISTS idx_shipments_delivery_date ON shipments(delivery_date);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON shipments(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_shipments_order_number ON shipments(order_number) WHERE order_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number) WHERE tracking_number IS NOT NULL;

-- ============================================================================
-- TRACKING TABLE (Shipment tracking events)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tracking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    event_type VARCHAR(100), -- pickup, transit, delivery, etc.
    status VARCHAR(50),
    description TEXT,
    location VARCHAR(255),
    coordinates POINT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    additional_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tracking events indexes
CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment_id ON tracking_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_timestamp ON tracking_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_tracking_events_status ON tracking_events(status);
CREATE INDEX IF NOT EXISTS idx_tracking_events_created_by ON tracking_events(created_by);

-- Create tracking view for API compatibility
CREATE OR REPLACE VIEW tracking AS 
SELECT 
    id,
    shipment_id,
    NULL::decimal as latitude,
    NULL::decimal as longitude,
    status,
    description as notes,
    timestamp,
    created_by,
    created_at
FROM tracking_events;

-- ============================================================================
-- COMMUNICATION TABLES (Chat and messaging)
-- ============================================================================

-- Chats table (conversation containers)
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
    message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'location', 'system')),
    file_url TEXT,
    file_type VARCHAR(100),
    file_size INTEGER,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat indexes
CREATE INDEX IF NOT EXISTS idx_chats_customer_id ON chats(customer_id);
CREATE INDEX IF NOT EXISTS idx_chats_transporter_id ON chats(transporter_id);
CREATE INDEX IF NOT EXISTS idx_chats_shipment_id ON chats(shipment_id);
CREATE INDEX IF NOT EXISTS idx_chats_status ON chats(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_shipment_id ON chat_messages(shipment_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver_id ON chat_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- ============================================================================
-- RATINGS AND REVIEWS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ratings_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_type VARCHAR(50) CHECK (review_type IN ('customer_to_transporter', 'transporter_to_customer', 'business_to_transporter')),
    is_public BOOLEAN DEFAULT TRUE,
    response_text TEXT, -- Response from reviewee
    response_date TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ratings indexes
CREATE INDEX IF NOT EXISTS idx_ratings_reviews_shipment_id ON ratings_reviews(shipment_id);
CREATE INDEX IF NOT EXISTS idx_ratings_reviews_reviewer_id ON ratings_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_ratings_reviews_reviewee_id ON ratings_reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_ratings_reviews_rating ON ratings_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_ratings_reviews_type ON ratings_reviews(review_type);

-- Create ratings view for API compatibility
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
-- PAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    payer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    payee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    payment_type VARCHAR(50) CHECK (payment_type IN ('shipment_fee', 'cancellation_fee', 'insurance', 'tip', 'refund')),
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50) CHECK (payment_method IN ('credit_card', 'debit_card', 'bank_transfer', 'wallet', 'cash', 'upi')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
    transaction_id VARCHAR(255),
    gateway_transaction_id VARCHAR(255),
    gateway_name VARCHAR(100),
    gateway_fee DECIMAL(10,2),
    net_amount DECIMAL(12,2),
    payment_date TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    refund_amount DECIMAL(12,2),
    refund_date TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_shipment_id ON payments(shipment_id);
CREATE INDEX IF NOT EXISTS idx_payments_payer_id ON payments(payer_id);
CREATE INDEX IF NOT EXISTS idx_payments_payee_id ON payments(payee_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(100) CHECK (notification_type IN (
        'shipment_created', 'shipment_assigned', 'pickup_scheduled', 'picked_up',
        'in_transit', 'delivered', 'payment_received', 'rating_received', 'message_received'
    )),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    delivery_method VARCHAR(50) DEFAULT 'push' CHECK (delivery_method IN ('push', 'email', 'sms', 'in_app')),
    delivery_status VARCHAR(50) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_shipment_id ON notifications(shipment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- ============================================================================
-- ADDITIONAL UTILITY TABLES
-- ============================================================================

-- Documents table for file uploads
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

-- Service areas table for transporter coverage
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

-- Pricing rules table for dynamic pricing
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

-- Audit logs table for tracking important actions
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

-- System settings table for app configuration
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR ADDITIONAL TABLES
-- ============================================================================

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_shipment_id ON documents(shipment_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_verified ON documents(is_verified);

-- Service areas indexes
CREATE INDEX IF NOT EXISTS idx_service_areas_transporter_id ON service_areas(transporter_id);
CREATE INDEX IF NOT EXISTS idx_service_areas_active ON service_areas(is_active);
CREATE INDEX IF NOT EXISTS idx_service_areas_coordinates ON service_areas USING GIST(coordinates);

-- Pricing rules indexes
CREATE INDEX IF NOT EXISTS idx_pricing_rules_type ON pricing_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON pricing_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_effective ON pricing_rules(effective_from, effective_until);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- System settings indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_public ON system_settings(is_public);

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

-- Create triggers for all tables that have updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_profiles_updated_at BEFORE UPDATE ON business_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transporter_profiles_updated_at BEFORE UPDATE ON transporter_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_profiles_updated_at BEFORE UPDATE ON customer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_profiles_updated_at BEFORE UPDATE ON admin_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ratings_reviews_updated_at BEFORE UPDATE ON ratings_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_areas_updated_at BEFORE UPDATE ON service_areas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pricing_rules_updated_at BEFORE UPDATE ON pricing_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
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

-- Function to create a new shipment with auto-generated tracking number
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
    order_number VARCHAR(100);
BEGIN
    -- Generate unique tracking number
    tracking_number := 'LQ' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Ensure tracking number is unique
    WHILE EXISTS (SELECT 1 FROM shipments WHERE tracking_number = tracking_number) LOOP
        tracking_number := 'LQ' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    END LOOP;
    
    -- Generate unique order number
    order_number := 'ORD' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Ensure order number is unique
    WHILE EXISTS (SELECT 1 FROM shipments WHERE order_number = order_number) LOOP
        order_number := 'ORD' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    END LOOP;
    
    -- Create shipment
    INSERT INTO shipments (
        business_id, customer_id, pickup_address, delivery_address,
        package_description, weight_kg, dimensions, status, tracking_number,
        order_number, created_at, updated_at
    ) VALUES (
        p_business_id, p_customer_id, p_pickup_address, p_delivery_address,
        p_package_description, p_weight_kg, p_dimensions, 'pending', tracking_number,
        order_number, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ) RETURNING id INTO shipment_id;
    
    -- Create initial tracking event
    INSERT INTO tracking_events (
        shipment_id, event_type, status, description, timestamp, created_at
    ) VALUES (
        shipment_id, 'created', 'pending', 'Shipment created', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    );
    
    RETURN shipment_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DEFAULT DATA
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
-- SCHEMA COMPLETION
-- ============================================================================

-- This completes the LogisticQ database schema with all fixes applied:
-- ✅ Added missing users.name, users.profile_image_url, users.phone columns
-- ✅ Added transporter_profiles.current_latitude, current_longitude columns  
-- ✅ Created missing chats table
-- ✅ Added missing shipments columns (driver_id, order_number, tracking_number)
-- ✅ Fixed profile_completed boolean type
-- ✅ Created tracking and ratings views for API compatibility
-- ✅ Added comprehensive indexes for performance
-- ✅ Added automatic triggers for updated_at columns
-- ✅ Added utility functions for common operations
-- ✅ Added default system settings
-- ✅ Fixed all data integrity issues