"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { withSubscription } from "@/components/business/with-subscription";

function AdvancedAiSettings() {
  const [aggressive, setAggressive] = useState(false);
  const [autoEscalate, setAutoEscalate] = useState(true);

  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">Advanced AI Settings</h3>
      <Switch checked={aggressive} onChange={setAggressive} label="Agresywność negocjacji AI" />
      <Switch checked={autoEscalate} onChange={setAutoEscalate} label="Aut. eskalacja VIP" />
    </Card>
  );
}

const AdvancedSettingsGuard = withSubscription(AdvancedAiSettings, "pro");

export default function SettingsPage() {
  const [webhooks, setWebhooks] = useState(true);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Konfiguracja agenta</h1>
      <Card className="space-y-4">
        <h2 className="text-lg font-semibold">Klucze API</h2>
        <div className="flex flex-col gap-2 text-sm text-white/70">
          <label className="text-xs uppercase tracking-[0.3em] text-white/40">Crew Backend URL</label>
          <input
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white focus:border-cyan-400"
            placeholder="https://backend.yourcrew.ai"
          />
          <label className="text-xs uppercase tracking-[0.3em] text-white/40">Secret token</label>
          <input
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white focus:border-cyan-400"
            placeholder="••••••••"
            type="password"
          />
          <Switch checked={webhooks} onChange={setWebhooks} label="Wysyłaj webhooks o stanie" />
        </div>
      </Card>
      <AdvancedSettingsGuard />
    </div>
  );
}
