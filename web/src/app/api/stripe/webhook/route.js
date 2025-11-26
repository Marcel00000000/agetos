import sql from "@/app/api/utils/sql";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  let event;

  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("Missing STRIPE_WEBHOOK_SECRET");
      return Response.json(
        { error: "Webhook secret not configured" },
        { status: 400 },
      );
    }

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error(`Webhook signature verification failed:`, err.message);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Get user by stripe customer ID
        const userRows = await sql`
          SELECT user_id FROM user_profiles WHERE stripe_customer_id = ${customerId}
        `;

        if (userRows.length === 0) {
          console.error(`No user found for customer ${customerId}`);
          return Response.json({ error: "User not found" }, { status: 404 });
        }

        const userId = userRows[0].user_id;
        const status = subscription.status; // active, canceled, incomplete, etc.

        // Determine plan type based on price
        const priceId = subscription.items.data[0]?.price?.id;
        let planType = "free";
        let maxProducts = 50;
        let maxNotifications = 100;

        // You'll need to set these based on your actual Stripe price IDs
        if (subscription.items.data[0]?.price?.unit_amount === 4999) {
          // $49.99
          planType = "professional";
          maxProducts = 500;
          maxNotifications = 2000;
        } else if (subscription.items.data[0]?.price?.unit_amount === 14999) {
          // $149.99
          planType = "enterprise";
          maxProducts = -1; // unlimited
          maxNotifications = 10000;
        }

        await sql`
          UPDATE user_profiles 
          SET 
            subscription_status = ${status},
            plan_type = ${planType},
            stripe_subscription_id = ${subscription.id},
            updated_at = NOW()
          WHERE user_id = ${userId}
        `;

        console.log(
          `Updated subscription for user ${userId}: ${planType} (${status})`,
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const userRows = await sql`
          SELECT user_id FROM user_profiles WHERE stripe_customer_id = ${customerId}
        `;

        if (userRows.length === 0) {
          console.error(`No user found for customer ${customerId}`);
          return Response.json({ error: "User not found" }, { status: 404 });
        }

        const userId = userRows[0].user_id;

        await sql`
          UPDATE user_profiles 
          SET 
            subscription_status = 'canceled',
            plan_type = 'free',
            stripe_subscription_id = NULL,
            updated_at = NOW()
          WHERE user_id = ${userId}
        `;

        console.log(`Canceled subscription for user ${userId}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        const userRows = await sql`
          SELECT user_id FROM user_profiles WHERE stripe_customer_id = ${customerId}
        `;

        if (userRows.length === 0) {
          console.error(`No user found for customer ${customerId}`);
          return Response.json({ error: "User not found" }, { status: 404 });
        }

        const userId = userRows[0].user_id;

        // Mark subscription as past_due
        await sql`
          UPDATE user_profiles 
          SET 
            subscription_status = 'past_due',
            updated_at = NOW()
          WHERE user_id = ${userId}
        `;

        console.log(`Payment failed for user ${userId}`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        const userRows = await sql`
          SELECT user_id FROM user_profiles WHERE stripe_customer_id = ${customerId}
        `;

        if (userRows.length === 0) {
          console.error(`No user found for customer ${customerId}`);
          return Response.json({ error: "User not found" }, { status: 404 });
        }

        const userId = userRows[0].user_id;

        // Mark subscription as active if it was past_due
        await sql`
          UPDATE user_profiles 
          SET 
            subscription_status = 'active',
            updated_at = NOW()
          WHERE user_id = ${userId} AND subscription_status = 'past_due'
        `;

        console.log(`Payment succeeded for user ${userId}`);
        break;
      }

      // Stripe Connect events for pre-order payments
      case "account.updated": {
        const account = event.data.object;
        const accountId = account.id;
        const detailsSubmitted = account.details_submitted;
        const chargesEnabled = account.charges_enabled;

        await sql`
          UPDATE user_profiles 
          SET 
            stripe_onboarding_completed = ${detailsSubmitted},
            stripe_account_enabled = ${chargesEnabled},
            updated_at = NOW()
          WHERE stripe_account_id = ${accountId}
        `;

        console.log(
          `Updated Stripe Connect account ${accountId}: charges_enabled=${chargesEnabled}`,
        );
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;

        // Handle successful pre-order payments
        if (paymentIntent.metadata?.seller_user_id) {
          const metadata = paymentIntent.metadata;

          // Update pre-order status if it exists
          await sql`
            UPDATE pre_orders 
            SET 
              payment_status = 'completed',
              updated_at = NOW()
            WHERE stripe_payment_intent_id = ${paymentIntent.id}
          `;

          // Log platform fee for accounting
          const platformFee = paymentIntent.application_fee_amount;
          if (platformFee > 0) {
            await sql`
              INSERT INTO usage_logs (user_id, action_type, tokens_used)
              VALUES (${metadata.seller_user_id}, 'platform_fee', ${platformFee})
            `;
          }

          console.log(
            `Pre-order payment succeeded: ${paymentIntent.id}, platform fee: ${platformFee}`,
          );
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;

        // Handle failed pre-order payments
        if (paymentIntent.metadata?.seller_user_id) {
          await sql`
            UPDATE pre_orders 
            SET 
              payment_status = 'failed',
              updated_at = NOW()
            WHERE stripe_payment_intent_id = ${paymentIntent.id}
          `;

          console.log(`Pre-order payment failed: ${paymentIntent.id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error(`Error processing webhook:`, err);
    return Response.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
