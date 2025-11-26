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
    const { refresh_url, return_url } = await request.json();

    // Check if user already has Stripe account
    const [profile] = await sql`
      SELECT stripe_account_id, stripe_account_enabled 
      FROM user_profiles 
      WHERE user_id = ${userId}
    `;

    let accountId = profile?.stripe_account_id;

    // Create Stripe Express account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US", // You can make this dynamic based on user location
        email: session.user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual", // or 'company'
        settings: {
          payouts: {
            schedule: {
              interval: "weekly", // or 'daily', 'monthly'
            },
          },
        },
      });

      accountId = account.id;

      // Save account ID to database
      await sql`
        UPDATE user_profiles 
        SET stripe_account_id = ${accountId}
        WHERE user_id = ${userId}
      `;
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url:
        refresh_url ||
        `${process.env.APP_URL}/dashboard/settings?setup=stripe&refresh=true`,
      return_url:
        return_url ||
        `${process.env.APP_URL}/dashboard/settings?setup=stripe&success=true`,
      type: "account_onboarding",
    });

    return Response.json({
      url: accountLink.url,
      account_id: accountId,
    });
  } catch (error) {
    console.error("Stripe Connect onboard error:", error);
    return Response.json(
      {
        error: "Failed to create Stripe account",
      },
      { status: 500 },
    );
  }
}
