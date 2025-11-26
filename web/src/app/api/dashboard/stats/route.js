import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get total products
    const productStats = await sql`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN status = 'delayed' THEN 1 END) as delayed_products,
        COUNT(CASE WHEN status = 'pre_order' THEN 1 END) as pre_order_products,
        COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_products
      FROM products
      WHERE user_id = ${userId}
    `;

    // Get pre-order stats
    const preOrderStats = await sql`
      SELECT 
        COUNT(*) as total_pre_orders,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_pre_orders,
        COUNT(CASE WHEN status = 'notified' THEN 1 END) as notified_pre_orders,
        COUNT(CASE WHEN status = 'fulfilled' THEN 1 END) as fulfilled_pre_orders,
        SUM(quantity) as total_items_ordered
      FROM pre_orders
      WHERE user_id = ${userId}
    `;

    // Get notification stats for current month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const notificationStats = await sql`
      SELECT 
        COUNT(*) as total_notifications,
        COUNT(CASE WHEN notification_type = 'email' THEN 1 END) as email_notifications,
        COUNT(CASE WHEN notification_type = 'sms' THEN 1 END) as sms_notifications,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as successful_notifications
      FROM delay_notifications
      WHERE user_id = ${userId} 
      AND sent_at >= ${firstDayOfMonth.toISOString()}
    `;

    // Get recent delayed products that need attention
    const delayedProducts = await sql`
      SELECT 
        p.*,
        COUNT(po.id) as affected_customers
      FROM products p
      LEFT JOIN pre_orders po ON p.id = po.product_id AND po.status IN ('active', 'notified')
      WHERE p.user_id = ${userId}
      AND p.current_estimated_date < NOW()
      AND p.status = 'pre_order'
      GROUP BY p.id
      ORDER BY p.current_estimated_date ASC
      LIMIT 5
    `;

    // Get customers who need notifications
    const customersNeedingNotification = await sql`
      SELECT 
        po.*,
        p.product_name,
        p.current_estimated_date,
        p.original_release_date
      FROM pre_orders po
      JOIN products p ON po.product_id = p.id
      WHERE po.user_id = ${userId}
      AND po.status = 'active'
      AND p.current_estimated_date != p.original_release_date
      AND (po.last_notification_sent IS NULL OR po.last_notification_sent < p.updated_at)
      ORDER BY p.current_estimated_date ASC
      LIMIT 10
    `;

    // Get user's plan info
    const profileRows = await sql`
      SELECT plan_type FROM user_profiles WHERE user_id = ${userId}
    `;

    const planType = profileRows[0]?.plan_type || "starter";

    const planRows = await sql`
      SELECT max_agents as max_products, max_monthly_requests as max_notifications
      FROM subscription_plans
      WHERE LOWER(plan_name) = LOWER(${planType})
    `;

    const plan = planRows[0] || { max_products: 50, max_notifications: 100 };

    return Response.json({
      products: {
        total: parseInt(productStats[0]?.total_products || 0),
        delayed: parseInt(productStats[0]?.delayed_products || 0),
        preOrder: parseInt(productStats[0]?.pre_order_products || 0),
        shipped: parseInt(productStats[0]?.shipped_products || 0),
        limit: plan.max_products,
      },
      preOrders: {
        total: parseInt(preOrderStats[0]?.total_pre_orders || 0),
        active: parseInt(preOrderStats[0]?.active_pre_orders || 0),
        notified: parseInt(preOrderStats[0]?.notified_pre_orders || 0),
        fulfilled: parseInt(preOrderStats[0]?.fulfilled_pre_orders || 0),
        totalItems: parseInt(preOrderStats[0]?.total_items_ordered || 0),
      },
      notifications: {
        monthlyTotal: parseInt(notificationStats[0]?.total_notifications || 0),
        emailSent: parseInt(notificationStats[0]?.email_notifications || 0),
        smsSent: parseInt(notificationStats[0]?.sms_notifications || 0),
        successful: parseInt(
          notificationStats[0]?.successful_notifications || 0,
        ),
        limit: plan.max_notifications,
      },
      plan: {
        type: planType,
        maxProducts: plan.max_products,
        maxNotifications: plan.max_notifications,
      },
      alerts: {
        delayedProducts,
        customersNeedingNotification,
      },
    });
  } catch (err) {
    console.error("GET /api/dashboard/stats error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
