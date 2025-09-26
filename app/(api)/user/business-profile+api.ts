import { neon } from '@neondatabase/serverless';

// Initialize Neon database connection
const sql = neon(`${process.env.DATABASE_URL}`);

// POST handler - Create business profile
export async function POST(request: Request) {
  try {
    console.log('🔍 API endpoint called - POST /user/business-profile');
    const body = await request.json();
    console.log('📝 Request body:', body);
    const { 
      clerkUserId, 
      companyName, 
      businessType, 
      gstNumber, 
      businessAddress, 
      contactPerson, 
      businessPhone, 
      businessEmail 
    } = body;

    if (!clerkUserId || !companyName || !businessType || !businessAddress || !contactPerson || !businessPhone || !businessEmail) {
      return new Response(
        JSON.stringify({ error: 'All required fields must be provided' }),
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

    // Insert business profile
    console.log('💾 Inserting business profile into database...');
    const result = await sql`
      INSERT INTO business_profiles (
        user_id, company_name, business_type, gst_number, business_address, 
        contact_person, business_phone, business_email, created_at, updated_at
      )
      VALUES (
        ${userId}, ${companyName}, ${businessType}, ${gstNumber || null}, ${businessAddress},
        ${contactPerson}, ${businessPhone}, ${businessEmail}, NOW(), NOW()
      )
      RETURNING *
    `;

    // Update user profile_completed status
    await sql`
      UPDATE users SET profile_completed = TRUE, updated_at = NOW() WHERE id = ${userId}
    `;

    console.log('✅ Business profile created successfully:', result[0]);
    return new Response(
      JSON.stringify({ profile: result[0] }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating business profile:', error);
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