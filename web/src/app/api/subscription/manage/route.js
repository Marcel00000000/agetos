import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { action } = body; // 'create_portal_session', 'cancel_subscription'

    // Get user's stripe customer ID
    const profileRows = await sql`
      SELECT stripe_customer_id, stripe_subscription_id 
      FROM user_profiles 
      WHERE user_id = ${userId}
    `;

    if (profileRows.length === 0) {
      return Response.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    const { stripe_customer_id, stripe_subscription_id } = profileRows[0];

    if (!stripe_customer_id) {
      return Response.json(
        { error: "No Stripe customer found" },
        { status: 400 },
      );
    }

    switch (action) {
      case "create_portal_session": {
        // Create Stripe Customer Portal session
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: stripe_customer_id,
          return_url: `${process.env.APP_URL}/dashboard/billing`,
        });

        return Response.json({ url: portalSession.url });
      }

      case "cancel_subscription": {
        if (!stripe_subscription_id) {
          return Response.json(
            { error: "No active subscription found" },
            { status: 400 },
          );
        }

        // Cancel subscription at period end
        const subscription = await stripe.subscriptions.update(
          stripe_subscription_id,
          {
            cancel_at_period_end: true,
          },
        );

        return Response.json({
          success: true,
          message:
            "Subscription will be canceled at the end of the billing period",
          cancel_at: subscription.cancel_at,
        });
      }

      case "reactivate_subscription": {
        if (!stripe_subscription_id) {
          return Response.json(
            { error: "No subscription found" },
            { status: 400 },
          );
        }

        // Reactivate subscription
        const subscription = await stripe.subscriptions.update(
          stripe_subscription_id,
          {
            cancel_at_period_end: false,
          },
        );

        return Response.json({
          success: true,
          message: "Subscription reactivated successfully",
        });
      }

      default:
        return Response.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (err) {
    console.error("POST /api/subscription/manage error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Get subscription details
export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's subscription details
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
      return Response.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    const profile = profileRows[0];

    // If user has a Stripe subscription, get details from Stripe
    if (profile.stripe_subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve(
          profile.stripe_subscription_id,
        );

        return Response.json({
          subscription: {
            id: subscription.id,
            status: subscription.status,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            cancel_at_period_end: subscription.cancel_at_period_end,
            canceled_at: subscription.canceled_at,
            plan_amount: subscription.items.data[0]?.price?.unit_amount || 0,
            plan_currency: subscription.items.data[0]?.price?.currency || "usd",
            plan_interval:
              subscription.items.data[0]?.price?.recurring?.interval || "month",
          },
          profile: {
            plan_type: profile.plan_type,
            subscription_status: profile.subscription_status,
          },
        });
      } catch (stripeError) {
        console.error("Error fetching subscription from Stripe:", stripeError);
        // Return local data if Stripe fails
        return Response.json({
          subscription: null,
          profile: {
            plan_type: profile.plan_type,
            subscription_status: profile.subscription_status,
          },
        });
      }
    }

    // User has no Stripe subscription
    return Response.json({
      subscription: null,
      profile: {
        plan_type: profile.plan_type,
        subscription_status: profile.subscription_status,
      },
    });
  } catch (err) {
    console.error("GET /api/subscription/manage error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
