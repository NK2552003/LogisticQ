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

    let result;
    
    if (customerId) {
      // Get shipments for a specific customer
      if (status) {
        result = await sql`
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
          WHERE s.customer_id = ${customerId} AND s.status = ${status}
          ORDER BY s.created_at DESC
        `;
      } else {
        result = await sql`
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
          ORDER BY s.created_at DESC
        `;
      }
    } else if (driverId) {
      // Get shipments for a specific driver
      if (status) {
        result = await sql`
          SELECT 
            s.*,
            u_customer.first_name as customer_first_name,
            u_customer.last_name as customer_last_name,
            u_customer.email as customer_email
          FROM shipments s
          LEFT JOIN users u_customer ON s.customer_id = u_customer.id
          WHERE s.driver_id = ${driverId} AND s.status = ${status}
          ORDER BY s.created_at DESC
        `;
      } else {
        result = await sql`
          SELECT 
            s.*,
            u_customer.first_name as customer_first_name,
            u_customer.last_name as customer_last_name,
            u_customer.email as customer_email
          FROM shipments s
          LEFT JOIN users u_customer ON s.customer_id = u_customer.id
          WHERE s.driver_id = ${driverId}
          ORDER BY s.created_at DESC
        `;
      }
    } else {
      // Get all shipments (admin view) or filtered shipments
      if (status && unassigned) {
        result = await sql`
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
          WHERE s.status = ${status} AND s.driver_id IS NULL
          ORDER BY s.created_at DESC
        `;
      } else if (status) {
        result = await sql`
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
          WHERE s.status = ${status}
          ORDER BY s.created_at DESC
        `;
      } else if (unassigned) {
        result = await sql`
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
          WHERE s.driver_id IS NULL
          ORDER BY s.created_at DESC
        `;
      } else {
        result = await sql`
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
          ORDER BY s.created_at DESC
        `;
      }
    }

    // Serialize the data to avoid JSON issues
    const serializedResult = serializeData(result);

    console.log('✅ Shipments fetched successfully, count:', result.length);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        data: serializedResult,
        count: result.length
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
    console.error('❌ Error fetching shipments:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to fetch shipments',
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

// POST handler - Create new shipment
export async function POST(request: Request) {
  try {
    console.log('🔍 API endpoint called - POST /shipments');
    
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
    
    console.log('📝 Shipment data received:', body);

    // Validate required fields based on actual database schema
    const requiredFields = ['customer_id', 'pickup_address', 'delivery_address', 'package_description'];
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

    // Generate tracking number and order number
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    const trackingNumber = `TRK${timestamp}${random}`;
    const orderNumber = `ORD${timestamp}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;

    console.log('📦 Generated tracking number:', trackingNumber);
    console.log('📋 Generated order number:', orderNumber);

    // Insert shipment into database using actual schema columns
    const result = await sql`
      INSERT INTO shipments (
        order_number,
        customer_id,
        driver_id,
        pickup_address,
        pickup_contact_name,
        pickup_contact_phone,
        pickup_instructions,
        delivery_address,
        delivery_contact_name,
        delivery_contact_phone,
        delivery_instructions,
        package_description,
        package_weight,
        package_dimensions,
        package_value,
        item_count,
        service_type,
        status,
        priority,
        tracking_number,
        quoted_price,
        payment_status,
        special_requirements,
        notes,
        created_at,
        updated_at
      ) VALUES (
        ${orderNumber},
        ${body.customer_id},
        ${body.driver_id || null},
        ${body.pickup_address},
        ${body.pickup_contact_name || null},
        ${body.pickup_contact_phone || null},
        ${body.pickup_instructions || null},
        ${body.delivery_address},
        ${body.delivery_contact_name || null},
        ${body.delivery_contact_phone || null},
        ${body.delivery_instructions || null},
        ${body.package_description},
        ${body.package_weight || null},
        ${body.package_dimensions || null},
        ${body.package_value || null},
        ${body.item_count || 1},
        ${body.service_type || 'standard'},
        ${body.status || 'pending'},
        ${body.priority || 'standard'},
        ${trackingNumber},
        ${body.quoted_price || null},
        ${body.payment_status || 'pending'},
        ${body.special_requirements || null},
        ${body.notes || null},
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    if (result.length === 0) {
      throw new Error('Failed to create shipment - no data returned');
    }

    const newShipment = serializeData(result[0]);
    console.log('✅ Shipment created successfully:', newShipment);

    // Update driver availability if driver is assigned
    if (body.driver_id) {
      try {
        await sql`
          UPDATE transporter_profiles 
          SET is_available = false, updated_at = NOW()
          WHERE user_id = ${body.driver_id}
        `;
        console.log('✅ Driver availability updated');
      } catch (error) {
        console.warn('⚠️ Could not update driver availability:', error);
        // Don't fail the entire request if this fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        data: newShipment,
        message: 'Shipment created successfully'
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
    console.error('❌ Error creating shipment:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to create shipment',
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

// PUT handler - Update shipment
export async function PUT(request: Request) {
  try {
    console.log('🔍 API endpoint called - PUT /shipments');
    
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

    const url = new URL(request.url);
    const shipmentId = url.searchParams.get('id');
    
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

    console.log('📝 Updating shipment:', shipmentId, body);

    // Build the update query dynamically based on provided fields
    const allowedFields = [
      'status', 'priority', 'driver_id', 'transporter_id', 'business_id',
      'pickup_date', 'delivery_date', 'estimated_pickup_time', 'estimated_delivery_time',
      'actual_pickup_time', 'actual_delivery_time', 'quoted_price', 'final_price',
      'payment_status', 'special_requirements', 'notes', 'pickup_instructions',
      'delivery_instructions', 'pickup_contact_name', 'pickup_contact_phone',
      'delivery_contact_name', 'delivery_contact_phone', 'package_weight',
      'package_dimensions', 'package_value', 'item_count', 'service_type'
    ];

    const fieldsToUpdate = Object.keys(body).filter(key => allowedFields.includes(key));
    
    if (fieldsToUpdate.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No valid fields to update',
          allowedFields: allowedFields
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create update query
    let updateQuery = 'UPDATE shipments SET ';
    const values: any[] = [];
    const setClauses: string[] = [];
    
    fieldsToUpdate.forEach((field, index) => {
      setClauses.push(`${field} = $${index + 1}`);
      values.push(body[field]);
    });
    
    setClauses.push(`updated_at = NOW()`);
    updateQuery += setClauses.join(', ');
    updateQuery += ` WHERE id = $${values.length + 1} RETURNING *`;
    values.push(shipmentId);

    console.log('📝 Update query:', updateQuery);
    console.log('📝 Values:', values);

    // Build update query using neon SQL template
    let result;
    
    if (fieldsToUpdate.includes('status') && fieldsToUpdate.length === 1) {
      result = await sql`
        UPDATE shipments 
        SET status = ${body.status}, updated_at = NOW()
        WHERE id = ${shipmentId}
        RETURNING *
      `;
    } else if (fieldsToUpdate.includes('driver_id') && fieldsToUpdate.length === 1) {
      result = await sql`
        UPDATE shipments 
        SET driver_id = ${body.driver_id}, updated_at = NOW()
        WHERE id = ${shipmentId}
        RETURNING *
      `;
    } else if (fieldsToUpdate.includes('priority') && fieldsToUpdate.length === 1) {
      result = await sql`
        UPDATE shipments 
        SET priority = ${body.priority}, updated_at = NOW()
        WHERE id = ${shipmentId}
        RETURNING *
      `;
    } else if (fieldsToUpdate.includes('payment_status') && fieldsToUpdate.length === 1) {
      result = await sql`
        UPDATE shipments 
        SET payment_status = ${body.payment_status}, updated_at = NOW()
        WHERE id = ${shipmentId}
        RETURNING *
      `;
    } else if (fieldsToUpdate.includes('quoted_price') && fieldsToUpdate.length === 1) {
      result = await sql`
        UPDATE shipments 
        SET quoted_price = ${body.quoted_price}, updated_at = NOW()
        WHERE id = ${shipmentId}
        RETURNING *
      `;
    } else if (fieldsToUpdate.includes('final_price') && fieldsToUpdate.length === 1) {
      result = await sql`
        UPDATE shipments 
        SET final_price = ${body.final_price}, updated_at = NOW()
        WHERE id = ${shipmentId}
        RETURNING *
      `;
    } else if (fieldsToUpdate.includes('notes') && fieldsToUpdate.length === 1) {
      result = await sql`
        UPDATE shipments 
        SET notes = ${body.notes}, updated_at = NOW()
        WHERE id = ${shipmentId}
        RETURNING *
      `;
    } else if (fieldsToUpdate.includes('special_requirements') && fieldsToUpdate.length === 1) {
      result = await sql`
        UPDATE shipments 
        SET special_requirements = ${body.special_requirements}, updated_at = NOW()
        WHERE id = ${shipmentId}
        RETURNING *
      `;
    } else {
      // For multiple fields or other single fields, handle common combinations
      if (fieldsToUpdate.includes('status') && fieldsToUpdate.includes('driver_id')) {
        result = await sql`
          UPDATE shipments 
          SET status = ${body.status}, driver_id = ${body.driver_id}, updated_at = NOW()
          WHERE id = ${shipmentId}
          RETURNING *
        `;
      } else if (fieldsToUpdate.includes('status') && fieldsToUpdate.includes('priority')) {
        result = await sql`
          UPDATE shipments 
          SET status = ${body.status}, priority = ${body.priority}, updated_at = NOW()
          WHERE id = ${shipmentId}
          RETURNING *
        `;
      } else {
        // Fallback: return error for complex updates
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Complex field updates not supported in this version',
            supportedSingleFields: ['status', 'driver_id', 'priority', 'payment_status', 'quoted_price', 'final_price', 'notes', 'special_requirements'],
            supportedCombinations: ['status + driver_id', 'status + priority']
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

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

    const updatedShipment = serializeData(result[0]);
    console.log('✅ Shipment updated successfully:', updatedShipment);

    // If driver was assigned, update their availability
    if (body.driver_id && fieldsToUpdate.includes('driver_id')) {
      try {
        await sql`
          UPDATE transporter_profiles 
          SET is_available = false, updated_at = NOW()
          WHERE user_id = ${body.driver_id}
        `;
        console.log('✅ Driver availability updated');
      } catch (error) {
        console.warn('⚠️ Could not update driver availability:', error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        data: updatedShipment,
        message: 'Shipment updated successfully'
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
    console.error('❌ Error updating shipment:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to update shipment',
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

// DELETE handler - Delete shipment
export async function DELETE(request: Request) {
  try {
    console.log('🔍 API endpoint called - DELETE /shipments');
    
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

    const url = new URL(request.url);
    const shipmentId = url.searchParams.get('id');
    
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

    console.log('🗑️ Deleting shipment:', shipmentId);

    // First, get the shipment to check if it exists and get driver info
    const existingShipment = await sql`
      SELECT id, driver_id, status FROM shipments WHERE id = ${shipmentId}
    `;

    if (existingShipment.length === 0) {
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

    const shipment = existingShipment[0];

    // Delete the shipment
    const result = await sql`
      DELETE FROM shipments WHERE id = ${shipmentId} RETURNING *
    `;

    if (result.length === 0) {
      throw new Error('Failed to delete shipment');
    }

    // If shipment had a driver, update their availability
    if (shipment.driver_id) {
      try {
        await sql`
          UPDATE transporter_profiles 
          SET is_available = true, updated_at = NOW()
          WHERE user_id = ${shipment.driver_id}
        `;
        console.log('✅ Driver availability updated after deletion');
      } catch (error) {
        console.warn('⚠️ Could not update driver availability after deletion:', error);
      }
    }

    console.log('✅ Shipment deleted successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Shipment deleted successfully',
        data: { id: shipmentId }
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
    console.error('❌ Error deleting shipment:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to delete shipment',
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