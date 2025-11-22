## Glass Control Center

CrewAI "Glass Control Center" is a dark-mode cockpit for steering AI agents that handle e-commerce delivery delays. The UI blends a glassmorphism shell (sidebar + HUD) with live terminal streaming, approval workflows, and billing gates.

### Stack

- Next.js App Router (TypeScript, src/ directory)
- Tailwind CSS (v4) with custom glass tokens
- NextAuth.js (Auth.js v5) + Google OAuth
- React Query + Axios + SSE for CrewAI telemetry
- Stripe portal stubs + subscription gating via Zustand
- Recharts, Sonner toasts, Lucide icons, Shadcn-inspired UI atoms

### Key Features

- Collapsible sidebar & HUD-style top bar (ping, Crew status, Google avatar)
- Live Operations terminal (SSE) streaming CrewAI steps in real time
- Human-in-the-loop Decision Center with approval cards + optimistic UX
- Analytics grid (rescued carts, delays, response time) with Recharts
- Billing hub: subscription snapshot, pricing table, Stripe portal CTA
- `withSubscription` HOC to gate advanced AI settings + upgrade modal
- Error-friendly read-only banner when plan lapses, Sonner notifications

### Getting Started

1. Install deps: `npm install`
2. Copy `.env.example` → `.env.local` and provide:
	```
	GOOGLE_CLIENT_ID=...
	GOOGLE_CLIENT_SECRET=...
	AUTH_SECRET=...
	```
3. Run dev server: `npm run dev`
4. Visit `http://localhost:3000` – you'll be redirected to `/login` for Google OAuth.

### Project Layout

```
src/
├─ app/
│  ├─ (auth)/login          # Google OAuth onboarding
│  ├─ (dashboard)/          # Protected routes via middleware
│  │  ├─ agent-control      # Live operations + analytics
│  │  ├─ billing            # Stripe portal, pricing
│  │  ├─ settings           # API keys + gated advanced AI controls
│  │  ├─ logs, analytics    # Placeholders for future modules
│  └─ api/                  # Mock CrewAI + Stripe endpoints & SSE stream
├─ components/
│  ├─ ui/                   # Shadcn-style atoms (Button, Card, Skeleton...)
│  ├─ business/             # LiveTerminal, DecisionCenter, SubscriptionCard…
│  ├─ layouts/              # Sidebar, TopBar, DashboardShell
│  └─ providers/            # NextAuth + React Query + Sonner
├─ hooks/                   # useCrewAgent (SSE + polling), useStripe
├─ lib/                     # Axios client, Zustand store, helpers
└─ types/                   # Domain models + NextAuth augmentation
```

### Development Notes

- SSE endpoint lives at `/api/crew-agent/stream`; replace with backend proxy when ready.
- Stripe portal + subscription routes return mocked data—swap with secure backend integration.
- Middleware guards `/agent-control`, `/billing`, `/settings`, `/logs`, `/analytics`.
- Shadcn components are handwritten; add more primitives under `src/components/ui` as needed.

### Scripts

- `npm run dev` – start dev server with Turbopack
- `npm run build` – production build
- `npm start` – serve built app
- `npm run lint` – ESLint (Next config)

### Next Steps

- Wire CrewAI API proxy + secure token exchange inside `lib/axios`
- Replace mock billing endpoints with real Stripe webhooks/portal session
- Add real analytics/log feeds and persistence
- Expand Decision Center with editing modal + optimistic persistence
