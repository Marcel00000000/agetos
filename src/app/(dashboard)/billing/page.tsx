import { SubscriptionCard } from "@/components/business/billing/subscription-card";
import { PricingTable } from "@/components/business/billing/pricing-table";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";

export default function BillingPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">Billing & Subskrypcja</h1>
      <Suspense fallback={<Card className="h-48 animate-pulse" />}>
        <SubscriptionCard />
      </Suspense>
      <PricingTable />
    </div>
  );
}
