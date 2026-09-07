# Life OS

A calm, all-in-one personal life-management app: dashboard, calendar, tasks, habits, goals, finance, wellness, journal, and weekly review — built with Next.js (App Router), TypeScript, Tailwind CSS, Prisma/PostgreSQL, and NextAuth.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (warm cream/sage "Life Planner" design system)
- Prisma ORM + PostgreSQL
- NextAuth.js — Credentials (email/password + bcrypt) and optional Google OAuth
- TanStack Query for data fetching, Zustand for light client state

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

- `prisma/schema.prisma` — full data model (User, Event, Task, Habit/HabitLog, Goal/Objective/WeeklyTarget, WellnessLog, FinanceAccount/Transaction/Budget, JournalEntry, WeeklyReview)
- `prisma/seed.ts` — demo data seed script
- `src/app/(auth)` — login/signup pages
- `src/app/(app)` — authenticated app shell + pages (dashboard, calendar, tasks, goals, habits, finance, wellness, journal, weekly-review)
- `src/app/api` — REST-ish route handlers backing every module
- `src/components` — UI, organized per module
- `src/lib` — Prisma client, NextAuth config, small utils
- `src/store` — Zustand stores (e.g. daily priority selection)

## Future hooks

The codebase marks intentional extension points for later versions:

- `// V2: cross-area analytics hook` — cross-module rollups on the dashboard/weekly review
- `// V3: AI planning assistant hook` — an AI planner consuming weekly reviews/tasks
- `// V4: wearable/health integration hook` — device-synced wellness data
