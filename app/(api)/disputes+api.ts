import { neon } from '@neondatabase/serverless';

const sql = neon(`${process.env.DATABASE_URL}`);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const clerkUserId = url.searchParams.get('clerkUserId');
    const status = url.searchParams.get('status') || 'all';

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

    // Create disputes table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS disputes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES shipments(id),
        complainant_id UUID REFERENCES users(id),
        respondent_id UUID REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        resolution TEXT,
        resolved_by UUID REFERENCES users(id),
        resolved_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create dispute_messages table for communication
    await sql`
      CREATE TABLE IF NOT EXISTS dispute_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        dispute_id UUID REFERENCES disputes(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES users(id),
        message TEXT NOT NULL,
        attachment_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    let disputes;
    if (status === 'all') {
      disputes = await sql`
        SELECT 
          d.*,
          s.order_number,
          s.pickup_address,
          s.delivery_address,
          cu.first_name || ' ' || cu.last_name as complainant_name,
          ru.first_name || ' ' || ru.last_name as respondent_name,
          COUNT(dm.id) as message_count
        FROM disputes d
        LEFT JOIN shipments s ON d.order_id = s.id
        LEFT JOIN users cu ON d.complainant_id = cu.id
        LEFT JOIN users ru ON d.respondent_id = ru.id
        LEFT JOIN dispute_messages dm ON d.id = dm.dispute_id
        WHERE d.complainant_id = ${user.id} OR d.respondent_id = ${user.id}
        GROUP BY d.id, s.order_number, s.pickup_address, s.delivery_address, cu.first_name, cu.last_name, ru.first_name, ru.last_name
        ORDER BY d.created_at DESC
      `;
    } else {
      disputes = await sql`
        SELECT 
          d.*,
          s.order_number,
          s.pickup_address,
          s.delivery_address,
          cu.first_name || ' ' || cu.last_name as complainant_name,
          ru.first_name || ' ' || ru.last_name as respondent_name,
          COUNT(dm.id) as message_count
        FROM disputes d
        LEFT JOIN shipments s ON d.order_id = s.id
        LEFT JOIN users cu ON d.complainant_id = cu.id
        LEFT JOIN users ru ON d.respondent_id = ru.id
        LEFT JOIN dispute_messages dm ON d.id = dm.dispute_id
        WHERE (d.complainant_id = ${user.id} OR d.respondent_id = ${user.id})
        AND d.status = ${status}
        GROUP BY d.id, s.order_number, s.pickup_address, s.delivery_address, cu.first_name, cu.last_name, ru.first_name, ru.last_name
        ORDER BY d.created_at DESC
      `;
    }

    return new Response(
      JSON.stringify({ disputes }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching disputes:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch disputes' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      order_id, 
      complainant_id, 
      respondent_id, 
      title, 
      description, 
      category, 
      priority = 'medium' 
    } = body;

    if (!order_id || !complainant_id || !title || !description || !category) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create the dispute
    const result = await sql`
      INSERT INTO disputes (
        order_id,
        complainant_id,
        respondent_id,
        title,
        description,
        category,
        priority,
        status
      ) VALUES (
        ${order_id},
        ${complainant_id},
        ${respondent_id},
        ${title},
        ${description},
        ${category},
        ${priority},
        'open'
      )
      RETURNING *
    `;

    return new Response(
      JSON.stringify({ success: true, dispute: result[0] }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating dispute:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create dispute' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { dispute_id, status, resolution, resolved_by } = body;

    if (!dispute_id) {
      return new Response(
        JSON.stringify({ error: 'Dispute ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'resolved') {
      updateData.resolution = resolution;
      updateData.resolved_by = resolved_by;
      updateData.resolved_at = new Date().toISOString();
    }

    const result = await sql`
      UPDATE disputes 
      SET 
        status = ${status},
        resolution = ${resolution || null},
        resolved_by = ${resolved_by || null},
        resolved_at = ${status === 'resolved' ? new Date().toISOString() : null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${dispute_id}
      RETURNING *
    `;

    if (result.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Dispute not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, dispute: result[0] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error updating dispute:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update dispute' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}