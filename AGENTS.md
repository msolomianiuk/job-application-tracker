# AGENTS.md

## Commands
- **Dev**: `bun run dev`
- **Build/Typecheck**: `bun run build`
- **Lint**: `bun run lint`
- **Install**: `bun install`

## Architecture
- **Framework**: Next.js 15 App Router with React 19, TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **Auth & DB**: Supabase (PostgreSQL with RLS, email/password + Google OAuth)
- **API Routes**: `src/app/api/jobs/` (CRUD), `src/app/api/scrape/` (URL scraping)
- **Supabase Clients**: `src/lib/supabase/client.ts` (browser), `src/lib/supabase/server.ts` (server)

## Code Style
- Use `@/*` path alias for imports (maps to `src/*`)
- Use TypeScript interfaces/types from `src/types/`
- Components in `src/components/`, pages in `src/app/`
- snake_case for database fields, camelCase for JS/TS variables
- ESLint: `next/core-web-vitals` + `next/typescript`
- No tests configured in this project
