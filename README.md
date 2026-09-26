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
    page.tsx                    Dashboard views and workout interactions
  components/
    dashboard/
      goal-row.tsx              Reusable progress goal row
      page-heading.tsx          Reusable page heading
      setting-row.tsx           Reusable settings row
      stat-card.tsx             Reusable statistic card
      workout-list.tsx          Reusable workout list
  lib/
    types/
      workout.ts                Shared workout type
```

## Data and Authentication

Workout entries are stored in the current browser using `localStorage`; they are not synchronized between devices or users. Training plans and some progress values are sample dashboard content. Authentication and a remote database are not currently configured, and the app does not require environment variables to run locally.

## Validation

Before publishing changes, run:

```bash
npm run typecheck
npm run build
```