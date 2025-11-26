import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { sendEmail } from "@/app/api/utils/send-email";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const rows = await sql`
      SELECT 
        dn.*,
        po.customer_name,
        po.customer_email,
        po.order_number,
        p.product_name
      FROM delay_notifications dn
      JOIN pre_orders po ON dn.pre_order_id = po.id
      JOIN products p ON po.product_id = p.id
      WHERE dn.user_id = ${userId}
      ORDER BY dn.sent_at DESC
      LIMIT 100
    `;

    return Response.json({ notifications: rows });
  } catch (err) {
    console.error("GET /api/notifications error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const {
      pre_order_ids, // Array of pre-order IDs or single ID
      notification_type = "email",
      template_id,
      custom_message,
    } = body;

    if (
      !pre_order_ids ||
      (Array.isArray(pre_order_ids) && pre_order_ids.length === 0)
    ) {
      return Response.json(
        {
          error: "Pre-order IDs are required",
        },
        { status: 400 },
      );
    }

    const orderIds = Array.isArray(pre_order_ids)
      ? pre_order_ids
      : [pre_order_ids];

    // Get user profile for store info
    const [userProfile] = await sql`
      SELECT store_name, store_email FROM user_profiles 
      WHERE user_id = ${userId}
    `;

    // Get template if provided
    let template = null;
    if (template_id) {
      const templateRows = await sql`
        SELECT * FROM communication_templates 
        WHERE id = ${template_id} AND (user_id = ${userId} OR user_id = 'system')
      `;
      template = templateRows[0] || null;
    }

    // Get pre-orders with customer and product data
    const preOrdersQuery = `
      SELECT 
        po.*,
        p.product_name,
        p.current_estimated_date,
        p.original_release_date
      FROM pre_orders po
      JOIN products p ON po.product_id = p.id
      WHERE po.id = ANY($1) AND po.user_id = $2
    `;

    const preOrders = await sql(preOrdersQuery, [orderIds, userId]);

    if (preOrders.length === 0) {
      return Response.json(
        { error: "No valid pre-orders found" },
        { status: 404 },
      );
    }

    const notifications = [];
    const emailErrors = [];

    // Create notifications for each pre-order
    for (const preOrder of preOrders) {
      let messageContent = custom_message;
      let subjectLine = "Update on Your Pre-Order";

      if (template) {
        // Replace template variables in email content
        messageContent = template.email_content
          .replace(
            /\{\{customer_name\}\}/g,
            preOrder.customer_name || "Customer",
          )
          .replace(/\{\{product_name\}\}/g, preOrder.product_name)
          .replace(/\{\{order_number\}\}/g, preOrder.order_number || "N/A")
          .replace(
            /\{\{new_date\}\}/g,
            new Date(preOrder.current_estimated_date).toLocaleDateString() ||
              "TBD",
          );

        // Replace template variables in subject line
        if (template.subject_line) {
          subjectLine = template.subject_line
            .replace(/\{\{product_name\}\}/g, preOrder.product_name)
            .replace(/\{\{order_number\}\}/g, preOrder.order_number || "N/A");
        }
      } else if (custom_message) {
        // Use default subject for custom messages
        subjectLine = `Update on Your Pre-Order - ${preOrder.product_name}`;
      }

      // Create HTML email template
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #4f46e5; margin: 0;">${userProfile?.store_name || "Your Store"}</h1>
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-top: 0;">Pre-Order Update</h2>
            <p><strong>Product:</strong> ${preOrder.product_name}</p>
            <p><strong>Order Number:</strong> ${preOrder.order_number || "N/A"}</p>
            ${preOrder.current_estimated_date ? `<p><strong>Updated Estimated Date:</strong> ${new Date(preOrder.current_estimated_date).toLocaleDateString()}</p>` : ""}
          </div>
          
          <div style="margin-bottom: 30px;">
            ${messageContent || "We wanted to update you on the status of your pre-order."}
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; color: #6b7280; font-size: 14px;">
            <p>If you have any questions, please reply to this email.</p>
            <p>Thank you for your patience!</p>
            ${userProfile?.store_name ? `<p><strong>${userProfile.store_name}</strong></p>` : ""}
          </div>
        </div>
      `;

      // Send email notification
      let emailSent = false;
      if (notification_type === "email" && preOrder.customer_email) {
        try {
          await sendEmail({
            to: preOrder.customer_email,
            from: userProfile?.store_email || "onboarding@resend.dev",
            subject: subjectLine,
            html: htmlContent,
            text:
              messageContent ||
              "We wanted to update you on the status of your pre-order.",
          });
          emailSent = true;
        } catch (error) {
          console.error(
            `Failed to send email to ${preOrder.customer_email}:`,
            error,
          );
          emailErrors.push({
            customer_email: preOrder.customer_email,
            error: error.message,
          });
        }
      }

      // Record notification in database
      const result = await sql`
        INSERT INTO delay_notifications (
          user_id, pre_order_id, notification_type, template_used, message_content, status
        )
        VALUES (
          ${userId}, ${preOrder.id}, ${notification_type}, 
          ${template?.template_name || "Custom"}, ${messageContent},
          ${emailSent ? "sent" : "failed"}
        )
        RETURNING *
      `;

      // Update pre-order last notification timestamp
      await sql`
        UPDATE pre_orders 
        SET last_notification_sent = NOW(), status = 'notified'
        WHERE id = ${preOrder.id}
      `;

      notifications.push({
        ...result[0],
        customer_name: preOrder.customer_name,
        customer_email: preOrder.customer_email,
        product_name: preOrder.product_name,
        email_sent: emailSent,
      });
    }

    // Handle partial failures
    if (emailErrors.length > 0) {
      console.error("Email sending errors:", emailErrors);
      return Response.json({
        success: true,
        notifications,
        warnings: emailErrors,
        message: `Processed ${notifications.length} notification(s), ${emailErrors.length} email(s) failed to send. Check your Resend API key configuration.`,
      });
    }

    return Response.json({
      success: true,
      notifications,
      message: `Sent ${notifications.length} notification(s) successfully`,
    });
  } catch (err) {
    console.error("POST /api/notifications error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
