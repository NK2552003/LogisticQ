import { neon } from '@neondatabase/serverless';

const sql = neon(`${process.env.DATABASE_URL}`);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const clerkUserId = url.searchParams.get('clerkUserId');
    const type = url.searchParams.get('type') || 'all'; // all, orders, deliveries, messages

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

    let history: any[] = [];

    if (type === 'all' || type === 'orders') {
      // Fetch order history
      const orders = await sql`
        SELECT 
          s.id,
          s.order_number,
          s.status,
          s.pickup_address,
          s.delivery_address,
          s.estimated_cost,
          s.created_at,
          s.updated_at,
          'order' as type,
          cu.first_name || ' ' || cu.last_name as customer_name,
          du.first_name || ' ' || du.last_name as driver_name
        FROM shipments s
        LEFT JOIN users cu ON s.customer_id = cu.id
        LEFT JOIN users du ON s.driver_id = du.id
        WHERE ${user.role === 'transporter' ? sql`s.driver_id = ${user.id}` : sql`s.customer_id = ${user.id}`}
        AND s.status IN ('delivered', 'cancelled', 'completed')
        ORDER BY s.updated_at DESC
        LIMIT 50
      `;
      history = [...history, ...orders];
    }

    if (type === 'all' || type === 'messages') {
      // Fetch chat history
      const messages = await sql`
        SELECT 
          c.id,
          c.last_message,
          c.updated_at,
          'message' as type,
          u.first_name || ' ' || u.last_name as contact_name
        FROM chats c
        JOIN users u ON (
          CASE 
            WHEN c.user1_id = ${user.id} THEN c.user2_id 
            ELSE c.user1_id 
          END
        ) = u.id
        WHERE c.user1_id = ${user.id} OR c.user2_id = ${user.id}
        ORDER BY c.updated_at DESC
        LIMIT 20
      `;
      history = [...history, ...messages];
    }

    // Sort all history by date
    history.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    return new Response(
      JSON.stringify({ history }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching history:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch history' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const itemId = url.searchParams.get('itemId');
    const itemType = url.searchParams.get('type');
    const userId = url.searchParams.get('userId');

    if (!itemId || !itemType || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify user owns the item before deleting
    let canDelete = false;
    
    if (itemType === 'order') {
      const orderCheck = await sql`
        SELECT id FROM shipments 
        WHERE id = ${itemId} AND (customer_id = ${userId} OR driver_id = ${userId})
      `;
      canDelete = orderCheck.length > 0;
    } else if (itemType === 'message') {
      const chatCheck = await sql`
        SELECT id FROM chats 
        WHERE id = ${itemId} AND (user1_id = ${userId} OR user2_id = ${userId})
      `;
      canDelete = chatCheck.length > 0;
    }

    if (!canDelete) {
      return new Response(
        JSON.stringify({ error: 'Not authorized to delete this item' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Soft delete by updating status or adding deleted flag
    if (itemType === 'order') {
      await sql`
        UPDATE shipments 
        SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
        WHERE id = ${itemId}
      `;
    } else if (itemType === 'message') {
      await sql`
        UPDATE chats 
        SET is_deleted = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${itemId}
      `;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error deleting history item:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete item' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}