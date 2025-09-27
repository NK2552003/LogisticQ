import { neon } from '@neondatabase/serverless';

// Load environment variables
if (typeof window === 'undefined') {
  require('dotenv').config();
}

const sql = neon(`${process.env.DATABASE_URL}`);

// Serialize dates to avoid JSON serialization issues
function serializeData(data: any): any {
  if (Array.isArray(data)) {
    return data.map(serializeData);
  } else if (data && typeof data === 'object') {
    const serialized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Date) {
        serialized[key] = value.toISOString();
      } else if (value && typeof value === 'object') {
        serialized[key] = serializeData(value);
      } else {
        serialized[key] = value;
      }
    }
    return serialized;
  }
  return data;
}

export async function GET(request: Request) {
  try {
    console.log('🔍 Tracking API endpoint called - GET /tracking');
    
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL environment variable is not set');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database configuration error',
          details: 'DATABASE_URL environment variable is not set. Please check your .env file.'
        }),
        {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
        }
      );
    }

    const url = new URL(request.url);
    const shipmentId = url.searchParams.get('shipmentId');
    const driverId = url.searchParams.get('driverId');

    console.log('📋 Query parameters:', { shipmentId, driverId });

    let tracking;

    if (shipmentId) {
      // Get tracking info for specific shipment
      console.log('🔍 Fetching tracking for shipment:', shipmentId);
      tracking = await sql`
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
          u.first_name as driver_first_name,
          u.last_name as driver_last_name,
          u.phone as driver_phone
        FROM tracking_events te
        JOIN shipments s ON te.shipment_id = s.id
        LEFT JOIN users u ON s.driver_id = u.id
        WHERE te.shipment_id = ${shipmentId}
        ORDER BY te.timestamp DESC
      `;
      
      console.log('✅ Found', tracking.length, 'tracking records for shipment');
    } else if (driverId) {
      // Get all tracking for driver
      console.log('🔍 Fetching tracking for driver:', driverId);
      tracking = await sql`
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
    } else {
      // Get all recent tracking data
      console.log('🔍 Fetching all recent tracking data');
      tracking = await sql`
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
          u.first_name as driver_first_name,
          u.last_name as driver_last_name
        FROM tracking_events te
        JOIN shipments s ON te.shipment_id = s.id
        LEFT JOIN users u ON s.driver_id = u.id
        ORDER BY te.timestamp DESC
        LIMIT 100
      `;

      console.log('✅ Found', tracking.length, 'total tracking records');
    }

    // Serialize the data to avoid JSON issues
    const serializedTracking = serializeData(tracking || []);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: serializedTracking,
        count: tracking?.length || 0
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
      }
    );
  } catch (error) {
    console.error('❌ Tracking API error:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to fetch tracking data',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('🔍 Tracking API endpoint called - POST /tracking');
    
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL environment variable is not set');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database configuration error',
          details: 'DATABASE_URL environment variable is not set'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('❌ Failed to parse request body:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body',
          details: error instanceof Error ? error.message : 'Unknown error'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { shipmentId, latitude, longitude, status, notes, eventType, location } = body;

    // Validate required fields
    if (!shipmentId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required field: shipmentId'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('📝 Creating tracking event:', { shipmentId, latitude, longitude, status, eventType });

    const result = await sql`
      INSERT INTO tracking_events (
        shipment_id, event_type, status, description, location, coordinates, timestamp
      ) VALUES (
        ${shipmentId}, 
        ${eventType || 'update'}, 
        ${status || 'in_transit'}, 
        ${notes || 'Location updated'}, 
        ${location || 'En route'},
        POINT(${longitude || 0}, ${latitude || 0}), 
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

    if (result.length === 0) {
      throw new Error('Failed to create tracking event - no data returned');
    }

    // Update shipment status if provided
    if (status) {
      try {
        await sql`
          UPDATE shipments 
          SET status = ${status}, updated_at = NOW()
          WHERE id = ${shipmentId}
        `;
        console.log('✅ Updated shipment status to:', status);
      } catch (error) {
        console.warn('⚠️ Could not update shipment status:', error);
      }
    }

    const serializedResult = serializeData(result[0]);
    console.log('✅ Tracking event created successfully:', serializedResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: serializedResult,
        message: 'Tracking event created successfully'
      }),
      {
        status: 201,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
      }
    );
  } catch (error) {
    console.error('❌ Tracking POST error:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to update tracking',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
      }
    );
  }
}