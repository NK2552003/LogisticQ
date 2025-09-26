import { neon } from '@neondatabase/serverless';

const sql = neon(`${process.env.DATABASE_URL}`);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    const available = url.searchParams.get('available');

    let query;
    
    if (role === 'transporter' && available === 'true') {
      // Get available drivers/transporters
      query = sql`
        SELECT 
          u.*,
          tp.vehicle_type,
          tp.vehicle_number,
          tp.license_number,
          tp.is_verified,
          tp.current_latitude,
          tp.current_longitude,
          tp.is_available,
          AVG(r.rating) as average_rating,
          COUNT(r.id) as total_ratings
        FROM users u
        JOIN transporter_profiles tp ON u.id = tp.user_id
        LEFT JOIN ratings r ON u.id = r.transporter_id
        WHERE u.role = 'transporter' 
          AND tp.is_available = true 
          AND tp.is_verified = true
        GROUP BY u.id, tp.vehicle_type, tp.vehicle_number, 
                 tp.license_number, tp.is_verified, tp.current_latitude, 
                 tp.current_longitude, tp.is_available
        ORDER BY average_rating DESC NULLS LAST
      `;
    } else if (role) {
      // Get users by role
      query = sql`
        SELECT 
          u.*,
          CASE 
            WHEN u.role = 'customer' THEN cp.company_name
            WHEN u.role = 'business' THEN bp.company_name
            WHEN u.role = 'transporter' THEN tp.vehicle_type
          END as additional_info
        FROM users u
        LEFT JOIN customer_profiles cp ON u.id = cp.user_id AND u.role = 'customer'
        LEFT JOIN business_profiles bp ON u.id = bp.user_id AND u.role = 'business'
        LEFT JOIN transporter_profiles tp ON u.id = tp.user_id AND u.role = 'transporter'
        WHERE u.role = ${role}
        ORDER BY u.created_at DESC
      `;
    } else {
      // Get all users
      query = sql`
        SELECT 
          u.*,
          CASE 
            WHEN u.role = 'customer' THEN cp.company_name
            WHEN u.role = 'business' THEN bp.company_name
            WHEN u.role = 'transporter' THEN tp.vehicle_type
          END as additional_info
        FROM users u
        LEFT JOIN customer_profiles cp ON u.id = cp.user_id AND u.role = 'customer'
        LEFT JOIN business_profiles bp ON u.id = bp.user_id AND u.role = 'business'
        LEFT JOIN transporter_profiles tp ON u.id = tp.user_id AND u.role = 'transporter'
        ORDER BY u.created_at DESC
      `;
    }

    const users = await query;
    return Response.json({ success: true, data: users });
  } catch (error) {
    console.error('Users API error:', error);
    return Response.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { userId, updates } = await request.json();

    if (!userId) {
      return Response.json({ success: false, error: 'User ID required' }, { status: 400 });
    }

    // Build dynamic update query
    const updateFields = Object.keys(updates);
    const updateValues = Object.values(updates);
    const setClause = updateFields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    updateValues.push(userId); // Add userId as the last parameter
    
    const result = await sql.query(`
      UPDATE users 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${updateValues.length}
      RETURNING *
    `, updateValues);

    return Response.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Users PUT error:', error);
    return Response.json({ success: false, error: 'Failed to update user' }, { status: 500 });
  }
}