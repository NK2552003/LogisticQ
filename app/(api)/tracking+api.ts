import { neon } from '@neondatabase/serverless';

const sql = neon(`${process.env.DATABASE_URL}`);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const clerkUserId = url.searchParams.get('clerkUserId');
    const orderId = url.searchParams.get('orderId');

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

    // Create tracking table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS tracking_updates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        shipment_id UUID REFERENCES shipments(id),
        location JSONB,
        status VARCHAR(100),
        description TEXT,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        driver_id UUID REFERENCES users(id),
        is_milestone BOOLEAN DEFAULT false,
        estimated_arrival TIMESTAMP WITH TIME ZONE,
        actual_arrival TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    let trackingData;
    if (orderId) {
      // Get tracking for specific order
      trackingData = await sql`
        SELECT 
          tu.*,
          s.order_number,
          s.pickup_address,
          s.delivery_address,
          s.status as shipment_status,
          s.estimated_delivery,
          du.first_name || ' ' || du.last_name as driver_name,
          du.phone as driver_phone
        FROM tracking_updates tu
        LEFT JOIN shipments s ON tu.shipment_id = s.id
        LEFT JOIN users du ON tu.driver_id = du.id
        WHERE tu.shipment_id = ${orderId}
        AND (s.customer_id = ${user.id} OR s.driver_id = ${user.id} OR s.business_id = ${user.id})
        ORDER BY tu.timestamp DESC
      `;

      // Get shipment details
      const shipmentDetails = await sql`
        SELECT 
          s.*,
          cu.first_name || ' ' || cu.last_name as customer_name,
          cu.phone as customer_phone,
          du.first_name || ' ' || du.last_name as driver_name,
          du.phone as driver_phone,
          bp.company_name
        FROM shipments s
        LEFT JOIN users cu ON s.customer_id = cu.id
        LEFT JOIN users du ON s.driver_id = du.id
        LEFT JOIN business_profiles bp ON s.business_id = bp.user_id
        WHERE s.id = ${orderId}
        AND (s.customer_id = ${user.id} OR s.driver_id = ${user.id} OR s.business_id = ${user.id})
      `;

      return new Response(
        JSON.stringify({ 
          tracking: trackingData,
          shipment: shipmentDetails[0] || null
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      // Get all active trackings for user
      if (user.role === 'transporter') {
        trackingData = await sql`
          SELECT 
            s.id,
            s.order_number,
            s.pickup_address,
            s.delivery_address,
            s.status,
            s.estimated_delivery,
            cu.first_name || ' ' || cu.last_name as customer_name,
            MAX(tu.timestamp) as last_update,
            COUNT(tu.id) as total_updates
          FROM shipments s
          LEFT JOIN users cu ON s.customer_id = cu.id
          LEFT JOIN tracking_updates tu ON s.id = tu.shipment_id
          WHERE s.driver_id = ${user.id}
          AND s.status NOT IN ('delivered', 'cancelled')
          GROUP BY s.id, s.order_number, s.pickup_address, s.delivery_address, s.status, s.estimated_delivery, cu.first_name, cu.last_name
          ORDER BY s.created_at DESC
        `;
      } else {
        trackingData = await sql`
          SELECT 
            s.id,
            s.order_number,
            s.pickup_address,
            s.delivery_address,
            s.status,
            s.estimated_delivery,
            du.first_name || ' ' || du.last_name as driver_name,
            du.phone as driver_phone,
            MAX(tu.timestamp) as last_update,
            COUNT(tu.id) as total_updates
          FROM shipments s
          LEFT JOIN users du ON s.driver_id = du.id
          LEFT JOIN tracking_updates tu ON s.id = tu.shipment_id
          WHERE (s.customer_id = ${user.id} OR s.business_id = ${user.id})
          AND s.status NOT IN ('delivered', 'cancelled')
          GROUP BY s.id, s.order_number, s.pickup_address, s.delivery_address, s.status, s.estimated_delivery, du.first_name, du.last_name, du.phone
          ORDER BY s.created_at DESC
        `;
      }
    }

    return new Response(
      JSON.stringify({ tracking: trackingData }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching tracking data:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch tracking data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      shipment_id,
      location,
      status,
      description,
      driver_id,
      is_milestone = false,
      estimated_arrival
    } = body;

    if (!shipment_id || !location || !status) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Add tracking update
    const result = await sql`
      INSERT INTO tracking_updates (
        shipment_id,
        location,
        status,
        description,
        driver_id,
        is_milestone,
        estimated_arrival
      ) VALUES (
        ${shipment_id},
        ${JSON.stringify(location)},
        ${status},
        ${description || ''},
        ${driver_id},
        ${is_milestone},
        ${estimated_arrival || null}
      )
      RETURNING *
    `;

    // Update shipment status
    await sql`
      UPDATE shipments 
      SET 
        status = ${status},
        current_location = ${JSON.stringify(location)},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${shipment_id}
    `;

    return new Response(
      JSON.stringify({ success: true, tracking: result[0] }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating tracking update:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create tracking update' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { tracking_id, actual_arrival, status } = body;

    if (!tracking_id) {
      return new Response(
        JSON.stringify({ error: 'Tracking ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await sql`
      UPDATE tracking_updates 
      SET 
        actual_arrival = ${actual_arrival || null},
        status = ${status || status},
        timestamp = CURRENT_TIMESTAMP
      WHERE id = ${tracking_id}
      RETURNING *
    `;

    if (result.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Tracking update not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, tracking: result[0] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error updating tracking:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update tracking' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}