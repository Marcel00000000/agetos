import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const rows = await sql`
      SELECT 
        po.*,
        p.product_name,
        p.sku,
        p.current_estimated_date,
        p.original_release_date,
        p.status as product_status
      FROM pre_orders po
      JOIN products p ON po.product_id = p.id
      WHERE po.user_id = ${userId}
      ORDER BY po.created_at DESC
    `;

    return Response.json({ preOrders: rows });
  } catch (err) {
    console.error("GET /api/pre-orders error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const {
      product_id,
      customer_email,
      customer_name,
      customer_phone,
      order_number,
      quantity = 1,
    } = body;

    if (!product_id || !customer_email || !customer_name) {
      return Response.json(
        {
          error: "Product ID, customer email, and customer name are required",
        },
        { status: 400 },
      );
    }

    // Verify product belongs to user
    const productCheck = await sql`
      SELECT id FROM products WHERE id = ${product_id} AND user_id = ${userId}
    `;

    if (productCheck.length === 0) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    const result = await sql`
      INSERT INTO pre_orders (
        user_id, product_id, customer_email, customer_name, 
        customer_phone, order_number, quantity
      )
      VALUES (
        ${userId}, ${product_id}, ${customer_email}, ${customer_name},
        ${customer_phone}, ${order_number}, ${quantity}
      )
      RETURNING *
    `;

    return Response.json({ preOrder: result[0] });
  } catch (err) {
    console.error("POST /api/pre-orders error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const {
      id,
      customer_email,
      customer_name,
      customer_phone,
      order_number,
      quantity,
      status,
    } = body;

    if (!id) {
      return Response.json(
        { error: "Pre-order ID is required" },
        { status: 400 },
      );
    }

    const setClauses = [];
    const values = [];
    let paramCount = 1;

    if (customer_email !== undefined) {
      setClauses.push(`customer_email = $${paramCount}`);
      values.push(customer_email);
      paramCount++;
    }
    if (customer_name !== undefined) {
      setClauses.push(`customer_name = $${paramCount}`);
      values.push(customer_name);
      paramCount++;
    }
    if (customer_phone !== undefined) {
      setClauses.push(`customer_phone = $${paramCount}`);
      values.push(customer_phone);
      paramCount++;
    }
    if (order_number !== undefined) {
      setClauses.push(`order_number = $${paramCount}`);
      values.push(order_number);
      paramCount++;
    }
    if (quantity !== undefined) {
      setClauses.push(`quantity = $${paramCount}`);
      values.push(quantity);
      paramCount++;
    }
    if (status !== undefined) {
      setClauses.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (setClauses.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    setClauses.push(`updated_at = NOW()`);

    const query = `
      UPDATE pre_orders 
      SET ${setClauses.join(", ")}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await sql(query, [...values, id, userId]);

    if (result.length === 0) {
      return Response.json({ error: "Pre-order not found" }, { status: 404 });
    }

    return Response.json({ preOrder: result[0] });
  } catch (err) {
    console.error("PUT /api/pre-orders error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
