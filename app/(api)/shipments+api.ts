import { neon } from '@neondatabase/serverless';

// Load environment variables
if (typeof window === 'undefined') {
  require('dotenv').config();
}

const sql = neon(`${process.env.DATABASE_URL}`);

// GET handler - Fetch shipments
export async function GET(request: Request) {
  try {
    console.log('🔍 API endpoint called - GET /shipments');
    
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
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    const url = new URL(request.url);
    const customerId = url.searchParams.get('customerId');
    const driverId = url.searchParams.get('driverId');
    const status = url.searchParams.get('status');
    const unassigned = url.searchParams.get('unassigned') === 'true';

    console.log('📋 Query parameters:', { customerId, driverId, status, unassigned });

    let query;
    
    if (customerId) {
      query = sql`
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
        WHERE s.customer_id = ${customerId}
        ${status ? sql`AND s.status = ${status}` : sql``}
        ORDER BY s.created_at DESC
      `;
    } else if (driverId) {
      query = sql`
        SELECT 
          s.*,
          u_customer.first_name as customer_first_name,
          u_customer.last_name as customer_last_name,
          u_customer.email as customer_email
        FROM shipments s
        LEFT JOIN users u_customer ON s.customer_id = u_customer.id
        WHERE s.driver_id = ${driverId}
        ${status ? sql`AND s.status = ${status}` : sql``}
        ORDER BY s.created_at DESC
      `;
    } else {
      // Get all shipments (admin view) or unassigned jobs
      let baseQuery = sql`
        SELECT 
          s.*,
          u_customer.first_name as customer_first_name,
          u_customer.last_name as customer_last_name,
          u_customer.email as customer_email,
          u_driver.first_name as driver_first_name,
          u_driver.last_name as driver_last_name,
          u_driver.email as driver_email
        FROM shipments s
        LEFT JOIN users u_customer ON s.customer_id = u_customer.id
        LEFT JOIN users u_driver ON s.driver_id = u_driver.id
      `;
      
      if (status && unassigned) {
        query = sql`${baseQuery} WHERE s.status = ${status} AND s.driver_id IS NULL ORDER BY s.created_at DESC`;
      } else if (status) {
        query = sql`${baseQuery} WHERE s.status = ${status} ORDER BY s.created_at DESC`;
      } else if (unassigned) {
        query = sql`${baseQuery} WHERE s.driver_id IS NULL ORDER BY s.created_at DESC`;
      } else {
        query = sql`${baseQuery} ORDER BY s.created_at DESC`;
      }
    }

    const result = await query;

    console.log('✅ Shipments fetched successfully, count:', result.length);
    return new Response(
      JSON.stringify({ 
        success: true,
        data: result 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error fetching shipments:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to fetch shipments',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// POST handler - Create new shipment
export async function POST(request: Request) {
  try {
    console.log('🔍 API endpoint called - POST /shipments');
    const body = await request.json();
    
    console.log('📝 Shipment data received:', body);

    // Validate required fields
    const requiredFields = [
      'customerId', 'driverId', 'pickupAddress', 'deliveryAddress',
      'pickupLatitude', 'pickupLongitude', 'deliveryLatitude', 'deliveryLongitude',
      'packageDescription', 'receiverName', 'receiverPhone'
    ];

    const missingFields = requiredFields.filter(field => !body[field]);
    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing required fields',
          missingFields 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate tracking number
    const trackingNumber = `TRK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const orderNumber = `ORD${Date.now()}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;

    // Insert shipment into database
    const result = await sql`
      INSERT INTO shipments (
        customer_id, driver_id, pickup_address, delivery_address,
        pickup_latitude, pickup_longitude, delivery_latitude, delivery_longitude,
        package_description, package_weight, package_dimensions, package_value,
        receiver_name, receiver_phone, preferred_pickup_time, special_instructions,
        shipment_type, estimated_cost, status, tracking_number, order_number,
        created_at, updated_at
      ) VALUES (
        ${body.customerId}, ${body.driverId}, ${body.pickupAddress}, ${body.deliveryAddress},
        ${body.pickupLatitude}, ${body.pickupLongitude}, ${body.deliveryLatitude}, ${body.deliveryLongitude},
        ${body.packageDescription}, ${body.packageWeight || 0}, ${body.packageDimensions || ''}, ${body.packageValue || 0},
        ${body.receiverName}, ${body.receiverPhone}, ${body.preferredPickupTime || null}, ${body.specialInstructions || ''},
        ${body.shipmentType || 'standard'}, ${body.estimatedCost || 0}, ${body.status || 'pending'}, 
        ${trackingNumber}, ${orderNumber},
        NOW(), NOW()
      )
      RETURNING *
    `;

    if (result.length === 0) {
      throw new Error('Failed to create shipment');
    }

    const newShipment = result[0];
    console.log('✅ Shipment created successfully:', newShipment);

    // Update driver availability (mark as busy)
    await sql`
      UPDATE transporter_profiles 
      SET is_available = false, updated_at = NOW()
      WHERE user_id = ${body.driverId}
    `;

    console.log('✅ Driver availability updated');

    return new Response(
      JSON.stringify({ 
        success: true,
        data: newShipment,
        message: 'Shipment created successfully'
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error creating shipment:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to create shipment',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// PUT handler - Update shipment
export async function PUT(request: Request) {
  try {
    console.log('🔍 API endpoint called - PUT /shipments');
    const url = new URL(request.url);
    const shipmentId = url.searchParams.get('id');
    const body = await request.json();

    if (!shipmentId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Shipment ID is required' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('📝 Updating shipment:', shipmentId, body);

    // Build dynamic update query
    const updateFields: string[] = [];
    const values: any[] = [];
    
    if (body.status !== undefined) {
      updateFields.push('status');
      values.push(body.status);
    }
    if (body.currentLatitude !== undefined && body.currentLongitude !== undefined) {
      updateFields.push('current_latitude', 'current_longitude');
      values.push(body.currentLatitude, body.currentLongitude);
    }
    if (body.estimatedArrival !== undefined) {
      updateFields.push('estimated_arrival');
      values.push(body.estimatedArrival);
    }

    if (updateFields.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No valid fields to update' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Build dynamic update query
    const setClause = updateFields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    values.push(shipmentId); // Add shipmentId as the last parameter
    
    const result = await sql.query(`
      UPDATE shipments 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING *
    `, values);

    if (result.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Shipment not found' 
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Shipment updated successfully:', result[0]);

    return new Response(
      JSON.stringify({ 
        success: true,
        data: result[0],
        message: 'Shipment updated successfully'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error updating shipment:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to update shipment',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}