import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const rows = await sql`
      SELECT 
        id, 
        agent_name, 
        system_prompt, 
        is_active, 
        created_at,
        updated_at
      FROM agent_configs
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    // If no agent exists, create a default PreOrder Assistant
    if (rows.length === 0) {
      const defaultSystemPrompt = `You are an AI assistant specialized in ecommerce pre-order communication and customer service. Your expertise includes:

1. **Delay Notifications**: Craft professional, empathetic messages about product delays
2. **Template Creation**: Generate email and SMS templates for various scenarios (delays, shipping updates, cancellations)
3. **Customer Communication**: Help resolve customer inquiries about pre-orders professionally  
4. **Business Insights**: Provide suggestions for improving pre-order processes and customer satisfaction

Always be professional, empathetic, and solution-focused in your responses. Help users maintain customer trust during delays and provide clear, actionable communication strategies.`;

      const result = await sql`
        INSERT INTO agent_configs (
          user_id, 
          agent_name, 
          system_prompt, 
          is_active
        )
        VALUES (
          ${userId}, 
          'PreOrder Communication Assistant', 
          ${defaultSystemPrompt}, 
          true
        )
        RETURNING id, agent_name, system_prompt, is_active, created_at, updated_at
      `;

      return Response.json({ agents: result });
    }

    return Response.json({ agents: rows });
  } catch (err) {
    console.error("GET /api/agent/config error", err);
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
    const { agent_name, system_prompt } = body;

    if (!agent_name) {
      return Response.json(
        { error: "Agent name is required" },
        { status: 400 },
      );
    }

    // Check plan limits
    const profileRows = await sql`
      SELECT plan_type FROM user_profiles WHERE user_id = ${userId}
    `;

    const planType = profileRows[0]?.plan_type || "free";

    // Map plan types to new naming convention
    const planName = planType === "free" ? "Starter" : planType;

    const planRows = await sql`
      SELECT max_agents FROM subscription_plans WHERE plan_name = ${planName}
    `;

    const maxAgents = planRows[0]?.max_agents || 50;

    const agentCountRows = await sql`
      SELECT COUNT(*) as count FROM agent_configs WHERE user_id = ${userId}
    `;

    const currentCount = parseInt(agentCountRows[0]?.count || 0);

    if (currentCount >= maxAgents) {
      return Response.json(
        {
          error: `Your ${planName} plan allows only ${maxAgents} agent(s). Please upgrade.`,
        },
        { status: 403 },
      );
    }

    const defaultSystemPrompt =
      system_prompt ||
      `You are an AI assistant specialized in ecommerce pre-order communication and customer service. Help users craft professional messages for delay notifications, create templates, and provide insights on customer communication.`;

    const result = await sql`
      INSERT INTO agent_configs (user_id, agent_name, system_prompt, is_active)
      VALUES (${userId}, ${agent_name}, ${defaultSystemPrompt}, true)
      RETURNING id, agent_name, system_prompt, is_active, created_at, updated_at
    `;

    return Response.json({ agent: result[0] });
  } catch (err) {
    console.error("POST /api/agent/config error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { id, agent_name, system_prompt, is_active } = body;

    if (!id) {
      return Response.json({ error: "Agent ID is required" }, { status: 400 });
    }

    const setClauses = [];
    const values = [];
    let paramCount = 1;

    if (agent_name !== undefined) {
      setClauses.push(`agent_name = $${paramCount}`);
      values.push(agent_name);
      paramCount++;
    }

    if (system_prompt !== undefined) {
      setClauses.push(`system_prompt = $${paramCount}`);
      values.push(system_prompt);
      paramCount++;
    }

    if (is_active !== undefined) {
      setClauses.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    if (setClauses.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    setClauses.push(`updated_at = NOW()`);

    const query = `
      UPDATE agent_configs 
      SET ${setClauses.join(", ")}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING id, agent_name, system_prompt, is_active, created_at, updated_at
    `;

    const result = await sql(query, [...values, id, userId]);

    if (result.length === 0) {
      return Response.json({ error: "Agent not found" }, { status: 404 });
    }

    return Response.json({ agent: result[0] });
  } catch (err) {
    console.error("PUT /api/agent/config error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
