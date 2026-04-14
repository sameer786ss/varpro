# Digital Learning Support System

Full-stack digital learning platform built with Next.js App Router, Supabase, and Google GenAI (Gemma 3 27B IT).

## What This System Covers

- Students: Learning materials, assignments, quizzes, messaging, progress tracking
- Teachers/Instructors: Course publishing, assignments/quizzes, grading workflow, announcements
- Administrators: User role management, course governance, system-level oversight
- Institution Staff: Schedule and academic support operations
- External systems: Cloud data/storage (Supabase) and in-app notification workflows

## Technology Stack

- Frontend: Next.js 16, React 19, Tailwind CSS 4
- Backend/API: Next.js Route Handlers + Server Actions
- Database/Auth: Supabase PostgreSQL + Supabase Auth + Row-Level Security
- AI: Google GenAI SDK with `gemma-3-27b-it`
- Deployment: Vercel

## Free-Tier Friendly Services

- Supabase Free Plan
- Google AI Studio API key for GenAI
- Vercel hobby tier

## Project Structure

- `src/app/`: App Router pages, layouts, API route handlers
- `src/lib/`: Supabase clients, auth/session guards, domain services, and AI integration
- `src/components/`: UI primitives, app shell, dashboard and assistant components
- `supabase/migrations/`: SQL schema and RLS policies

## Environment Setup

1. Copy environment template:

```bash
cp .env.example .env.local
```

2. Fill all required values in `.env.local`.

## Database Setup (Supabase)

1. Create a Supabase project.
2. Open SQL Editor and run migration file:

```sql
supabase/migrations/202604140001_initial.sql
```

3. In Supabase Auth settings:

- Enable Email/Password auth
- Configure redirect URLs for local and production app domains

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build and Lint

```bash
npm run lint
npm run build
```

## Vercel Deployment

1. Push repository to GitHub.
2. Import project in Vercel.
3. Add the same environment variables from `.env.local`.
4. Set `APP_BASE_URL` to production domain.
5. Deploy.

## AI Tutor Configuration

- The tutor endpoint is at `POST /api/ai/tutor`
- Requests are server-side only (API key is never exposed to browser)
- Model configured through `GEMMA_MODEL` env var, default: `gemma-3-27b-it`

## Notes

- RLS policies are enabled for all core tables.
- Role-based access is enforced in both frontend routes and backend data policies.
- Course enrollment is handled directly through Supabase-backed actions.
