import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import Stripe from "stripe";

export async function GET(request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's Stripe account info
    const [profile] = await sql`
      SELECT stripe_account_id, stripe_account_enabled, stripe_onboarding_completed
      FROM user_profiles 
      WHERE user_id = ${userId}
    `;

    if (!profile?.stripe_account_id) {
      return Response.json({
        connected: false,
        account_id: null,
        details_submitted: false,
        charges_enabled: false,
        payouts_enabled: false,
      });
    }

    // Get account details from Stripe
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);

    // Check if account setup is complete
    const detailsSubmitted = account.details_submitted;
    const chargesEnabled = account.charges_enabled;
    const payoutsEnabled = account.payouts_enabled;

    // Update database if status changed
    if (
      detailsSubmitted !== profile.stripe_onboarding_completed ||
      chargesEnabled !== profile.stripe_account_enabled
    ) {
      await sql`
        UPDATE user_profiles 
        SET 
          stripe_onboarding_completed = ${detailsSubmitted},
          stripe_account_enabled = ${chargesEnabled}
        WHERE user_id = ${userId}
      `;
    }

    return Response.json({
      connected: true,
      account_id: profile.stripe_account_id,
      details_submitted: detailsSubmitted,
      charges_enabled: chargesEnabled,
      payouts_enabled: payoutsEnabled,
      requirements: account.requirements,
      country: account.country,
      default_currency: account.default_currency,
    });
  } catch (error) {
    console.error("Stripe Connect status error:", error);
    return Response.json(
      {
        error: "Failed to check account status",
      },
      { status: 500 },
    );
  }
}
