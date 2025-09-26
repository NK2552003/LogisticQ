import { neon } from '@neondatabase/serverless';

// Load environment variables
if (typeof window === 'undefined') {
  require('dotenv').config();
}

const sql = neon(`${process.env.DATABASE_URL}`);

export async function GET(request: Request) {
  try {
    console.log('🔍 Tracking API endpoint called - GET /tracking');
    
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL environment variable is not set');
      return Response.json({
        success: false,
        error: 'Database configuration error',
        details: 'DATABASE_URL environment variable is not set. Please check your .env file.'
      }, { status: 500 });
    }

    const url = new URL(request.url);
    const shipmentId = url.searchParams.get('shipmentId');
    const driverId = url.searchParams.get('driverId');

    console.log('📋 Query parameters:', { shipmentId, driverId });

    if (shipmentId) {
      // Get tracking info for specific shipment
      console.log('🔍 Fetching tracking for shipment:', shipmentId);
      const tracking = await sql`
        SELECT 
          te.id,
          te.shipment_id,
          te.event_type,
          te.status,
          te.description as notes,
          te.location,
          te.coordinates[0] as longitude,
          te.coordinates[1] as latitude,
          te.timestamp,
          s.pickup_address,
          s.delivery_address,
          s.status as shipment_status,
          u.name as driver_name,
          u.phone as driver_phone
        FROM tracking_events te
        JOIN shipments s ON te.shipment_id = s.id
        LEFT JOIN users u ON s.driver_id = u.id
        WHERE te.shipment_id = ${shipmentId}
        ORDER BY te.timestamp DESC
      `;
      
      console.log('✅ Found', tracking.length, 'tracking records for shipment');
      return Response.json({ success: true, data: tracking || [] });
    }

    if (driverId) {
      // Get all tracking for driver
      console.log('🔍 Fetching tracking for driver:', driverId);
      const tracking = await sql`
        SELECT 
          te.id,
          te.shipment_id,
          te.event_type,
          te.status,
          te.description as notes,
          te.location,
          te.coordinates[0] as longitude,
          te.coordinates[1] as latitude,
          te.timestamp,
          s.pickup_address,
          s.delivery_address,
          s.status as shipment_status
        FROM tracking_events te
        JOIN shipments s ON te.shipment_id = s.id
        WHERE s.driver_id = ${driverId}
        ORDER BY te.timestamp DESC
        LIMIT 50
      `;
      
      console.log('✅ Found', tracking.length, 'tracking records for driver');
      return Response.json({ success: true, data: tracking || [] });
    }

    // Get all recent tracking data
    console.log('🔍 Fetching all recent tracking data');
    const tracking = await sql`
      SELECT 
        te.id,
        te.shipment_id,
        te.event_type,
        te.status,
        te.description as notes,
        te.location,
        te.coordinates[0] as longitude,
        te.coordinates[1] as latitude,
        te.timestamp,
        s.pickup_address,
        s.delivery_address,
        s.status as shipment_status,
        u.name as driver_name
      FROM tracking_events te
      JOIN shipments s ON te.shipment_id = s.id
      LEFT JOIN users u ON s.driver_id = u.id
      ORDER BY te.timestamp DESC
      LIMIT 100
    `;

    console.log('✅ Found', tracking.length, 'total tracking records');
    return Response.json({ success: true, data: tracking || [] });
  } catch (error) {
    console.error('❌ Tracking API error:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to fetch tracking data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log('🔍 Tracking API endpoint called - POST /tracking');
    const { shipmentId, latitude, longitude, status, notes, eventType, location } = await request.json();

    console.log('📝 Creating tracking event:', { shipmentId, latitude, longitude, status, eventType });

    const result = await sql`
      INSERT INTO tracking_events (
        shipment_id, event_type, status, description, location, coordinates, timestamp
      ) VALUES (
        ${shipmentId}, 
        ${eventType || 'update'}, 
        ${status}, 
        ${notes || 'Location updated'}, 
        ${location || 'En route'},
        POINT(${longitude}, ${latitude}), 
        NOW()
      )
      RETURNING 
        id,
        shipment_id,
        event_type,
        status,
        description as notes,
        location,
        coordinates[0] as longitude,
        coordinates[1] as latitude,
        timestamp
    `;

    // Update shipment status if provided
    if (status) {
      await sql`
        UPDATE shipments 
        SET status = ${status}, updated_at = NOW()
        WHERE id = ${shipmentId}
      `;
      console.log('✅ Updated shipment status to:', status);
    }

    console.log('✅ Tracking event created successfully');
    return Response.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('❌ Tracking POST error:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to update tracking',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}