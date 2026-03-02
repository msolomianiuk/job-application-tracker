# Job Application Tracker

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://job-application-tracker-self.vercel.app)
[![E2E Tests](https://github.com/msolomianiuk/job-application-tracker/actions/workflows/e2e-tests.yml/badge.svg)](https://github.com/msolomianiuk/job-application-tracker/actions/workflows/e2e-tests.yml)
[![Lint](https://github.com/msolomianiuk/job-application-tracker/actions/workflows/lint.yml/badge.svg)](https://github.com/msolomianiuk/job-application-tracker/actions/workflows/lint.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Full-stack job application tracker built with Next.js 15 and Supabase.

Track applications through a 5-stage lifecycle, auto-fill data from job posting URLs, and export your applications as a printable HTML file.

Live app: [https://job-application-tracker-self.vercel.app](https://job-application-tracker-self.vercel.app)

## Features

- URL auto-fill via `/api/scrape` (LinkedIn, Indeed, Glassdoor, Greenhouse, Lever, DOU.ua, Work.ua + generic fallback)
- Full CRUD for job applications
- Status lifecycle: `saved`, `applied`, `interviewing`, `offered`, `rejected`
- Search, filter, and sort in the UI
- Duplicate URL protection per user
- HTML export with summary stats
- Supabase Auth (email/password + optional Google OAuth)
- Supabase PostgreSQL with Row Level Security

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- Supabase (Auth + Postgres)
- Bun (package manager/runtime)
- pytest + Playwright (E2E)
- GitHub Actions + Vercel

## Quick Start

### 1. Prerequisites

- [Bun](https://bun.sh)
- Node.js 20+ (recommended for tooling compatibility)
- Python 3.11+ (E2E tests only)
- A [Supabase](https://supabase.com) project

### 2. Clone and Install

```bash
git clone https://github.com/msolomianiuk/job-application-tracker.git
cd job-application-tracker
bun install
```

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Set these values in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

For local E2E tests, also set:

```bash
TEST_USER_EMAIL=your-test-user@example.com
TEST_USER_PASSWORD=your-test-user-password
```

### 4. Initialize Database

Run [`supabase/schema.sql`](supabase/schema.sql) in your Supabase SQL Editor.

### 5. Run the App

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `bun run dev` - Start dev server
- `bun run build` - Build production bundle
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run test:e2e` - Run all E2E tests
- `bun run test:e2e:headed` - Run E2E with visible browser
- `bun run test:e2e:smoke` - Run smoke tests only
- `bun run test:coverage:report` - Generate NYC coverage report from `.nyc_output`
- `bun run allure:serve` - Generate and open Allure report
- `bun run allure:generate` - Generate static Allure report
- `bun run allure:open` - Open generated Allure report

## Testing

### Local E2E Setup

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

2. Install Playwright browser:

```bash
playwright install chromium
```

3. Start the app in one terminal:

```bash
bun run dev
```

4. Run tests in another terminal:

```bash
bun run test:e2e
```

`pytest.ini` defaults `--base-url=http://localhost:3000`.

### Allure Reports

```bash
bun run allure:serve
```

## CI/CD Workflows

Workflows in `.github/workflows/`:

- `lint.yml` - ESLint on push/PR (`main`, `develop`)
- `e2e-tests.yml` - E2E on push/PR + manual trigger; generates Allure and coverage artifacts
- `vercel-e2e.yml` - Runs E2E against Vercel preview deployments for PRs
- `deploy-vercel.yml` - Deploys to production when `E2E Tests` succeeds on `main`

### Required GitHub Secrets

Supabase + test:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `TEST_USER_EMAIL`
- `TEST_USER_PASSWORD`

Vercel deploy:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Project Structure

```text
.
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── jobs/route.ts       # Authenticated CRUD API
│   │   │   └── scrape/route.ts     # Job URL metadata extraction
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── callback/route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── JobForm.tsx
│   │   ├── JobList.tsx
│   │   ├── JobCard.tsx
│   │   └── JobTracker.tsx
│   ├── lib/supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   └── types/job.ts
├── supabase/schema.sql
├── tests/e2e/
└── .github/workflows/
```

## Troubleshooting

- `401 Unauthorized` on API calls:
  - Confirm you are logged in and Supabase URL/key are correct.
- E2E tests skip auth tests:
  - Confirm `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` exist in `.env.local`.
- URL auto-fill fails for some postings:
  - Some sites block scraping or serve dynamic content not present in initial HTML.

## Deployment

Production deploys to Vercel are handled by GitHub Actions (`deploy-vercel.yml`) after successful E2E on `main`.

Manual deployment is also possible with Vercel CLI:

```bash
vercel link
vercel --prod
```

## Contributing

1. Create a branch from `develop`
2. Make changes
3. Run:

```bash
bun run lint
bun run test:e2e
```

4. Open a pull request to `develop`

## License

MIT - see [LICENSE](LICENSE).
