import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import Stripe from "stripe";

export async function POST(request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const email = session.user.email;
    const body = await request.json();
    const { plan, redirectURL } = body;

    if (!plan) {
      return Response.json({ error: "Plan is required" }, { status: 400 });
    }

    // Get price data based on plan
    const getPriceData = (planName) => {
      switch (planName.toLowerCase()) {
        case "professional":
          return {
            currency: "usd",
            product_data: {
              name: "Professional Plan - Pre-Order Communication",
            },
            recurring: { interval: "month" },
            unit_amount: 4999, // $49.99
          };
        case "enterprise":
          return {
            currency: "usd",
            product_data: { name: "Enterprise Plan - Pre-Order Communication" },
            recurring: { interval: "month" },
            unit_amount: 14999, // $149.99
          };
        default:
          return null;
      }
    };

    const priceData = getPriceData(plan);
    if (!priceData) {
      return Response.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Get or create Stripe customer
    const profileRows = await sql`
      SELECT stripe_customer_id FROM user_profiles WHERE user_id = ${userId}
    `;

    let stripeCustomerId = profileRows[0]?.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ email });
      stripeCustomerId = customer.id;

      await sql`
        UPDATE user_profiles 
        SET stripe_customer_id = ${stripeCustomerId}
        WHERE user_id = ${userId}
      `;
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: priceData,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${redirectURL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: redirectURL,
      metadata: {
        userId,
        plan,
      },
    });

    return Response.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("POST /api/stripe-checkout error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
