# FitBuzz

FitBuzz is a responsive workout-tracking dashboard built with Next.js, React, and TypeScript. It helps you log training sessions, review weekly activity, follow sample training plans, and track personal settings.

## Features

- Overview with weekly activity, workout statistics, and recent sessions
- Workout log with quick-start templates, search, category filtering, and delete actions
- Sample training plans and progress views
- Free, Pro (£9.99/month), and Elite (£24.99/month) memberships with Stripe Checkout, Billing Portal, and webhook-synced subscription storage
- Unit preferences for workout volume
- Responsive navigation for desktop and mobile
- Workout data saved in the browser with `localStorage`

## Tech Stack

- Next.js 16 App Router
- React 19 and TypeScript
- Tailwind CSS 4
- Lucide React icons

## Getting Started

### Requirements

- Node.js 20.9 or newer
- npm

### Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Configure Supabase

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the project API settings.
3. Apply both SQL migrations in `supabase/migrations` in the Supabase SQL Editor.
4. Set the Supabase Auth site URL to `http://localhost:3000` and allow that URL as a redirect for email confirmation.
5. Restart the development server and sign up with an email address.

The migrations create the workout and subscription tables. Subscription rows are readable only by their owner; only the server-side Stripe webhook can change them. Use a Supabase `sb_secret_...` key as `SUPABASE_SECRET_KEY`. Never put this key or Stripe secrets in a `NEXT_PUBLIC_` variable.

### Configure Stripe billing

1. Create Stripe products with recurring monthly prices of **£9.99 GBP** (Pro) and **£24.99 GBP** (Elite). Put their Price IDs in `STRIPE_PRO_PRICE_ID` and `STRIPE_ELITE_PRICE_ID`; Checkout verifies each price is active and matches the expected GBP amount and interval.
2. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SECRET_KEY`, and `APP_URL` in `.env.local`. Use `APP_URL=http://localhost:3000` locally and your HTTPS app origin in production.
3. Add a Stripe webhook endpoint at `${APP_URL}/api/stripe/webhook` for `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted`.
4. Enable the Stripe Billing Portal and configure its cancellation, payment-method, and plan-switching options for the Pro and Elite prices.
5. For local webhook testing, run `stripe listen --forward-to localhost:3000/api/stripe/webhook` and use the signing secret it prints as `STRIPE_WEBHOOK_SECRET`.

Checkout and the Billing Portal require an authenticated FitBuzz account. Subscription status and renewal dates are updated from signed Stripe webhooks; browser clients cannot write subscription records.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run typecheck` | Run TypeScript checks without emitting files |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |

## Project Structure

```text
src/
  app/
    globals.css                 Global styles
    layout.tsx                  Root layout and page metadata
    page.tsx                    Authenticated dashboard and workout interactions
  components/
    auth-form.tsx               Email/password sign-in and registration
    dashboard/
      goal-row.tsx              Reusable progress goal row
      page-heading.tsx          Reusable page heading
      setting-row.tsx           Reusable settings row
      stat-card.tsx             Reusable statistic card
      workout-list.tsx          Reusable workout list
  lib/
    supabase/
      client.ts                 Browser Supabase client
      database.types.ts         Database row and mutation types
      server.ts                 Server Supabase client
      workouts.ts               User-scoped workout queries
    types/
      workout.ts                Shared workout type
  proxy.ts                      Refreshes Supabase auth cookies
supabase/
  migrations/                   Database schema and RLS policies
```

## Data and Authentication

Email/password authentication, workout storage, and subscription status use Supabase. Workout and subscription queries are scoped to the signed-in user with row-level security. Previously saved workouts in `localStorage` are imported when the signed-in account has no cloud workouts; the local copy is removed only after a successful import. Stripe Checkout handles new subscriptions, the Billing Portal handles existing billing accounts, and verified Stripe webhooks are the only path that updates stored tiers. Training plans, progress milestones, and settings remain sample or browser-only content.

## Validation

Before publishing changes, run:

```bash
npm run typecheck
npm run build
```