import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import Stripe from "stripe";

export async function GET() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user profile
    const profileRows = await sql`
      SELECT 
        stripe_customer_id,
        stripe_subscription_id,
        subscription_status,
        plan_type
      FROM user_profiles
      WHERE user_id = ${userId}
    `;

    if (profileRows.length === 0) {
      return Response.json({
        status: "inactive",
        plan: "free",
      });
    }

    const profile = profileRows[0];

    // If we have a Stripe customer ID, check with Stripe
    if (profile.stripe_customer_id) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          status: "active",
          limit: 1,
        });

        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0];

          // Determine plan from subscription
          let planType = "pro";
          const amount = subscription.items.data[0]?.price?.unit_amount || 0;
          if (amount >= 9999) {
            planType = "enterprise";
          }

          // Update database if status changed
          if (
            profile.subscription_status !== subscription.status ||
            profile.plan_type !== planType ||
            profile.stripe_subscription_id !== subscription.id
          ) {
            await sql`
              UPDATE user_profiles
              SET 
                subscription_status = ${subscription.status},
                plan_type = ${planType},
                stripe_subscription_id = ${subscription.id},
                updated_at = NOW()
              WHERE user_id = ${userId}
            `;
          }

          return Response.json({
            status: subscription.status,
            plan: planType,
            currentPeriodEnd: subscription.current_period_end,
          });
        }
      } catch (error) {
        console.error("Error fetching from Stripe:", error);
      }
    }

    // Return database status if no active Stripe subscription
    return Response.json({
      status: profile.subscription_status || "inactive",
      plan: profile.plan_type || "free",
    });
  } catch (err) {
    console.error("GET /api/subscription/status error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
