import { neon } from '@neondatabase/serverless';

const sql = neon(`${process.env.DATABASE_URL}`);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const clerkUserId = url.searchParams.get('clerkUserId');

    let user;
    if (userId) {
      const userResult = await sql`
        SELECT id, role FROM users WHERE id = ${userId}
      `;
      user = userResult[0];
    } else if (clerkUserId) {
      const userResult = await sql`
        SELECT id, role FROM users WHERE clerk_user_id = ${clerkUserId}
      `;
      user = userResult[0];
    }

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch orders based on user role
    let orders;
    if (user.role === 'transporter') {
      orders = await sql`
        SELECT 
          s.*,
          u.first_name || ' ' || u.last_name as customer_name,
          u.phone as customer_phone,
          bp.company_name
        FROM shipments s
        JOIN users u ON s.customer_id = u.id
        LEFT JOIN business_profiles bp ON u.id = bp.user_id
        WHERE s.driver_id = ${user.id}
        ORDER BY s.created_at DESC
      `;
    } else if (user.role === 'business' || user.role === 'customer') {
      orders = await sql`
        SELECT 
          s.*,
          du.first_name || ' ' || du.last_name as driver_name,
          du.phone as driver_phone,
          tp.vehicle_make || ' ' || tp.vehicle_model as vehicle_info
        FROM shipments s
        LEFT JOIN users du ON s.driver_id = du.id
        LEFT JOIN transporter_profiles tp ON du.id = tp.user_id
        WHERE s.customer_id = ${user.id}
        ORDER BY s.created_at DESC
      `;
    } else {
      // Admin - see all orders
      orders = await sql`
        SELECT 
          s.*,
          cu.first_name || ' ' || cu.last_name as customer_name,
          cu.phone as customer_phone,
          du.first_name || ' ' || du.last_name as driver_name,
          du.phone as driver_phone,
          bp.company_name,
          tp.vehicle_make || ' ' || tp.vehicle_model as vehicle_info
        FROM shipments s
        JOIN users cu ON s.customer_id = cu.id
        LEFT JOIN users du ON s.driver_id = du.id
        LEFT JOIN business_profiles bp ON cu.id = bp.user_id
        LEFT JOIN transporter_profiles tp ON du.id = tp.user_id
        ORDER BY s.created_at DESC
      `;
    }

    return new Response(
      JSON.stringify({ orders }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching orders:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch orders' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      customer_id, 
      pickup_address, 
      delivery_address, 
      pickup_date, 
      delivery_date,
      package_details,
      estimated_cost,
      priority = 'medium',
      service_type = 'standard'
    } = body;

    // Generate order number
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const result = await sql`
      INSERT INTO shipments (
        customer_id,
        pickup_address,
        delivery_address,
        pickup_date,
        delivery_date,
        package_details,
        estimated_cost,
        status,
        priority,
        service_type,
        order_number,
        tracking_number
      ) VALUES (
        ${customer_id},
        ${pickup_address},
        ${delivery_address},
        ${pickup_date},
        ${delivery_date},
        ${JSON.stringify(package_details)},
        ${estimated_cost},
        'pending',
        ${priority},
        ${service_type},
        ${orderNumber},
        ${'TRK-' + String(Date.now()).slice(-8)}
      )
      RETURNING *
    `;

    return new Response(
      JSON.stringify({ success: true, order: result[0] }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating order:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create order' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { orderId, status, driver_id, notes } = body;

    const result = await sql`
      UPDATE shipments 
      SET 
        status = ${status},
        driver_id = ${driver_id || null},
        notes = ${notes || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${orderId}
      RETURNING *
    `;

    if (result.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create tracking event
    await sql`
      INSERT INTO tracking_events (
        shipment_id,
        status,
        description,
        timestamp
      ) VALUES (
        ${orderId},
        ${status},
        ${`Order status updated to ${status}`},
        CURRENT_TIMESTAMP
      )
    `;

    return new Response(
      JSON.stringify({ success: true, order: result[0] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error updating order:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update order' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}