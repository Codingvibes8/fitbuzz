# FitBuzz

FitBuzz is a modern, responsive workout-tracking dashboard built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, Supabase, and Stripe. It provides a personal home for your training — log sessions, review weekly activity, follow sample training plans, and manage your membership.

## Features

### Dashboard & Training
- **Overview** — Weekly activity chart, workout statistics (total workouts, minutes, volume, streak), recent sessions, quick-start templates, and sample training programs
- **Workouts** — Full workout log with search, category filtering (Strength, Running, Mobility, Cardio), inline delete, and a modal to add new sessions with duration and optional volume tracking
- **Training Plans** — Sample multi-week programs (Strength, 5K running, Mobility) with progress tracking
- **Progress** — Extended activity charts (1W/4W/12W ranges), weekly totals, per-category breakdowns, and milestone tracking

### Membership & Billing
- **Three tiers** — Free, Pro (£9.99/month), Elite (£24.99/month)
- **Stripe Checkout** — Secure, server-validated subscription creation with price verification (active, GBP, monthly)
- **Stripe Billing Portal** — Self-service subscription management (update payment method, cancel, switch plans)
- **Webhook-synchronized storage** — Only verified Stripe webhooks can modify subscription records in Supabase

### Personalization
- **Unit preferences** — Toggle between lb/kg for volume display
- **Notification toggles** — Workout reminders and weekly progress recaps (UI ready)
- **Responsive design** — Collapsible sidebar on desktop, bottom navigation bar on mobile (<640px)

### Data & Auth
- **Email/password authentication** via Supabase Auth
- **Row-Level Security** — All workout and subscription data scoped to the signed-in user
- **localStorage migration** — Previously saved workouts import on first cloud sign-in

## Tech Stack

| Category | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.9 |
| Runtime | React 19 |
| Styling | Tailwind CSS 4 |
| Database & Auth | Supabase (PostgreSQL + Auth + SSR) |
| Billing | Stripe (Checkout, Billing Portal, Webhooks) |
| Icons | Lucide React |
| Testing | Vitest + jsdom |
| Linting/Types | TypeScript strict mode, `npm run typecheck` |

## Getting Started

### Requirements
- Node.js 20.9+
- npm
- Supabase project
- Stripe account (for billing features)

### Install and Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file in the project root with the following variables:

```bash
# Supabase (required for auth & data)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SECRET_KEY=your-service-role-key  # Server-only secret — save as "Sensitive" in Vercel

# Stripe (required for billing)
STRIPE_SECRET_KEY=sk_test_...           # Server-only secret — save as "Sensitive" in Vercel
STRIPE_WEBHOOK_SECRET=whsec_...         # Server-only secret — save as "Sensitive" in Vercel
STRIPE_PRO_PRICE_ID=price_...   # £9.99/month recurring
STRIPE_ELITE_PRICE_ID=price_... # £24.99/month recurring

# App
APP_URL=http://localhost:3000   # Local dev. Production: https://fitbuzz-xfab.vercel.app (HTTPS required)
```

> **App URL resolution**: `APP_URL` is used for Stripe Checkout/Billing Portal redirects and
> trusted-origin checks. It is resolved in this order:
> 1. `APP_URL` (`http://localhost:3000` locally, `https://fitbuzz-xfab.vercel.app` in production)
> 2. Vercel's auto-injected `VERCEL_PROJECT_PRODUCTION_URL`, then `VERCEL_URL`
> 3. `http://localhost:3000` fallback
>
> So set `APP_URL=http://localhost:3000` in `.env.local` for local work, and set
> `APP_URL=https://fitbuzz-xfab.vercel.app` in the Vercel dashboard (Settings → Environment Variables)
> for production. Non-HTTPS values throw in production.

> **Note**: There is no `.env.example` file in the repo. Create `.env.local` manually using the template above.

### Supabase Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Apply migrations** in the Supabase SQL Editor (in order):
   - `supabase/migrations/20260926000000_create_workouts.sql`
   - `supabase/migrations/20260927000000_create_subscriptions.sql`
3. **Configure Auth**:
   - Site URL: `http://localhost:3000` (use `https://fitbuzz-xfab.vercel.app` in production)
   - Add redirect URLs: `http://localhost:3000/**` and `https://fitbuzz-xfab.vercel.app/**` for email confirmation
   - Enable Email provider
4. **Get keys**: Copy the Project URL and `anon` key to `.env.local`. Copy the `service_role` key as `SUPABASE_SECRET_KEY`.

The migrations create:
- `public.workouts` — user-scoped workout log with RLS policies
- `public.subscriptions` — user-scoped subscription status (readable by user, writable only by service role)

### Stripe Billing Setup

1. **Create Products & Prices** in Stripe Dashboard:
   - Product "Pro" → Recurring price **£9.99 GBP / month** → copy Price ID to `STRIPE_PRO_PRICE_ID`
   - Product "Elite" → Recurring price **£24.99 GBP / month** → copy Price ID to `STRIPE_ELITE_PRICE_ID`
