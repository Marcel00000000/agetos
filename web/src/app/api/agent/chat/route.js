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
    const { message, agentId, context } = body;

    if (!message) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    // Get user profile to check subscription and get Crew AI token
    const profileRows = await sql`
      SELECT crew_ai_token, subscription_status, plan_type, store_name, store_email
      FROM user_profiles
      WHERE user_id = ${userId}
    `;

    if (profileRows.length === 0) {
      return Response.json({ error: "Profile not found" }, { status: 404 });
    }

    const profile = profileRows[0];

    // Check if user has active subscription or is on free plan
    if (
      profile.subscription_status !== "active" &&
      profile.plan_type !== "free"
    ) {
      return Response.json(
        { error: "Active subscription required" },
        { status: 403 },
      );
    }

    // Get usage for current month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const usageRows = await sql`
      SELECT COUNT(*) as request_count
      FROM usage_logs
      WHERE user_id = ${userId}
      AND created_at >= ${firstDayOfMonth.toISOString()}
    `;

    const currentUsage = parseInt(usageRows[0]?.request_count || 0);

    // Get plan limits
    const planRows = await sql`
      SELECT max_monthly_requests
      FROM subscription_plans
      WHERE plan_name = ${profile.plan_type === "free" ? "Starter" : profile.plan_type}
    `;

    const maxRequests = planRows[0]?.max_monthly_requests || 1000;

    if (currentUsage >= maxRequests) {
      return Response.json(
        {
          error: "Monthly request limit reached. Please upgrade your plan.",
        },
        { status: 429 },
      );
    }

    // Use the correct Crew AI token
    const crewAiToken = profile.crew_ai_token || "d50848c5037b";

    // Enhanced system prompt for ecommerce pre-order communication
    const systemPrompt = `You are PreOrder Pro AI - a specialized assistant for ecommerce pre-order communication and customer service automation.

**Your Core Expertise:**
1. **Delay Communication**: Write professional, empathetic messages about product delays that maintain customer trust
2. **Template Generation**: Create email/SMS templates for delays, shipping updates, cancellations, and follow-ups
3. **Customer Service**: Provide scripts for handling upset customers and difficult situations
4. **Process Automation**: Suggest workflows for automated communication sequences
5. **Business Strategy**: Recommend pre-order management best practices

**Store Context:**
- Store Name: ${profile.store_name || "Your Store"}
- Store Email: ${profile.store_email || ""}
- User Request: ${message}

**Communication Style Guidelines:**
✓ Professional yet empathetic tone
✓ Clear, actionable information
✓ Focus on solutions and alternatives
✓ Maintain customer trust and loyalty
✓ Include specific timelines when possible

**Response Format:**
Provide specific, actionable content that can be directly used or easily customized by the store owner.`;

    try {
      // Call Crew AI deployment directly
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
              system_prompt: systemPrompt,
              user_message: message,
              store_context: {
                store_name: profile.store_name || "Your Store",
                store_email: profile.store_email || "",
                business_type: "ecommerce_preorders",
              },
              task_context: context || {},
            },
          }),
        },
      );

      let responseData;
      let tokensUsed = 0;

      if (crewResponse.ok) {
        responseData = await crewResponse.json();
        tokensUsed =
          responseData.tokens_used || responseData.usage?.total_tokens || 100;

        // Log usage
        await sql`
          INSERT INTO usage_logs (user_id, agent_id, action_type, tokens_used)
          VALUES (${userId}, ${agentId || "preorder-pro-ai"}, 'chat', ${tokensUsed})
        `;

        return Response.json({
          response:
            responseData.output || responseData.result || responseData.content,
          tokensUsed,
          remainingRequests: maxRequests - currentUsage - 1,
          agentStatus: "active",
        });
      } else {
        console.error("Crew AI API error:", await crewResponse.text());

        // Enhanced fallback with specific ecommerce templates
        const fallbackResponse = generateFallbackResponse(
          message,
          profile.store_name,
        );
        tokensUsed = 50;

        // Log fallback usage
        await sql`
          INSERT INTO usage_logs (user_id, agent_id, action_type, tokens_used)
          VALUES (${userId}, ${agentId || "preorder-pro-ai-fallback"}, 'chat_fallback', ${tokensUsed})
        `;

        return Response.json({
          response: fallbackResponse,
          tokensUsed,
          remainingRequests: maxRequests - currentUsage - 1,
          agentStatus: "fallback",
        });
      }
    } catch (error) {
      console.error("Error calling Crew AI API:", error);

      // Enhanced fallback response
      const fallbackResponse = generateFallbackResponse(
        message,
        profile.store_name,
      );

      return Response.json({
        response: fallbackResponse,
        tokensUsed: 0,
        remainingRequests: maxRequests - currentUsage,
        agentStatus: "error_fallback",
      });
    }
  } catch (err) {
    console.error("POST /api/agent/chat error", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

function generateFallbackResponse(message, storeName = "Your Store") {
  const lowerMessage = message.toLowerCase();
  const store = storeName || "Your Store";

  if (lowerMessage.includes("delay") || lowerMessage.includes("opóźnien")) {
    return `**📧 Szablon Email o Opóźnieniu dla ${store}:**

Temat: Ważna aktualizacja dotycząca Twojego zamówienia przedsprzedażowego

Szanowny/a [Imię Klienta],

Piszę w sprawie Twojego zamówienia przedsprzedażowego na [Nazwa Produktu] złożonego dnia [Data Zamówienia].

Niestety muszę poinformować, że dostawca powiadomił nas o przesunięciu terminu dostawy z [Pierwotna Data] na [Nowa Data]. Rozumiem, jak frustrujące może to być.

**Co robimy:**
• Monitorujemy sytuację codziennie
• Priorytetowo traktujemy Twoje zamówienie
• Zapewniamy aktualizacje co tydzień

**Twoje opcje:**
1. Czekaj na nowy termin (bez dodatkowych kosztów)
2. Pełny zwrot środków w ciągu 3-5 dni roboczych
3. Zamiana na podobny produkt już dostępny

Dziękuję za cierpliwość i zrozumienie.

Z wyrazami szacunku,
[Twoje Imię]
${store}`;
  }

  if (lowerMessage.includes("sms") || lowerMessage.includes("tekst")) {
    return `**📱 Szablon SMS dla ${store}:**

"Cześć [Imię]! ${store}: Twoje zamówienie #[Numer] zostało przesunięte na [Nowa Data] z powodu opóźnienia dostawcy. Przepraszamy! Pełny zwrot możliwy. Odpisz ZWROT lub czekaj na aktualizacje. Link: [link]"

**Alternatywny krótki:**
"${store}: Opóźnienie zamówienia #[Numer] do [Data]. Zwrot lub czekanie? Odpisz lub sprawdź: [link]"`;
  }

  return `**🎯 PreOrder Pro AI - Twój Asystent Komunikacji**

Pomogę Ci z:
📧 **Profesjonalne powiadomienia o opóźnieniach** dla ${store}
📱 **Szablony SMS** - szybkie, jasne wiadomości  
💬 **Obsługa klientów** - scenariusze rozmów
📋 **Automatyzacja** - sekwencje komunikacji
💡 **Strategie biznesowe** - lepsze zarządzanie przedsprzedażą

**Przykłady zapytań:**
• "Napisz email o opóźnieniu dostawy iPhone"
• "Szablon SMS o zmianie terminu"  
• "Jak odpowiadać na zły feedback?"
• "Automatyzacja powiadomień o statusie"

W czym mogę pomóc z komunikacją dla ${store}?`;
}
