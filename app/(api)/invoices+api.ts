import { neon } from '@neondatabase/serverless';

const sql = neon(`${process.env.DATABASE_URL}`);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const clerkUserId = url.searchParams.get('clerkUserId');
    const orderId = url.searchParams.get('orderId');

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

    // Create invoices table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES shipments(id),
        customer_id UUID REFERENCES users(id),
        invoice_number VARCHAR(100) UNIQUE NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
        due_date DATE,
        paid_date TIMESTAMP WITH TIME ZONE,
        payment_method VARCHAR(100),
        items JSONB,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    let invoices;
    if (orderId) {
      // Get specific invoice for order
      invoices = await sql`
        SELECT 
          i.*,
          s.order_number,
          s.pickup_address,
          s.delivery_address,
          s.package_details,
          cu.first_name || ' ' || cu.last_name as customer_name,
          cu.email as customer_email,
          cu.phone as customer_phone,
          bp.company_name,
          bp.business_address,
          bp.gst_number
        FROM invoices i
        LEFT JOIN shipments s ON i.order_id = s.id
        LEFT JOIN users cu ON i.customer_id = cu.id
        LEFT JOIN business_profiles bp ON cu.id = bp.user_id
        WHERE i.order_id = ${orderId}
        AND (i.customer_id = ${user.id} OR s.driver_id = ${user.id})
      `;
    } else {
      // Get all invoices for user
      if (user.role === 'transporter') {
        invoices = await sql`
          SELECT 
            i.*,
            s.order_number,
            cu.first_name || ' ' || cu.last_name as customer_name,
            bp.company_name
          FROM invoices i
          LEFT JOIN shipments s ON i.order_id = s.id
          LEFT JOIN users cu ON i.customer_id = cu.id
          LEFT JOIN business_profiles bp ON cu.id = bp.user_id
          WHERE s.driver_id = ${user.id}
          ORDER BY i.created_at DESC
        `;
      } else {
        invoices = await sql`
          SELECT 
            i.*,
            s.order_number,
            s.pickup_address,
            s.delivery_address,
            du.first_name || ' ' || du.last_name as driver_name
          FROM invoices i
          LEFT JOIN shipments s ON i.order_id = s.id
          LEFT JOIN users du ON s.driver_id = du.id
          WHERE i.customer_id = ${user.id}
          ORDER BY i.created_at DESC
        `;
      }
    }

    return new Response(
      JSON.stringify({ invoices }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching invoices:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch invoices' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      order_id, 
      customer_id, 
      amount, 
      tax_rate = 0.1, 
      due_days = 30,
      items,
      notes 
    } = body;

    if (!order_id || !customer_id || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate invoice number
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    
    // Calculate totals
    const tax_amount = amount * tax_rate;
    const total_amount = amount + tax_amount;
    
    // Calculate due date
    const due_date = new Date();
    due_date.setDate(due_date.getDate() + due_days);

    const result = await sql`
      INSERT INTO invoices (
        order_id,
        customer_id,
        invoice_number,
        amount,
        tax_amount,
        total_amount,
        due_date,
        items,
        notes,
        status
      ) VALUES (
        ${order_id},
        ${customer_id},
        ${invoiceNumber},
        ${amount},
        ${tax_amount},
        ${total_amount},
        ${due_date.toISOString().split('T')[0]},
        ${JSON.stringify(items || [])},
        ${notes || ''},
        'pending'
      )
      RETURNING *
    `;

    return new Response(
      JSON.stringify({ success: true, invoice: result[0] }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating invoice:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create invoice' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { invoice_id, status, payment_method, paid_date } = body;

    if (!invoice_id) {
      return new Response(
        JSON.stringify({ error: 'Invoice ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await sql`
      UPDATE invoices 
      SET 
        status = ${status},
        payment_method = ${payment_method || null},
        paid_date = ${paid_date || (status === 'paid' ? new Date().toISOString() : null)},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${invoice_id}
      RETURNING *
    `;

    if (result.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invoice not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, invoice: result[0] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error updating invoice:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update invoice' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}