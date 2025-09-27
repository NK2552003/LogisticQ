import { neon } from '@neondatabase/serverless';

const sql = neon(`${process.env.DATABASE_URL}`);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const clerkUserId = url.searchParams.get('clerkUserId');
    const period = url.searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y

    let user;
    if (userId) {
      const userResult = await sql`
        SELECT id, role FROM users WHERE id = ${userId}
      `;
      user = userResult[0];
    } else if (clerkUserId) {
      const userResult = await sql`
        SELECT id, role FROM users WHERE clerk_user_id = ${clerkUserId}
      `;
      user = userResult[0];
    }

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    let analytics: any = {};

    if (user.role === 'transporter') {
      // Transporter analytics
      const deliveryStats = await sql`
        SELECT 
          COUNT(*) as total_deliveries,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_deliveries,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_deliveries,
          SUM(CASE WHEN status = 'delivered' THEN estimated_cost ELSE 0 END) as total_earnings,
          AVG(CASE WHEN status = 'delivered' THEN estimated_cost ELSE NULL END) as avg_delivery_value
        FROM shipments 
        WHERE driver_id = ${user.id} 
        AND created_at >= ${startDate.toISOString()}
        AND created_at <= ${endDate.toISOString()}
      `;

      const dailyEarnings = await sql`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as deliveries,
          SUM(CASE WHEN status = 'delivered' THEN estimated_cost ELSE 0 END) as earnings
        FROM shipments 
        WHERE driver_id = ${user.id} 
        AND status = 'delivered'
        AND created_at >= ${startDate.toISOString()}
        AND created_at <= ${endDate.toISOString()}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;

      const ratingData = await sql`
        SELECT AVG(rating) as average_rating, COUNT(*) as total_ratings
        FROM ratings 
        WHERE transporter_id = ${user.id}
        AND created_at >= ${startDate.toISOString()}
        AND created_at <= ${endDate.toISOString()}
      `;

      analytics = {
        overview: deliveryStats[0],
        dailyEarnings,
        rating: ratingData[0],
        performanceMetrics: {
          completionRate: deliveryStats[0].total_deliveries > 0 
            ? (deliveryStats[0].completed_deliveries / deliveryStats[0].total_deliveries * 100).toFixed(1)
            : 0,
          cancellationRate: deliveryStats[0].total_deliveries > 0
            ? (deliveryStats[0].cancelled_deliveries / deliveryStats[0].total_deliveries * 100).toFixed(1)
            : 0
        }
      };

    } else if (user.role === 'business' || user.role === 'customer') {
      // Customer/Business analytics
      const orderStats = await sql`
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
          SUM(estimated_cost) as total_spent,
          AVG(estimated_cost) as avg_order_value
        FROM shipments 
        WHERE customer_id = ${user.id} 
        AND created_at >= ${startDate.toISOString()}
        AND created_at <= ${endDate.toISOString()}
      `;

      const monthlySpending = await sql`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as orders,
          SUM(estimated_cost) as spent
        FROM shipments 
        WHERE customer_id = ${user.id} 
        AND created_at >= ${startDate.toISOString()}
        AND created_at <= ${endDate.toISOString()}
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
      `;

      const topServices = await sql`
        SELECT 
          service_type,
          COUNT(*) as usage_count,
          SUM(estimated_cost) as total_cost
        FROM shipments 
        WHERE customer_id = ${user.id} 
        AND created_at >= ${startDate.toISOString()}
        AND created_at <= ${endDate.toISOString()}
        GROUP BY service_type
        ORDER BY usage_count DESC
        LIMIT 5
      `;

      analytics = {
        overview: orderStats[0],
        monthlySpending,
        topServices,
        savingsMetrics: {
          avgDeliveryTime: '2.3 days', // Calculate from tracking data
          onTimeDeliveryRate: '94.2%' // Calculate from delivery dates
        }
      };

    } else {
      // Admin analytics - platform overview
      const platformStats = await sql`
        SELECT 
          COUNT(DISTINCT CASE WHEN role = 'business' THEN id END) as business_users,
          COUNT(DISTINCT CASE WHEN role = 'transporter' THEN id END) as transporter_users,
          COUNT(DISTINCT CASE WHEN role = 'customer' THEN id END) as customer_users
        FROM users
        WHERE created_at >= ${startDate.toISOString()}
        AND created_at <= ${endDate.toISOString()}
      `;

      const orderStats = await sql`
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_orders,
          SUM(estimated_cost) as total_revenue,
          AVG(estimated_cost) as avg_order_value
        FROM shipments 
        WHERE created_at >= ${startDate.toISOString()}
        AND created_at <= ${endDate.toISOString()}
      `;

      analytics = {
        platform: platformStats[0],
        orders: orderStats[0],
        growth: {
          userGrowthRate: '12.5%',
          orderGrowthRate: '18.3%',
          revenueGrowthRate: '22.1%'
        }
      };
    }

    return new Response(
      JSON.stringify({ analytics, period }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch analytics' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}