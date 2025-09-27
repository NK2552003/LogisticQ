import { neon } from '@neondatabase/serverless';

// Initialize Neon database connection
const sql = neon(`${process.env.DATABASE_URL}`);

// Helper function to serialize data
const serializeData = (data: any) => {
  return JSON.parse(JSON.stringify(data, (key, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  }));
};

// GET handler - Fetch all users with location data
export async function GET(request: Request) {
  try {
    console.log('🔍 API endpoint called - GET /users');
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    const includeLocation = url.searchParams.get('includeLocation') === 'true';

    console.log('🔍 Fetching users with params:', { role, includeLocation });

    let users;
    
    if (includeLocation) {
      // Fetch users with their location data for map display
      users = await sql`
        SELECT 
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          u.role,
          u.profile_completed,
          u.created_at,
          u.updated_at,
          -- Business profile data
          bp.company_name,
          bp.business_type,
          bp.address as business_address,
          bp.phone as business_phone,
          -- Transporter profile data with location
          tp.vehicle_type,
          tp.vehicle_number,
          tp.license_number,
          tp.current_latitude,
          tp.current_longitude,
          tp.is_available,
          tp.is_verified,
          -- Customer profile data
          cp.phone as customer_phone,
          cp.address as customer_address,
          cp.date_of_birth,
          -- Additional computed data
          CASE 
            WHEN u.role = 'customer' THEN CONCAT(u.first_name, ' ', u.last_name)
            WHEN u.role = 'business' THEN bp.company_name
            WHEN u.role = 'transporter' THEN CONCAT(u.first_name, ' ', u.last_name, ' (', tp.vehicle_type, ')')
            WHEN u.role = 'admin' THEN CONCAT(u.first_name, ' ', u.last_name, ' (Admin)')
          END as display_name,
          CASE 
            WHEN u.role = 'transporter' AND tp.current_latitude IS NOT NULL AND tp.current_longitude IS NOT NULL 
            THEN 'active'
            WHEN u.role = 'business' OR u.role = 'customer' OR u.role = 'admin'
            THEN 'completed'
            ELSE 'pending'
          END as location_status
        FROM users u
        LEFT JOIN business_profiles bp ON u.id = bp.user_id
        LEFT JOIN transporter_profiles tp ON u.id = tp.user_id  
        LEFT JOIN customer_profiles cp ON u.id = cp.user_id
        ${role ? sql`WHERE u.role = ${role}` : sql``}
        ORDER BY u.created_at DESC
      `;
    } else {
      // Regular user fetch without detailed location data
      users = await sql`
        SELECT 
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          u.role,
          u.profile_completed,
          u.created_at,
          u.updated_at,
          -- Basic profile info
          bp.company_name,
          tp.vehicle_type,
          cp.phone,
          CASE 
            WHEN u.role = 'customer' THEN CONCAT(u.first_name, ' ', u.last_name)
            WHEN u.role = 'business' THEN bp.company_name
            WHEN u.role = 'transporter' THEN CONCAT(u.first_name, ' ', u.last_name)
            WHEN u.role = 'admin' THEN CONCAT(u.first_name, ' ', u.last_name, ' (Admin)')
          END as display_name
        FROM users u
        LEFT JOIN business_profiles bp ON u.id = bp.user_id
        LEFT JOIN transporter_profiles tp ON u.id = tp.user_id  
        LEFT JOIN customer_profiles cp ON u.id = cp.user_id
        ${role ? sql`WHERE u.role = ${role}` : sql``}
        ORDER BY u.created_at DESC
      `;
    }

    // Serialize the data to avoid JSON issues
    const serializedUsers = serializeData(users);
    console.log('✅ Found', users.length, 'users');
    console.log('📊 Sample user data:', serializedUsers[0]);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: serializedUsers,
        count: users.length
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
    console.error('❌ Users API error:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
}

// POST handler - Admin bulk user operations
export async function POST(request: Request) {
  try {
    console.log('🔍 API endpoint called - POST /users');
    const body = await request.json();
    const { action, userIds, data } = body;

    console.log('📝 Bulk operation request:', { action, userIds: userIds?.length, data });

    switch (action) {
      case 'update_status':
        if (!userIds || !data?.status) {
          return new Response(
            JSON.stringify({ error: 'User IDs and status are required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const updatedUsers = await sql`
          UPDATE users 
          SET profile_completed = ${data.status === 'active'}, updated_at = NOW()
          WHERE id = ANY(${userIds})
          RETURNING id, email, first_name, last_name, role, profile_completed
        `;

        return new Response(
          JSON.stringify({ 
            success: true, 
            data: serializeData(updatedUsers),
            message: `Updated ${updatedUsers.length} users`
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

      case 'delete':
        if (!userIds) {
          return new Response(
            JSON.stringify({ error: 'User IDs are required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const deletedUsers = await sql`
          DELETE FROM users 
          WHERE id = ANY(${userIds})
          RETURNING id, email, first_name, last_name
        `;

        return new Response(
          JSON.stringify({ 
            success: true, 
            data: serializeData(deletedUsers),
            message: `Deleted ${deletedUsers.length} users`
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('❌ Users bulk operation error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to perform bulk operation',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}