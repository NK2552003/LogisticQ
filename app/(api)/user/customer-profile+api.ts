import { neon } from '@neondatabase/serverless';

// Initialize Neon database connection
const sql = neon(`${process.env.DATABASE_URL}`);

// POST handler - Create customer profile
export async function POST(request: Request) {
  try {
    console.log('🔍 API endpoint called - POST /user/customer-profile');
    const body = await request.json();
    console.log('📝 Request body:', body);
    const { 
      clerkUserId, 
      preferredDeliveryAddress, 
      deliveryInstructions 
    } = body;

    if (!clerkUserId) {
      return new Response(
        JSON.stringify({ error: 'Clerk user ID is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // First, get the user ID from clerk_user_id
    const userResult = await sql`
      SELECT id FROM users WHERE clerk_user_id = ${clerkUserId}
    `;

    if (userResult.length === 0) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const userId = userResult[0].id;

    // Insert customer profile
    console.log('💾 Inserting customer profile into database...');
    const result = await sql`
      INSERT INTO customer_profiles (
        user_id, preferred_delivery_address, delivery_instructions, created_at, updated_at
      )
      VALUES (
        ${userId}, ${preferredDeliveryAddress || null}, ${deliveryInstructions || null}, NOW(), NOW()
      )
      RETURNING *
    `;

    // Update user profile_completed status
    await sql`
      UPDATE users SET profile_completed = TRUE, updated_at = NOW() WHERE id = ${userId}
    `;

    console.log('✅ Customer profile created successfully:', result[0]);
    return new Response(
      JSON.stringify({ profile: result[0] }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating customer profile:', error);
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