import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const limit = parseInt(url.searchParams.get("limit")) || 50;
    const offset = parseInt(url.searchParams.get("offset")) || 0;

    // Get all public pre-order products with store info
    let query = `
      SELECT 
        p.id,
        p.product_name,
        p.sku,
        p.description,
        p.price,
        p.original_release_date,
        p.current_estimated_date,
        p.status,
        p.created_at,
        up.store_name,
        up.store_email,
        up.stripe_account_enabled
      FROM products p
      JOIN user_profiles up ON p.user_id = up.user_id
      WHERE p.status = 'pre_order' 
        AND p.price IS NOT NULL 
        AND p.price > 0
        AND up.stripe_account_enabled = true
    `;

    const queryParams = [];
    let paramIndex = 1;

    // Add search filter if provided
    if (search) {
      query += ` AND (
        LOWER(p.product_name) LIKE LOWER($${paramIndex}) 
        OR LOWER(p.description) LIKE LOWER($${paramIndex})
        OR LOWER(up.store_name) LIKE LOWER($${paramIndex})
      )`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Order by newest first
    query += ` ORDER BY p.created_at DESC`;

    // Add pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const products = await sql(query, queryParams);

    // Also get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      JOIN user_profiles up ON p.user_id = up.user_id
      WHERE p.status = 'pre_order' 
        AND p.price IS NOT NULL 
        AND p.price > 0
        AND up.stripe_account_enabled = true
    `;

    const countParams = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND (
        LOWER(p.product_name) LIKE LOWER($${countParamIndex}) 
        OR LOWER(p.description) LIKE LOWER($${countParamIndex})
        OR LOWER(up.store_name) LIKE LOWER($${countParamIndex})
      )`;
      countParams.push(`%${search}%`);
    }

    const [{ total }] = await sql(countQuery, countParams);

    // Clean up product data for public consumption
    const publicProducts = products.map((product) => ({
      id: product.id,
      product_name: product.product_name,
      sku: product.sku,
      description: product.description,
      price: parseFloat(product.price),
      original_release_date: product.original_release_date,
      current_estimated_date: product.current_estimated_date,
      status: product.status,
      created_at: product.created_at,
      store_name: product.store_name,
      payment_enabled: product.stripe_account_enabled,
    }));

    return Response.json({
      products: publicProducts,
      pagination: {
        total: parseInt(total),
        limit,
        offset,
        hasMore: offset + limit < parseInt(total),
      },
    });
  } catch (error) {
    console.error("GET /api/browse-products error:", error);
    return Response.json(
      {
        error: "Failed to fetch products",
      },
      { status: 500 },
    );
  }
}
