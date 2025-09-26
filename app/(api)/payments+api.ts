import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || process.env.EXPO_PUBLIC_DATABASE_URL!);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const role = url.searchParams.get('role');

    if (userId && role) {
      let payments;
      
      if (role === 'transporter') {
        // Get earnings for transporter
        payments = await sql`
          SELECT 
            p.*,
            s.pickup_address,
            s.delivery_address,
            u.name as customer_name
          FROM payments p
          JOIN shipments s ON p.shipment_id = s.id
          JOIN users u ON s.customer_id = u.id
          WHERE p.transporter_id = ${userId}
          ORDER BY p.created_at DESC
        `;
      } else {
        // Get payments for customer/business
        payments = await sql`
          SELECT 
            p.*,
            s.pickup_address,
            s.delivery_address,
            u.name as transporter_name
          FROM payments p
          JOIN shipments s ON p.shipment_id = s.id
          JOIN users u ON s.driver_id = u.id
          WHERE s.customer_id = ${userId}
          ORDER BY p.created_at DESC
        `;
      }
      
      return Response.json({ success: true, data: payments });
    }

    // Get all payments (admin view)
    const payments = await sql`
      SELECT 
        p.*,
        s.pickup_address,
        s.delivery_address,
        cu.name as customer_name,
        tr.name as transporter_name
      FROM payments p
      JOIN shipments s ON p.shipment_id = s.id
      JOIN users cu ON s.customer_id = cu.id
      LEFT JOIN users tr ON p.transporter_id = tr.id
      ORDER BY p.created_at DESC
    `;

    return Response.json({ success: true, data: payments });
  } catch (error) {
    console.error('Payments API error:', error);
    return Response.json({ success: false, error: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { 
      shipmentId, 
      transporterId, 
      amount, 
      paymentMethod, 
      status = 'pending',
      transactionId 
    } = await request.json();

    const result = await sql`
      INSERT INTO payments (
        shipment_id, 
        transporter_id, 
        amount, 
        payment_method, 
        status,
        transaction_id,
        created_at
      )
      VALUES (
        ${shipmentId}, 
        ${transporterId}, 
        ${amount}, 
        ${paymentMethod}, 
        ${status},
        ${transactionId},
        NOW()
      )
      RETURNING *
    `;

    return Response.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Payments POST error:', error);
    return Response.json({ success: false, error: 'Failed to create payment' }, { status: 500 });
  }
}