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
        p.*,
        COUNT(po.id) as pre_order_count,
        SUM(po.quantity) as total_quantity
      FROM products p
      LEFT JOIN pre_orders po ON p.id = po.product_id AND po.status = 'active'
      WHERE p.user_id = ${userId}
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;

    return Response.json({ products: rows });
  } catch (err) {
    console.error("GET /api/products error", err);
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
      product_name,
      sku,
      original_release_date,
      current_estimated_date,
      supplier,
      description,
      price,
    } = body;

    if (!product_name || !original_release_date) {
      return Response.json(
        {
          error: "Product name and original release date are required",
        },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO products (
        user_id, product_name, sku, original_release_date, 
        current_estimated_date, supplier, description, price
      )
      VALUES (
        ${userId}, ${product_name}, ${sku}, ${original_release_date},
        ${current_estimated_date || original_release_date}, ${supplier}, ${description}, ${price}
      )
      RETURNING *
    `;

    return Response.json({ product: result[0] });
  } catch (err) {
    console.error("POST /api/products error", err);
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
      product_name,
      sku,
      original_release_date,
      current_estimated_date,
      status,
      supplier,
      description,
      price,
    } = body;

    if (!id) {
      return Response.json(
        { error: "Product ID is required" },
        { status: 400 },
      );
    }

    const setClauses = [];
    const values = [];
    let paramCount = 1;

    if (product_name !== undefined) {
      setClauses.push(`product_name = $${paramCount}`);
      values.push(product_name);
      paramCount++;
    }
    if (sku !== undefined) {
      setClauses.push(`sku = $${paramCount}`);
      values.push(sku);
      paramCount++;
    }
    if (original_release_date !== undefined) {
      setClauses.push(`original_release_date = $${paramCount}`);
      values.push(original_release_date);
      paramCount++;
    }
    if (current_estimated_date !== undefined) {
      setClauses.push(`current_estimated_date = $${paramCount}`);
      values.push(current_estimated_date);
      paramCount++;
    }
    if (status !== undefined) {
      setClauses.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }
    if (supplier !== undefined) {
      setClauses.push(`supplier = $${paramCount}`);
      values.push(supplier);
      paramCount++;
    }
    if (description !== undefined) {
      setClauses.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }
    if (price !== undefined) {
      setClauses.push(`price = $${paramCount}`);
      values.push(price);
      paramCount++;
    }

    if (setClauses.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    setClauses.push(`updated_at = NOW()`);

    const query = `
      UPDATE products 
      SET ${setClauses.join(", ")}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await sql(query, [...values, id, userId]);

    if (result.length === 0) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    return Response.json({ product: result[0] });
  } catch (err) {
    console.error("PUT /api/products error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
