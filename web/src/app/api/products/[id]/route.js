import sql from "@/app/api/utils/sql";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return Response.json({ error: "Invalid product ID" }, { status: 400 });
    }

    // Get product with owner info for public viewing
    const [product] = await sql`
      SELECT 
        p.*,
        up.store_name,
        up.store_email,
        up.stripe_account_enabled
      FROM products p
      JOIN user_profiles up ON p.user_id = up.user_id
      WHERE p.id = ${parseInt(id)}
    `;

    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    // Only show publicly available products
    if (product.status !== "pre_order") {
      return Response.json({ error: "Product not available" }, { status: 404 });
    }

    return Response.json({
      product: {
        id: product.id,
        product_name: product.product_name,
        sku: product.sku,
        description: product.description,
        price: parseFloat(product.price),
        original_release_date: product.original_release_date,
        current_estimated_date: product.current_estimated_date,
        status: product.status,
        store_name: product.store_name,
        store_email: product.store_email,
        payment_enabled: product.stripe_account_enabled,
      },
    });
  } catch (error) {
    console.error("GET /api/products/[id] error:", error);
    return Response.json(
      {
        error: "Failed to fetch product",
      },
      { status: 500 },
    );
  }
}
