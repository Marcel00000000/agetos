import sql from "@/app/api/utils/sql";
import { sendEmail } from "@/app/api/utils/send-email";
import Stripe from "stripe";

export async function POST(request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const body = await request.json();
    const {
      product_id,
      customer_email,
      customer_name,
      customer_phone,
      quantity = 1,
      success_url,
      cancel_url,
    } = body;

    if (!product_id || !customer_email) {
      return Response.json(
        {
          error: "Product ID and customer email are required",
        },
        { status: 400 },
      );
    }

    // Get product and seller info
    const [product] = await sql`
      SELECT 
        p.*, 
        up.stripe_account_id, 
        up.stripe_account_enabled,
        up.user_id
      FROM products p
      JOIN user_profiles up ON p.user_id = up.user_id
      WHERE p.id = ${product_id}
    `;

    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    if (!product.stripe_account_id || !product.stripe_account_enabled) {
      return Response.json(
        {
          error: "Seller has not completed payment setup",
        },
        { status: 400 },
      );
    }

    if (!product.price) {
      return Response.json(
        {
          error: "Product price not set",
        },
        { status: 400 },
      );
    }

    const totalAmount = Math.round(product.price * quantity * 100); // Convert to cents
    const platformFeeAmount = Math.round(totalAmount * 0.05); // 5% platform fee
    const applicationFeeAmount = platformFeeAmount;

    // Create checkout session with Connect
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Pre-Order: ${product.product_name}`,
              description:
                product.description || `Pre-order for ${product.product_name}`,
            },
            unit_amount: Math.round(product.price * 100),
          },
          quantity: quantity,
        },
      ],
      mode: "payment",
      success_url:
        success_url ||
        `${process.env.APP_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${process.env.APP_URL}/products/${product_id}`,
      customer_email: customer_email,
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: product.stripe_account_id,
        },
      },
      metadata: {
        product_id: product_id.toString(),
        customer_email,
        customer_name: customer_name || "",
        customer_phone: customer_phone || "",
        quantity: quantity.toString(),
        seller_user_id: product.user_id,
      },
    });

    return Response.json({
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    console.error("Pre-order checkout error:", error);
    return Response.json(
      {
        error: "Failed to create checkout session",
      },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  const url = new URL(request.url);
  const session_id = url.searchParams.get("session_id");

  if (!session_id) {
    return Response.json({ error: "Session ID required" }, { status: 400 });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid") {
      // Create pre-order record
      const metadata = session.metadata;

      // Get product and store info
      const [product] = await sql`
        SELECT 
          p.*, 
          up.store_name,
          up.store_email
        FROM products p
        JOIN user_profiles up ON p.user_id = up.user_id
        WHERE p.id = ${parseInt(metadata.product_id)}
      `;

      const [preOrder] = await sql`
        INSERT INTO pre_orders (
          user_id,
          product_id,
          customer_email,
          customer_name,
          customer_phone,
          quantity,
          payment_amount,
          payment_status,
          stripe_payment_intent_id,
          order_number
        ) VALUES (
          ${metadata.seller_user_id},
          ${parseInt(metadata.product_id)},
          ${metadata.customer_email},
          ${metadata.customer_name},
          ${metadata.customer_phone},
          ${parseInt(metadata.quantity)},
          ${session.amount_total / 100},
          'completed',
          ${session.payment_intent},
          ${session.id}
        ) RETURNING *
      `;

      // Send confirmation email
      try {
        const confirmationHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px;">
              <h1 style="color: #4f46e5; margin: 0;">${product?.store_name || "Pre-Order Confirmation"}</h1>
            </div>
            
            <div style="background-color: #f0fdf4; border: 2px solid #16a34a; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
              <h2 style="color: #16a34a; margin: 0 0 10px 0;">✅ Pre-Order Confirmed!</h2>
              <p style="color: #15803d; margin: 0; font-size: 18px;">Thank you for your purchase!</p>
            </div>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #1f2937; margin-top: 0;">Order Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px 0; font-weight: bold;">Product:</td>
                  <td style="padding: 8px 0;">${product?.product_name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px 0; font-weight: bold;">Order Number:</td>
                  <td style="padding: 8px 0;">${preOrder.order_number}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px 0; font-weight: bold;">Quantity:</td>
                  <td style="padding: 8px 0;">${preOrder.quantity}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px 0; font-weight: bold;">Total Paid:</td>
                  <td style="padding: 8px 0; color: #16a34a; font-weight: bold;">$${preOrder.payment_amount}</td>
                </tr>
                ${
                  product?.current_estimated_date
                    ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Estimated Delivery:</td>
                  <td style="padding: 8px 0;">${new Date(product.current_estimated_date).toLocaleDateString()}</td>
                </tr>
                `
                    : ""
                }
              </table>
            </div>
            
            <div style="background-color: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h3 style="color: #1d4ed8; margin-top: 0;">What Happens Next?</h3>
              <ol style="color: #1e40af; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">We'll keep you updated via email if there are any changes to the estimated delivery date</li>
                <li style="margin-bottom: 8px;">When your item is ready to ship, you'll receive tracking information</li>
                <li>You can contact us anytime by replying to this email if you have questions</li>
              </ol>
            </div>
            
            ${
              product?.description
                ? `
            <div style="margin-bottom: 30px;">
              <h4 style="color: #1f2937;">About Your Pre-Order:</h4>
              <p style="color: #4b5563; line-height: 1.6;">${product.description}</p>
            </div>
            `
                : ""
            }
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; color: #6b7280; font-size: 14px; text-align: center;">
              <p>Thank you for your patience and support!</p>
              ${product?.store_name ? `<p><strong>${product.store_name}</strong></p>` : ""}
              ${product?.store_email ? `<p>Contact us: ${product.store_email}</p>` : ""}
            </div>
          </div>
        `;

        await sendEmail({
          to: metadata.customer_email,
          from: product?.store_email || "onboarding@resend.dev",
          subject: `Pre-Order Confirmed - ${product?.product_name} (#${preOrder.order_number})`,
          html: confirmationHtml,
          text: `
Pre-Order Confirmation

Thank you for your pre-order of ${product?.product_name}!

Order Details:
- Order Number: ${preOrder.order_number}
- Quantity: ${preOrder.quantity}
- Total Paid: $${preOrder.payment_amount}
${product?.current_estimated_date ? `- Estimated Delivery: ${new Date(product.current_estimated_date).toLocaleDateString()}` : ""}

We'll keep you updated via email about any changes to your order status.

${product?.store_name ? `\n${product.store_name}` : ""}
${product?.store_email ? `Contact: ${product.store_email}` : ""}
          `.trim(),
        });

        console.log(`Confirmation email sent to ${metadata.customer_email}`);
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't fail the whole request if email fails
      }

      return Response.json({
        success: true,
        pre_order: preOrder,
        session,
      });
    } else {
      return Response.json({
        success: false,
        payment_status: session.payment_status,
      });
    }
  } catch (error) {
    console.error("Checkout verification error:", error);
    return Response.json(
      {
        error: "Failed to verify payment",
      },
      { status: 500 },
    );
  }
}
