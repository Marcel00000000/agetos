import { AgentStatusCard } from "@/components/business/agent-status";
import { LiveTerminal } from "@/components/business/live-terminal";
import { DecisionCenter } from "@/components/business/decision-center";
import { AnalyticsGrid } from "@/components/business/analytics-grid";

export default function AgentControlPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <LiveTerminal />
        <AgentStatusCard />
      </div>
      <AnalyticsGrid />
      <section>
        <h2 className="mb-4 text-lg font-semibold">Approval requests</h2>
        <DecisionCenter />
      </section>
    </div>
  );
}
