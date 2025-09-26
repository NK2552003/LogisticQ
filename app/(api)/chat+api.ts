import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.EXPO_PUBLIC_DATABASE_URL!);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const chatId = url.searchParams.get('chatId');
    const userId = url.searchParams.get('userId');

    if (chatId) {
      // Get messages for specific chat
      const messages = await sql`
        SELECT 
          m.*,
          u.name as sender_name,
          u.profile_image_url as sender_avatar
        FROM chat_messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.chat_id = ${chatId}
        ORDER BY m.created_at ASC
      `;
      
      return Response.json({ success: true, data: messages });
    }

    if (userId) {
      // Get all chats for user
      const chats = await sql`
        SELECT DISTINCT
          c.*,
          CASE 
            WHEN c.customer_id = ${userId} THEN t.name
            ELSE cu.name
          END as other_party_name,
          CASE 
            WHEN c.customer_id = ${userId} THEN t.profile_image_url
            ELSE cu.profile_image_url
          END as other_party_avatar,
          cm.content as last_message,
          cm.created_at as last_message_time
        FROM chats c
        LEFT JOIN users cu ON c.customer_id = cu.id
        LEFT JOIN users t ON c.transporter_id = t.id
        LEFT JOIN LATERAL (
          SELECT content, created_at
          FROM chat_messages
          WHERE chat_id = c.id
          ORDER BY created_at DESC
          LIMIT 1
        ) cm ON true
        WHERE c.customer_id = ${userId} OR c.transporter_id = ${userId}
        ORDER BY cm.created_at DESC
      `;
      
      return Response.json({ success: true, data: chats });
    }

    return Response.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json({ success: false, error: 'Failed to fetch chat data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { chatId, senderId, content, messageType = 'text' } = await request.json();

    if (!chatId || !senderId || !content) {
      return Response.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO chat_messages (chat_id, sender_id, content, message_type, created_at)
      VALUES (${chatId}, ${senderId}, ${content}, ${messageType}, NOW())
      RETURNING *
    `;

    // Update chat's last activity
    await sql`
      UPDATE chats 
      SET updated_at = NOW()
      WHERE id = ${chatId}
    `;

    return Response.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Chat POST error:', error);
    return Response.json({ success: false, error: 'Failed to send message' }, { status: 500 });
  }
}