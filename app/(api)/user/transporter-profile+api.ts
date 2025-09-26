import { neon } from '@neondatabase/serverless';

// Initialize Neon database connection
const sql = neon(`${process.env.DATABASE_URL}`);

// GET handler - Fetch transporter profile by userId or clerkUserId
export async function GET(request: Request) {
  try {
    console.log('🔍 API endpoint called - GET /user/transporter-profile');
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const clerkUserId = url.searchParams.get('clerkUserId');

    let resolvedUserId = userId;

    if (!resolvedUserId && clerkUserId) {
      // Resolve DB user id from clerkUserId
      const userResult = await sql`SELECT id FROM users WHERE clerk_user_id = ${clerkUserId}`;
      if (userResult.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'User not found for provided clerkUserId' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      resolvedUserId = userResult[0].id;
    }

    if (!resolvedUserId) {
      return new Response(
        JSON.stringify({ success: false, error: 'userId or clerkUserId is required as query parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await sql`
      SELECT tp.*
      FROM transporter_profiles tp
      WHERE tp.user_id = ${resolvedUserId}
      LIMIT 1
    `;

    if (result.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Transporter profile not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Transporter profile fetched successfully');
    return new Response(
      JSON.stringify({ success: true, data: result[0] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching transporter profile:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

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

// PUT handler - Update transporter availability/location (and optionally profile fields)
export async function PUT(request: Request) {
  try {
    console.log('🔍 API endpoint called - PUT /user/transporter-profile');
    const body = await request.json();
    console.log('📝 Request body:', body);

    const {
      userId,
      is_available,
      current_latitude,
      current_longitude,
      vehicleType,
      vehicleNumber,
      licenseNumber,
      vehicleCapacityKg,
      serviceAreas,
    } = body || {};

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'userId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build dynamic update map
    const updateMap: Record<string, any> = {};
    if (typeof is_available === 'boolean') updateMap.is_available = is_available;
    if (typeof current_latitude === 'number') updateMap.current_latitude = current_latitude;
    if (typeof current_longitude === 'number') updateMap.current_longitude = current_longitude;
    if (typeof vehicleType === 'string' && vehicleType.trim() !== '') updateMap.vehicle_type = vehicleType;
    if (typeof vehicleNumber === 'string' && vehicleNumber.trim() !== '') updateMap.vehicle_number = vehicleNumber;
    if (typeof licenseNumber === 'string' && licenseNumber.trim() !== '') updateMap.license_number = licenseNumber;
    if (typeof vehicleCapacityKg === 'number') updateMap.vehicle_capacity_kg = vehicleCapacityKg;
    if (Array.isArray(serviceAreas)) updateMap.service_areas = serviceAreas;

    if (Object.keys(updateMap).length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No valid fields to update' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build dynamic update query manually since Neon doesn't support dynamic SQL objects
    let queryParts = [];
    let values = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(updateMap)) {
      queryParts.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
    
    const setClause = queryParts.join(', ');
    values.push(userId); // Add userId as last parameter
    
    const result = await sql.query(`
      UPDATE transporter_profiles
      SET ${setClause}, updated_at = NOW()
      WHERE user_id = $${paramIndex}
      RETURNING *
    `, values);

    if (result.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Transporter profile not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Transporter profile updated successfully');
    return new Response(
      JSON.stringify({ success: true, data: result[0], message: 'Profile updated successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating transporter profile:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}