2. **Configure Webhook**:
   - Endpoint: `${APP_URL}/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy signing secret to `STRIPE_WEBHOOK_SECRET`
3. **Enable Billing Portal**:
   - Configure cancellation, payment method updates, and plan switching for Pro/Elite prices
4. **Local testing**:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Use the printed `whsec_...` secret as `STRIPE_WEBHOOK_SECRET`.

> **Security**: Checkout and Billing Portal require an authenticated FitBuzz account. Subscription records are only updated by verified Stripe webhooks using the service-role Supabase client. Browser clients never write subscription data.

### Deploying to Vercel

1. **Import the repo** at [vercel.com/new](https://vercel.com/new) and add the environment variables below
   for **Production** and **Preview**. Only `NEXT_PUBLIC_*` values are inlined into the browser bundle;
   everything else is server-only:

   | Variable | Environments | Save as Sensitive? |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | No — public by design |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development | No — public by design |
   | `SUPABASE_SECRET_KEY` | Production, Preview | **Yes** |
   | `STRIPE_SECRET_KEY` | Production, Preview | **Yes** |
   | `STRIPE_WEBHOOK_SECRET` | Production, Preview | **Yes** |
   | `STRIPE_PRO_PRICE_ID`, `STRIPE_ELITE_PRICE_ID` | Production, Preview | Optional |
   | `APP_URL` | Production (`https://…`, HTTPS enforced) | No |

2. **Sensitive vs plain text.** While adding a variable, expand it and enable **Sensitive** (lock icon).
   Vercel then stores it write-only, so it cannot be read back from the dashboard — which is what you want
   for `SUPABASE_SECRET_KEY`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET`.

   If Vercel shows *"…looks like a secret, but its value is visible to anyone with access. Consider rotating
   at the source and saving as Secret"*, the value was stored as **plain text** (usually from a bulk `.env`
   paste or import), so anyone with project access can read it. Fix it like this:
   1. **Rotate at the source** (a Vercel-only edit is not enough — the old value is already exposed):
      - Supabase → **Project Settings → API Keys** → create a new secret key, then revoke the old `sb_secret_…` key
      - Stripe → **Developers → API keys** → roll the secret key
      - Stripe → **Developers → Webhooks** → roll the endpoint's signing secret
   2. **Update Vercel**: delete the affected variable and re-add it with **Sensitive** enabled, or click
      **Rotate Variable** in the warning and paste the new value with **Sensitive** checked.
   3. **Update `.env.local`** with the rotated values and restart `npm run dev`.
   4. **Redeploy** so the new values are baked into the deployment.

   > Sensitive values cannot be retrieved later (including via `vercel env pull`), so keep them in
   > `.env.local` — it is gitignored (`.gitignore` → `.env*`) and must never be committed.

3. **Supabase Auth**: add `https://fitbuzz-xfab.vercel.app/**` to **Authentication → URL Configuration →
   Redirect URLs** and set the Site URL to the production origin.

4. **Stripe webhook**: point the endpoint at `https://fitbuzz-xfab.vercel.app/api/stripe/webhook` and store
   the resulting signing secret as `STRIPE_WEBHOOK_SECRET` (step 2).

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server (Turbopack) |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | Run TypeScript checks without emitting files |
| `npm run test` | Run unit tests with Vitest |
| `npm run test:watch` | Run tests in watch mode |

## Project Structure

```text
fitbuzz/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── billing-portal/route.ts   # Stripe Billing Portal session
│   │   │   ├── checkout/route.ts         # Stripe Checkout session
│   │   │   └── stripe/webhook/route.ts   # Stripe webhook handler
│   │   ├── globals.css                   # Tailwind + custom design system
│   │   ├── layout.tsx                    # Root layout, metadata
│   │   └── page.tsx                      # Main dashboard (client component)
│   ├── components/
│   │   ├── auth-form.tsx                 # Sign in / sign up form
│   │   └── dashboard/
│   │       ├── goal-row.tsx              # Progress goal row
│   │       ├── page-heading.tsx          # Page heading with action button
│   │       ├── setting-row.tsx           # Settings row component
│   │       ├── stat-card.tsx             # Statistic card
│   │       └── workout-list.tsx          # Workout list with filters
│   ├── lib/
│   │   ├── billing/
│   │   │   ├── stripe.ts                 # Stripe client & plan config
│   │   │   └── stripe.test.ts            # Unit tests for billing logic
│   │   ├── supabase/
│   │   │   ├── admin.ts                  # Service-role Supabase client
│   │   │   ├── client.ts                 # Browser Supabase client
│   │   │   ├── database.types.ts         # Generated database types
│   │   │   ├── server.ts                 # Server Supabase client (cookies)
│   │   │   └── workouts.ts               # Workout CRUD queries
│   │   └── types/
│   │       ├── subscription.ts           # Subscription tier types
│   │       ├── subscription.test.ts      # Subscription type tests
│   │       └── workout.ts                # Workout types
│   └── proxy.ts                          # Auth cookie refresh endpoint
├── supabase/
│   └── migrations/
│       ├── 20260926000000_create_workouts.sql
│       └── 20260927000000_create_subscriptions.sql
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

## Data Model

### Workout
```typescript
type Workout = {
  id: string;
  title: string;
  category: "Strength" | "Running" | "Mobility" | "Cardio";
  duration: number;        // minutes (1–600)
  volume: number;          // weight moved in lb/kg (0–100000)
  date: string;            // ISO date (YYYY-MM-DD)
};
```

### Subscription
```typescript
type SubscriptionTier = "free" | "pro" | "elite";

type SubscriptionSummary = {
  tier: SubscriptionTier;
  status: string;                    // Stripe subscription status
  stripe_subscription_id: string | null;
  current_period_end: string | null; // ISO timestamp
};
```

Database tables enforce constraints:
- `workouts`: category enum, duration 1–600, volume 0–100000
- `subscriptions`: tier enum (free/pro/elite), status enum (Stripe statuses)