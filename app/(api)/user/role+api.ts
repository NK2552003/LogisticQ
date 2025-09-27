import { neon } from '@neondatabase/serverless';

// Load environment variables
if (typeof window === 'undefined') {
  require('dotenv').config();
}

// Initialize Neon database connection
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

// GET handler - Fetch user role
export async function GET(request: Request) {
  try {
    console.log('🔍 API endpoint called - GET /user/role');
    
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
    const clerkUserId = url.searchParams.get('clerkUserId');

    if (!clerkUserId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Clerk user ID is required as query parameter' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('🔍 Fetching user role for clerkUserId:', clerkUserId);
    
    // Fetch user role from database
    const result = await sql`
      SELECT id, email, first_name, last_name, clerk_user_id, role, profile_completed, created_at, updated_at
      FROM users 
      WHERE clerk_user_id = ${clerkUserId}
    `;

    if (result.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'User not found' 
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const serializedUser = serializeData(result[0]);
    console.log('✅ User role fetched successfully:', serializedUser);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        user: serializedUser 
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
    console.error('❌ Error fetching user role:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
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

// PUT handler - Update user role
export async function PUT(request: Request) {
  try {
    console.log('🔍 API endpoint called - PUT /user/role');
    
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

    console.log('📝 Request body:', body);
    const { clerkUserId, role } = body;

    if (!clerkUserId || !role) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Clerk user ID and role are required' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate role
    const validRoles = ['business', 'transporter', 'customer', 'admin'];
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid role. Must be one of: business, transporter, customer, admin',
          validRoles
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Update user role
    console.log('💾 Updating user role in database...');
    const result = await sql`
      UPDATE users 
      SET role = ${role}, updated_at = NOW()
      WHERE clerk_user_id = ${clerkUserId}
      RETURNING id, email, first_name, last_name, clerk_user_id, role, profile_completed, updated_at
    `;

    if (result.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'User not found' 
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const serializedUser = serializeData(result[0]);
    console.log('✅ User role updated successfully:', serializedUser);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        user: serializedUser,
        message: 'User role updated successfully'
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
    console.error('❌ Error updating user role:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
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