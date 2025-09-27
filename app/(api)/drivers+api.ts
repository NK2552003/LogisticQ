import { neon } from '@neondatabase/serverless';

// Load environment variables
if (typeof window === 'undefined') {
  require('dotenv').config();
}

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

export async function GET(request: Request) {
  try {
    console.log('🔍 Drivers API endpoint called - GET /drivers');
    
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
    const role = url.searchParams.get('role');
    const available = url.searchParams.get('available');

    console.log('📋 Query parameters:', { role, available });

    let users;
    
    if (role === 'transporter' && available === 'true') {
      // Get available drivers/transporters
      console.log('🔍 Fetching available transporters');
      users = await sql`
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
      console.log('🔍 Fetching users by role:', role);
      users = await sql`
        SELECT 
          u.*,
          CASE 
            WHEN u.role = 'customer' THEN CONCAT(u.first_name, ' ', u.last_name)
            WHEN u.role = 'business' THEN bp.company_name
            WHEN u.role = 'transporter' THEN tp.vehicle_type
          END as additional_info
        FROM users u
        LEFT JOIN business_profiles bp ON u.id = bp.user_id AND u.role = 'business'
        LEFT JOIN transporter_profiles tp ON u.id = tp.user_id AND u.role = 'transporter'
        WHERE u.role = ${role}
        ORDER BY u.created_at DESC
      `;
    } else {
      // Get all users
      console.log('🔍 Fetching all users');
      users = await sql`
        SELECT 
          u.*,
          CASE 
            WHEN u.role = 'customer' THEN CONCAT(u.first_name, ' ', u.last_name)
            WHEN u.role = 'business' THEN bp.company_name
            WHEN u.role = 'transporter' THEN tp.vehicle_type
          END as additional_info
        FROM users u
        LEFT JOIN business_profiles bp ON u.id = bp.user_id AND u.role = 'business'
        LEFT JOIN transporter_profiles tp ON u.id = tp.user_id AND u.role = 'transporter'
        ORDER BY u.created_at DESC
      `;
    }

    // Serialize the data to avoid JSON issues
    const serializedUsers = serializeData(users);
    console.log('✅ Found', users.length, 'users');

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
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
      }
    );
  }
}

export async function PUT(request: Request) {
  try {
    console.log('🔍 Drivers API endpoint called - PUT /drivers');
    
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

    const { userId, updates } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User ID required' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!updates || Object.keys(updates).length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No updates provided' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('📝 Updating user:', userId, updates);

    // Handle single field updates with proper neon SQL templates
    const updateFields = Object.keys(updates);
    let result;

    if (updateFields.includes('first_name') && updateFields.length === 1) {
      result = await sql`
        UPDATE users 
        SET first_name = ${updates.first_name}, updated_at = NOW()
        WHERE id = ${userId}
        RETURNING *
      `;
    } else if (updateFields.includes('last_name') && updateFields.length === 1) {
      result = await sql`
        UPDATE users 
        SET last_name = ${updates.last_name}, updated_at = NOW()
        WHERE id = ${userId}
        RETURNING *
      `;
    } else if (updateFields.includes('email') && updateFields.length === 1) {
      result = await sql`
        UPDATE users 
        SET email = ${updates.email}, updated_at = NOW()
        WHERE id = ${userId}
        RETURNING *
      `;
    } else if (updateFields.includes('phone') && updateFields.length === 1) {
      result = await sql`
        UPDATE users 
        SET phone = ${updates.phone}, updated_at = NOW()
        WHERE id = ${userId}
        RETURNING *
      `;
    } else if (updateFields.includes('address') && updateFields.length === 1) {
      result = await sql`
        UPDATE users 
        SET address = ${updates.address}, updated_at = NOW()
        WHERE id = ${userId}
        RETURNING *
      `;
    } else {
      // For complex updates, return error for now
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Complex field updates not supported in this version',
          supportedSingleFields: ['first_name', 'last_name', 'email', 'phone', 'address']
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

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

    const serializedResult = serializeData(result[0]);
    console.log('✅ User updated successfully:', serializedResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: serializedResult,
        message: 'User updated successfully'
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
    console.error('❌ Users PUT error:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to update user',
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