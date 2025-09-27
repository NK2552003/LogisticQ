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
    console.log('🔍 Payments API endpoint called - GET /payments');
    
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
    const userId = url.searchParams.get('userId');
    const role = url.searchParams.get('role');

    console.log('📋 Query parameters:', { userId, role });

    let payments;

    if (userId && role) {
      if (role === 'transporter') {
        // Get earnings for transporter
        console.log('🔍 Fetching payments for transporter:', userId);
        payments = await sql`
          SELECT 
            p.*,
            s.pickup_address,
            s.delivery_address,
            u.first_name as customer_first_name,
            u.last_name as customer_last_name,
            u.email as customer_email
          FROM payments p
          JOIN shipments s ON p.shipment_id = s.id
          JOIN users u ON s.customer_id = u.id
          WHERE p.transporter_id = ${userId}
          ORDER BY p.created_at DESC
        `;
      } else {
        // Get payments for customer/business
        console.log('🔍 Fetching payments for customer/business:', userId);
        payments = await sql`
          SELECT 
            p.*,
            s.pickup_address,
            s.delivery_address,
            u.first_name as transporter_first_name,
            u.last_name as transporter_last_name,
            u.email as transporter_email
          FROM payments p
          JOIN shipments s ON p.shipment_id = s.id
          LEFT JOIN users u ON s.driver_id = u.id
          WHERE s.customer_id = ${userId}
          ORDER BY p.created_at DESC
        `;
      }
      
      console.log('✅ Found', payments.length, 'payments for user');
    } else {
      // Get all payments (admin view)
      console.log('🔍 Fetching all payments (admin view)');
      payments = await sql`
        SELECT 
          p.*,
          s.pickup_address,
          s.delivery_address,
          cu.first_name as customer_first_name,
          cu.last_name as customer_last_name,
          cu.email as customer_email,
          tr.first_name as transporter_first_name,
          tr.last_name as transporter_last_name,
          tr.email as transporter_email
        FROM payments p
        JOIN shipments s ON p.shipment_id = s.id
        JOIN users cu ON s.customer_id = cu.id
        LEFT JOIN users tr ON p.transporter_id = tr.id
        ORDER BY p.created_at DESC
      `;

      console.log('✅ Found', payments.length, 'total payments');
    }

    // Serialize the data to avoid JSON issues
    const serializedPayments = serializeData(payments);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: serializedPayments,
        count: payments.length
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
    console.error('❌ Payments API error:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to fetch payments',
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
    console.log('🔍 Payments API endpoint called - POST /payments');
    
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

    const { 
      shipmentId, 
      transporterId, 
      amount, 
      paymentMethod, 
      status = 'pending',
      transactionId 
    } = body;

    console.log('📝 Creating payment:', { shipmentId, transporterId, amount, paymentMethod, status });

    // Validate required fields
    const requiredFields = ['shipmentId', 'amount', 'paymentMethod'];
    const missingFields = requiredFields.filter(field => !body[field.replace('Id', '_id')]);
    
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

    const result = await sql`
      INSERT INTO payments (
        shipment_id, 
        transporter_id, 
        amount, 
        payment_method, 
        status,
        transaction_id,
        created_at,
        updated_at
      )
      VALUES (
        ${shipmentId}, 
        ${transporterId || null}, 
        ${amount}, 
        ${paymentMethod}, 
        ${status},
        ${transactionId || null},
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    if (result.length === 0) {
      throw new Error('Failed to create payment - no data returned');
    }

    const serializedResult = serializeData(result[0]);
    console.log('✅ Payment created successfully:', serializedResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: serializedResult,
        message: 'Payment created successfully'
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
    console.error('❌ Payments POST error:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to create payment',
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