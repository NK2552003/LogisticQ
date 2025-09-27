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
    console.log('🔍 Chat API endpoint called - GET /chat');
    
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
    const chatId = url.searchParams.get('chatId');
    const userId = url.searchParams.get('userId');

    console.log('📋 Query parameters:', { chatId, userId });

    if (chatId) {
      // Get messages for specific chat
      console.log('🔍 Fetching messages for chat:', chatId);
      const messages = await sql`
        SELECT 
          m.*,
          u.first_name as sender_first_name,
          u.last_name as sender_last_name,
          u.profile_image_url as sender_avatar
        FROM chat_messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.chat_id = ${chatId}
        ORDER BY m.created_at ASC
      `;
      
      const serializedMessages = serializeData(messages);
      console.log('✅ Found', messages.length, 'messages for chat');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: serializedMessages,
          count: messages.length
        }),
        {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
        }
      );
    }

    if (userId) {
      // Get all chats for user
      console.log('🔍 Fetching chats for user:', userId);
      const chats = await sql`
        SELECT DISTINCT
          c.*,
          CASE 
            WHEN c.customer_id = ${userId} THEN CONCAT(t.first_name, ' ', t.last_name)
            ELSE CONCAT(cu.first_name, ' ', cu.last_name)
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
        ORDER BY cm.created_at DESC NULLS LAST
      `;
      
      const serializedChats = serializeData(chats);
      console.log('✅ Found', chats.length, 'chats for user');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: serializedChats,
          count: chats.length
        }),
        {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Missing required parameters',
        details: 'Either chatId or userId parameter is required'
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Chat API error:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to fetch chat data',
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
    console.log('🔍 Chat API endpoint called - POST /chat');
    
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

    const { chatId, senderId, content, messageType = 'text' } = body;

    console.log('📝 Sending message:', { chatId, senderId, messageType });

    // Validate required fields
    if (!chatId || !senderId || !content) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields',
          required: ['chatId', 'senderId', 'content']
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const result = await sql`
      INSERT INTO chat_messages (chat_id, sender_id, content, message_type, created_at)
      VALUES (${chatId}, ${senderId}, ${content}, ${messageType}, NOW())
      RETURNING *
    `;

    if (result.length === 0) {
      throw new Error('Failed to create message - no data returned');
    }

    // Update chat's last activity
    try {
      await sql`
        UPDATE chats 
        SET updated_at = NOW()
        WHERE id = ${chatId}
      `;
      console.log('✅ Updated chat last activity');
    } catch (error) {
      console.warn('⚠️ Could not update chat last activity:', error);
    }

    const serializedResult = serializeData(result[0]);
    console.log('✅ Message sent successfully:', serializedResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: serializedResult,
        message: 'Message sent successfully'
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
    console.error('❌ Chat POST error:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to send message',
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