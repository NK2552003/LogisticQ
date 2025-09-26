import { neon } from '@neondatabase/serverless';

// Initialize Neon database connection
const sql = neon(`${process.env.DATABASE_URL}`);

// GET handler - Fetch user role
export async function GET(request: Request) {
  try {
    console.log('🔍 API endpoint called - GET /user/role');
    const url = new URL(request.url);
    const clerkUserId = url.searchParams.get('clerkUserId');

    if (!clerkUserId) {
      return new Response(
        JSON.stringify({ error: 'Clerk user ID is required as query parameter' }),
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
        JSON.stringify({ error: 'User not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ User role fetched successfully:', result[0]);
    return new Response(
      JSON.stringify({ user: result[0] }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching user role:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// PUT handler - Update user role
export async function PUT(request: Request) {
  try {
    console.log('🔍 API endpoint called - PUT /user/role');
    const body = await request.json();
    console.log('📝 Request body:', body);
    const { clerkUserId, role } = body;

    if (!clerkUserId || !role) {
      return new Response(
        JSON.stringify({ error: 'Clerk user ID and role are required' }),
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
        JSON.stringify({ error: 'Invalid role. Must be one of: business, transporter, customer, admin' }),
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
        JSON.stringify({ error: 'User not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ User role updated successfully:', result[0]);
    return new Response(
      JSON.stringify({ user: result[0] }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating user role:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}