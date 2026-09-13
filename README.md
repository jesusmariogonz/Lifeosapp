# Life OS

A calm, all-in-one personal life-management app: dashboard, calendar, tasks, habits, goals, finance, wellness, journal, weekly review, cross-area analytics, an AI planning assistant, relationships, and integrations — built with Next.js (App Router), TypeScript, Tailwind CSS, Prisma/PostgreSQL, and NextAuth.

## Features

- **Dashboard** — "My Life Today" rollup of tasks, events, habits, wellness, journal, and upcoming important dates
- **Calendar, Tasks, Habits, Goals, Finance, Wellness, Journal, Weekly Review** — full CRUD modules
- **Analytics** (`/analytics`) — real charts computed from your data: habit trends, task velocity, wellness and mood trends, income/expenses, spending by category, and simple honest correlations (e.g. mood on habit vs non-habit days, stress vs sleep)
- **Assistant** (`/assistant`) — a chat-style AI planning assistant grounded in your real tasks/events/habits/goals/wellness/journal, plus a "Generate today's plan" action you can accept into your 3 daily priorities
- **Relationships** (`/relationships`) — contacts with important dates (birthdays, anniversaries) that surface on the Calendar and Dashboard
- **Integrations** (`/integrations`) — honest "Coming soon" cards for Apple Health/Google Fit and Travel sync; Wellness logs already carry a `source` field ("manual" today, ready for synced sources later)

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (warm cream/sage "Life Planner" design system)
- Prisma ORM + PostgreSQL
- NextAuth.js — Credentials (email/password + bcrypt) and optional Google OAuth
- TanStack Query for data fetching, Zustand for light client state
- Recharts for analytics charts
- `@anthropic-ai/sdk` (model `claude-sonnet-5`) for the AI planning assistant

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment file and fill in your values:

   ```bash
   cp .env.example .env
   ```

   Required env vars:
   - `DATABASE_URL` — PostgreSQL connection string
   - `NEXTAUTH_SECRET` — any random string (`openssl rand -base64 32`)
   - `NEXTAUTH_URL` — e.g. `http://localhost:3000`

   Optional (Google sign-in):
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXT_PUBLIC_GOOGLE_ENABLED="true"` to show the Google button

   Optional (AI Planning Assistant):
   - `ANTHROPIC_API_KEY` — your Anthropic API key. Without it, `/assistant` shows a friendly "AI assistant not configured" state; everything else in the app works normally.

   Optional (production demo seeding):
   - `ADMIN_SEED_SECRET` — a random secret. When set, `POST /api/admin/seed` with header `x-seed-secret: <that value>` (re)creates the `demo@lifeos.app` demo account and its data. Useful on hosts like Vercel where you can't run `npm run seed` directly against the production database. Leave unset to disable the endpoint (it 401s with no secret configured).

3. Push the schema to your database and generate the Prisma client:

   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. Seed demo data (creates `demo@lifeos.app` / `demo1234` with mock events, tasks, habits, wellness logs, finances, journal entries, and a weekly review):

   ```bash
   npm run seed
   ```

5. Run the dev server:

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000`, sign in with the demo account, or sign up for a new one.

## Build

```bash
npm run build
npm run start
```

## Project structure

- `prisma/schema.prisma` — full data model (User, Event, Task, Habit/HabitLog, Goal/Objective/WeeklyTarget, WellnessLog, FinanceAccount/Transaction/Budget, JournalEntry, WeeklyReview, Contact/ImportantDate)
- `prisma/seed.ts` — demo data seed script
- `src/app/(auth)` — login/signup pages
- `src/app/(app)` — authenticated app shell + pages (dashboard, calendar, tasks, goals, habits, finance, wellness, journal, weekly-review, analytics, assistant, relationships, integrations)
- `src/app/api` — REST-ish route handlers backing every module, including `/api/analytics`, `/api/assistant/chat`, `/api/assistant/plan`, `/api/contacts`
- `src/components` — UI, organized per module
- `src/lib` — Prisma client, NextAuth config, Anthropic client + user-context builder, small utils
- `src/store` — Zustand stores (e.g. daily priority selection)

## Real integration hook points

`/integrations` and the Wellness module mark where real OAuth-backed sync would plug in:

- `// V4: wire real Apple HealthKit / Google Fit OAuth here` — `WellnessLog.source` already distinguishes "manual" from future synced sources
- `// V4: wire real travel API here` — trips would create/annotate Calendar events and flag travel days on Wellness trends
