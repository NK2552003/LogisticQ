import { neon } from '@neondatabase/serverless';

// Initialize Neon database connection
const sql = neon(`${process.env.DATABASE_URL}`);

// POST handler - Create new user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, clerkUserId } = body;

    if (!email || !firstName || !lastName) {
      return new Response(
        JSON.stringify({ error: 'Email, first name, and last name are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert new user into database
    const result = await sql`
      INSERT INTO users (email, first_name, last_name, clerk_user_id, created_at, updated_at)
      VALUES (${email}, ${firstName}, ${lastName}, ${clerkUserId}, NOW(), NOW())
      RETURNING id, email, first_name, last_name, created_at, updated_at
    `;

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

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}