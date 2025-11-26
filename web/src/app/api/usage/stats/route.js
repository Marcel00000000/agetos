import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get current month usage
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyRows = await sql`
      SELECT 
        COUNT(*) as request_count,
        SUM(tokens_used) as total_tokens
      FROM usage_logs
      WHERE user_id = ${userId}
      AND created_at >= ${firstDayOfMonth.toISOString()}
    `;

    // Get total all-time usage
    const totalRows = await sql`
      SELECT 
        COUNT(*) as total_requests,
        SUM(tokens_used) as total_tokens
      FROM usage_logs
      WHERE user_id = ${userId}
    `;

    // Get plan info
    const profileRows = await sql`
      SELECT plan_type FROM user_profiles WHERE user_id = ${userId}
    `;

    const planType = profileRows[0]?.plan_type || "free";

    const planRows = await sql`
      SELECT max_monthly_requests, max_agents
      FROM subscription_plans
      WHERE plan_name = ${planType}
    `;

    const plan = planRows[0] || { max_monthly_requests: 100, max_agents: 1 };

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentRows = await sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM usage_logs
      WHERE user_id = ${userId}
      AND created_at >= ${sevenDaysAgo.toISOString()}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    return Response.json({
      monthly: {
        requests: parseInt(monthlyRows[0]?.request_count || 0),
        tokens: parseInt(monthlyRows[0]?.total_tokens || 0),
        limit: plan.max_monthly_requests,
      },
      total: {
        requests: parseInt(totalRows[0]?.total_requests || 0),
        tokens: parseInt(totalRows[0]?.total_tokens || 0),
      },
      plan: {
        type: planType,
        maxRequests: plan.max_monthly_requests,
        maxAgents: plan.max_agents,
      },
      recentActivity: recentRows,
    });
  } catch (err) {
    console.error("GET /api/usage/stats error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
