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
SUPABASE_SECRET_KEY=your-service-role-key  # Server-only, for webhooks & admin API

# Stripe (required for billing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...   # £9.99/month recurring
STRIPE_ELITE_PRICE_ID=price_... # £24.99/month recurring

# App
APP_URL=http://localhost:3000   # Use HTTPS in production
```

> **Note**: There is no `.env.example` file in the repo. Create `.env.local` manually using the template above.

### Supabase Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Apply migrations** in the Supabase SQL Editor (in order):
   - `supabase/migrations/20260926000000_create_workouts.sql`
   - `supabase/migrations/20260927000000_create_subscriptions.sql`
3. **Configure Auth**:
   - Site URL: `http://localhost:3000` (or your production URL)
   - Add redirect URL: `http://localhost:3000/**` for email confirmation
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