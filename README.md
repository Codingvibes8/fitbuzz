# FitBuzz

FitBuzz is a responsive workout-tracking dashboard built with Next.js, React, and TypeScript. It helps you log training sessions, review weekly activity, follow sample training plans, and track personal settings.

## Features

- Overview with weekly activity, workout statistics, and recent sessions
- Workout log with quick-start templates, search, category filtering, and delete actions
- Sample training plans and progress views
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
3. Apply `supabase/migrations/20260926000000_create_workouts.sql` in the Supabase SQL Editor.
4. Set the Supabase Auth site URL to `http://localhost:3000` and allow that URL as a redirect for email confirmation.
5. Restart the development server and sign up with an email address.

The migration creates the `workouts` table and row-level security policies. Do not put a Supabase service-role key in a `NEXT_PUBLIC_` variable.

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

Email/password authentication and workout storage use Supabase. Workout queries are scoped to the signed-in user, with row-level security enforced by the database migration. Previously saved workouts in `localStorage` are imported when the signed-in account has no cloud workouts; the local copy is removed only after a successful import. Training plans, progress milestones, and settings are still sample or browser-only content and are not yet stored in Supabase.

## Validation

Before publishing changes, run:

```bash
npm run typecheck
npm run build
```