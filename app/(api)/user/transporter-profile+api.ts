import { neon } from '@neondatabase/serverless';

// Initialize Neon database connection
const sql = neon(`${process.env.DATABASE_URL}`);

// POST handler - Create transporter profile
export async function POST(request: Request) {
  try {
    console.log('🔍 API endpoint called - POST /user/transporter-profile');
    const body = await request.json();
    console.log('📝 Request body:', body);
    const { 
      clerkUserId, 
      vehicleType, 
      vehicleNumber, 
      licenseNumber, 
      vehicleCapacityKg, 
      serviceAreas 
    } = body;

    if (!clerkUserId || !vehicleType || !vehicleNumber || !licenseNumber || !vehicleCapacityKg || !serviceAreas) {
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

    // Insert transporter profile
    console.log('💾 Inserting transporter profile into database...');
    const result = await sql`
      INSERT INTO transporter_profiles (
        user_id, vehicle_type, vehicle_number, license_number, vehicle_capacity_kg, 
        service_areas, is_verified, is_available, rating, total_deliveries, created_at, updated_at
      )
      VALUES (
        ${userId}, ${vehicleType}, ${vehicleNumber}, ${licenseNumber}, ${vehicleCapacityKg},
        ${serviceAreas}, FALSE, TRUE, 0, 0, NOW(), NOW()
      )
      RETURNING *
    `;

    // Update user profile_completed status
    await sql`
      UPDATE users SET profile_completed = TRUE, updated_at = NOW() WHERE id = ${userId}
    `;

    console.log('✅ Transporter profile created successfully:', result[0]);
    return new Response(
      JSON.stringify({ profile: result[0] }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating transporter profile:', error);
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