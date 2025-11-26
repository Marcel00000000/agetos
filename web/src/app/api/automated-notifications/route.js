import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { pre_order_id, delay_reason, new_estimated_date } = body;

    if (!pre_order_id) {
      return Response.json(
        { error: "Pre-order ID is required" },
        { status: 400 },
      );
    }

    // Get pre-order details
    const preOrderRows = await sql`
      SELECT po.*, p.product_name, p.original_release_date, p.current_estimated_date
      FROM pre_orders po
      JOIN products p ON po.product_id = p.id
      WHERE po.id = ${pre_order_id} AND po.user_id = ${userId}
      LIMIT 1
    `;

    if (preOrderRows.length === 0) {
      return Response.json({ error: "Pre-order not found" }, { status: 404 });
    }

    const preOrder = preOrderRows[0];

    // Get user profile for Crew AI token and store info
    const profileRows = await sql`
      SELECT crew_ai_token, store_name, store_email, notification_settings
      FROM user_profiles
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    const profile = profileRows[0];
    const crewAiToken = profile?.crew_ai_token || "d50848c5037b";

    // Generate AI-powered delay notification
    const notificationPrompt = `Create a professional, empathetic delay notification email for the following pre-order:

**Store Information:**
- Store Name: ${profile?.store_name || "Your Store"}
- Store Email: ${profile?.store_email || ""}

**Order Details:**
- Customer: ${preOrder.customer_name}
- Product: ${preOrder.product_name}
- Order Number: ${preOrder.order_number}
- Original Date: ${preOrder.original_release_date}
- New Estimated Date: ${new_estimated_date || preOrder.current_estimated_date}
- Delay Reason: ${delay_reason || "supplier delays"}

**Requirements:**
- Professional and empathetic tone
- Acknowledge the inconvenience
- Provide clear explanation of delay
- Offer options (wait, cancel, refund)
- Include contact information for questions
- Maintain customer trust and loyalty

Please provide both EMAIL and SMS versions of the notification.`;

    let notificationContent = "";

    try {
      // Call Crew AI to generate notification content
      const crewResponse = await fetch(
        "https://app.crewai.com/crewai_plus/deployments/10991/kick_off",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${crewAiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: {
              system_prompt: notificationPrompt,
              user_message: "Generate delay notification",
              store_context: {
                store_name: profile?.store_name || "Your Store",
                store_email: profile?.store_email || "",
                business_type: "ecommerce_preorders",
              },
              task_context: {
                customer_name: preOrder.customer_name,
                product_name: preOrder.product_name,
                order_number: preOrder.order_number,
                delay_reason: delay_reason || "supplier delays",
                new_date: new_estimated_date || preOrder.current_estimated_date,
              },
            },
          }),
        },
      );

      if (crewResponse.ok) {
        const responseData = await crewResponse.json();
        notificationContent =
          responseData.output || responseData.result || responseData.content;
      } else {
        console.error("Crew AI API error:", await crewResponse.text());
        // Use fallback content
        notificationContent = generateFallbackNotification(
          preOrder,
          profile,
          delay_reason,
          new_estimated_date,
        );
      }
    } catch (error) {
      console.error("Error calling Crew AI API:", error);
      // Use fallback content
      notificationContent = generateFallbackNotification(
        preOrder,
        profile,
        delay_reason,
        new_estimated_date,
      );
    }

    // Log the delay notification
    await sql`
      INSERT INTO delay_notifications (
        user_id, 
        pre_order_id, 
        notification_type, 
        template_used,
        message_content,
        sent_at,
        status
      )
      VALUES (
        ${userId}, 
        ${pre_order_id}, 
        'delay', 
        'ai_generated',
        ${notificationContent},
        NOW(),
        'ready_to_send'
      )
    `;

    // Update pre-order with new estimated date and last notification time
    if (new_estimated_date) {
      await sql`
        UPDATE products 
        SET current_estimated_date = ${new_estimated_date}
        WHERE id = ${preOrder.product_id} AND user_id = ${userId}
      `;
    }

    await sql`
      UPDATE pre_orders 
      SET last_notification_sent = NOW(), updated_at = NOW()
      WHERE id = ${pre_order_id} AND user_id = ${userId}
    `;

    // Log usage for AI generation
    await sql`
      INSERT INTO usage_logs (user_id, agent_id, action_type, tokens_used)
      VALUES (${userId}, 'auto-notification-ai', 'notification_generation', 150)
    `;

    return Response.json({
      success: true,
      message: "Delay notification generated successfully",
      notification_content: notificationContent,
      pre_order_id: pre_order_id,
    });
  } catch (err) {
    console.error("POST /api/automated-notifications error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

function generateFallbackNotification(preOrder, profile, delayReason, newDate) {
  const storeName = profile?.store_name || "Your Store";
  const storeEmail = profile?.store_email || "support@yourstore.com";
  const reason = delayReason || "unexpected supplier delays";
  const estimatedDate =
    newDate || preOrder.current_estimated_date || "to be determined";

  return `**📧 EMAIL NOTIFICATION:**

Subject: Important Update - Delay Notice for Your Pre-Order #${preOrder.order_number}

Dear ${preOrder.customer_name},

I hope this message finds you well. I'm writing to inform you of an important update regarding your pre-order for ${preOrder.product_name} (Order #${preOrder.order_number}).

Unfortunately, we've experienced ${reason}, which will delay the expected delivery from the original date to ${estimatedDate}. I understand how disappointing this news must be, and I sincerely apologize for any inconvenience this causes.

**What's happening:**
We're working closely with our suppliers to resolve the delay and get your order to you as soon as possible. We're monitoring the situation daily and will keep you updated.

**Your options:**
1. **Wait for the new delivery date** - We'll prioritize your order and send updates
2. **Full refund** - We can process a complete refund within 3-5 business days
3. **Store credit** - Receive 10% bonus credit for future purchases

**Next steps:**
Please reply to this email or call us at [PHONE] to let us know how you'd like to proceed. We're here to help and want to make this right.

Thank you for your patience and understanding. Your business means the world to us.

Best regards,
${storeName}
${storeEmail}

---

**📱 SMS NOTIFICATION:**

"Hi ${preOrder.customer_name}! ${storeName}: Your pre-order #${preOrder.order_number} for ${preOrder.product_name} is delayed due to ${reason}. New estimated date: ${estimatedDate}. Reply REFUND for full refund or WAIT to continue. Sorry for the inconvenience! -${storeName}"

**Character count: ${`Hi ${preOrder.customer_name}! ${storeName}: Your pre-order #${preOrder.order_number} for ${preOrder.product_name} is delayed due to ${reason}. New estimated date: ${estimatedDate}. Reply REFUND for full refund or WAIT to continue. Sorry for the inconvenience! -${storeName}`.length}/160**`;
}

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all delay notifications for the user
    const notifications = await sql`
      SELECT 
        dn.*,
        po.order_number,
        po.customer_name,
        po.customer_email,
        p.product_name
      FROM delay_notifications dn
      LEFT JOIN pre_orders po ON dn.pre_order_id = po.id
      LEFT JOIN products p ON po.product_id = p.id
      WHERE dn.user_id = ${userId}
      ORDER BY dn.sent_at DESC
      LIMIT 50
    `;

    return Response.json({ notifications });
  } catch (err) {
    console.error("GET /api/automated-notifications error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
