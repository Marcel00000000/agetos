import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user profile with subscription info
    const rows = await sql`
      SELECT 
        up.crew_ai_token,
        up.subscription_status,
        up.plan_type,
        up.stripe_customer_id,
        up.notification_settings,
        up.store_name,
        up.store_email,
        au.email,
        au.name
      FROM user_profiles up
      LEFT JOIN auth_users au ON au.id = up.user_id
      WHERE up.user_id = ${userId}
      LIMIT 1
    `;

    const profile = rows?.[0] || null;

    // If no profile exists, create one with default settings
    if (!profile) {
      await sql`
        INSERT INTO user_profiles (
          user_id, 
          plan_type, 
          subscription_status, 
          crew_ai_token,
          notification_settings
        )
        VALUES (
          ${userId}, 
          'free', 
          'inactive', 
          'd50848c5037b',
          '{"sms_enabled": false, "email_enabled": true, "auto_notify_delays": true}'::jsonb
        )
      `;

      const newRows = await sql`
        SELECT 
          up.crew_ai_token,
          up.subscription_status,
          up.plan_type,
          up.notification_settings,
          up.store_name,
          up.store_email,
          au.email,
          au.name
        FROM user_profiles up
        LEFT JOIN auth_users au ON au.id = up.user_id
        WHERE up.user_id = ${userId}
        LIMIT 1
      `;

      return Response.json({ profile: newRows[0] });
    }

    // Set default token if not set
    if (!profile.crew_ai_token) {
      await sql`
        UPDATE user_profiles 
        SET crew_ai_token = 'd50848c5037b'
        WHERE user_id = ${userId}
      `;
      profile.crew_ai_token = "d50848c5037b";
    }

    return Response.json({ profile });
  } catch (err) {
    console.error("GET /api/profile error", err);
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
    const { crew_ai_token, notification_settings, store_name, store_email } =
      body || {};

    // Ensure profile exists
    const existing = await sql`
      SELECT id FROM user_profiles WHERE user_id = ${userId}
    `;

    if (existing.length === 0) {
      await sql`
        INSERT INTO user_profiles (
          user_id, 
          crew_ai_token, 
          notification_settings,
          store_name,
          store_email
        )
        VALUES (
          ${userId}, 
          ${crew_ai_token || "d50848c5037b"}, 
          ${JSON.stringify(notification_settings) || '{"sms_enabled": false, "email_enabled": true, "auto_notify_delays": true}'},
          ${store_name || null},
          ${store_email || null}
        )
      `;
    } else {
      // Build dynamic update query
      let setParts = [];
      let values = [];

      if (crew_ai_token !== undefined) {
        setParts.push(`crew_ai_token = $${setParts.length + 1}`);
        values.push(crew_ai_token);
      }

      if (notification_settings !== undefined) {
        setParts.push(`notification_settings = $${setParts.length + 1}`);
        values.push(JSON.stringify(notification_settings));
      }

      if (store_name !== undefined) {
        setParts.push(`store_name = $${setParts.length + 1}`);
        values.push(store_name);
      }

      if (store_email !== undefined) {
        setParts.push(`store_email = $${setParts.length + 1}`);
        values.push(store_email);
      }

      setParts.push(`updated_at = NOW()`);
      values.push(userId);

      if (setParts.length > 1) {
        await sql(
          `UPDATE user_profiles SET ${setParts.join(", ")} WHERE user_id = $${values.length}`,
          values,
        );
      }
    }

    const updated = await sql`
      SELECT 
        up.crew_ai_token,
        up.subscription_status,
        up.plan_type,
        up.notification_settings,
        up.store_name,
        up.store_email,
        au.email,
        au.name
      FROM user_profiles up
      LEFT JOIN auth_users au ON au.id = up.user_id
      WHERE up.user_id = ${userId}
      LIMIT 1
    `;

    return Response.json({ profile: updated[0] });
  } catch (err) {
    console.error("PUT /api/profile error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
