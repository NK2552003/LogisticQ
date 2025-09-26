import { neon } from '@neondatabase/serverless';

// Initialize Neon database connection
const sql = neon(`${process.env.DATABASE_URL}`);

// GET handler - Fetch user data
export async function GET(request: Request) {
  try {
    console.log('🔍 API endpoint called - GET /user');
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

    console.log('🔍 Fetching user data for clerkUserId:', clerkUserId);
    
    // Fetch user data from database
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

    console.log('✅ User data fetched successfully:', result[0]);
    return new Response(
      JSON.stringify({ user: result[0] }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching user data:', error);
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

// POST handler - Create new user
export async function POST(request: Request) {
  try {
    console.log('🔍 API endpoint called - POST /user');
    const body = await request.json();
    console.log('📝 Request body:', body);
    const { email, firstName, lastName, clerkUserId, password } = body;

    if (!email || !firstName || !lastName || !clerkUserId || !password) {
      return new Response(
        JSON.stringify({ error: 'Email, first name, last name, password and clerk user ID are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert new user into database
    console.log('💾 Inserting user into database...');
    const result = await sql`
      INSERT INTO users (email, first_name, last_name, clerk_user_id, password, created_at, updated_at)
      VALUES (${email}, ${firstName}, ${lastName}, ${clerkUserId}, ${password}, NOW(), NOW())
      RETURNING id, email, first_name, last_name, clerk_user_id, created_at, updated_at
    `;

    console.log('✅ User inserted successfully:', result[0]);
    return new Response(
      JSON.stringify({ user: result[0] }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle unique constraint violation (user already exists)
    if (error instanceof Error && error.message.includes('unique constraint')) {
      return new Response(
        JSON.stringify({ error: 'User already exists' }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle database connection errors
    if (error instanceof Error && error.message.includes('connection')) {
      return new Response(
        JSON.stringify({ error: 'Database connection failed' }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle table not found errors
    if (error instanceof Error && error.message.includes('relation') && error.message.includes('does not exist')) {
      return new Response(
        JSON.stringify({ error: 'Database table not found. Please ensure the users table exists.' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

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