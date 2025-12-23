# Job Application Tracker

## Project Overview
A simple job application tracker built with Next.js 15 that helps users manage their job search process with user authentication and cloud-based data persistence.

## Key Features
1. **URL Scraping**: Automatically extract job title and company name from provided vacancy links
2. **User Authentication**: Email/password and Google OAuth sign-in via Supabase Auth
3. **Cloud Data Persistence**: All job data stored in Supabase PostgreSQL database, accessible from any browser when logged in

## Tech Stack
- **Framework**: Next.js 15 with App Router
- **React**: 19.x
- **Styling**: Tailwind CSS v4
- **TypeScript**: Fully typed
- **Authentication**: Supabase Auth (email/password + Google OAuth)
- **Database**: Supabase PostgreSQL with Row Level Security

## Architecture Decisions

### Data Persistence Strategy
Using Supabase for both authentication and data storage:
- User accounts with email/password or Google OAuth
- PostgreSQL database with Row Level Security (RLS)
- Data syncs automatically across all browsers when logged in

### URL Scraping Approach
Using server-side API route to:
1. Fetch the HTML content of the provided URL
2. Parse meta tags, JSON-LD structured data, and common patterns
3. Extract job title and company name
4. Return structured data to the client

### Authentication Flow
1. Users sign up/login via `/auth/login` or `/auth/signup`
2. Supabase handles session management via cookies
3. Middleware refreshes sessions automatically
4. Protected routes redirect to login if not authenticated

## Data Model

```typescript
interface JobApplication {
  id: string;           // UUID
  user_id: string;      // References auth.users
  url: string;
  job_title: string;
  company_name: string;
  status: 'saved' | 'applied' | 'interviewing' | 'offered' | 'rejected';
  notes: string;
  created_at: string;
  updated_at: string;
}
```

## Project Structure
```
├── middleware.ts                 # Session refresh middleware
├── supabase/
│   └── schema.sql               # Database schema with RLS policies
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── jobs/route.ts    # CRUD operations for jobs
│   │   │   └── scrape/route.ts  # URL scraping endpoint
│   │   ├── auth/
│   │   │   ├── login/page.tsx   # Login page
│   │   │   ├── signup/page.tsx  # Sign up page
│   │   │   └── callback/route.ts # OAuth callback handler
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx             # Main job tracker page (protected)
│   ├── components/
│   │   ├── AuthButton.tsx       # Sign in/out button
│   │   ├── JobCard.tsx          # Individual job display
│   │   ├── JobForm.tsx          # Form to add new job
│   │   ├── JobList.tsx          # List of all jobs
│   │   └── JobTracker.tsx       # Main tracker component
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts        # Browser Supabase client
│   │       ├── server.ts        # Server Supabase client
│   │       └── middleware.ts    # Session management
│   └── types/
│       └── job.ts               # TypeScript interfaces
```

## Setup Instructions

1. Create a Supabase project at https://supabase.com
2. Copy `.env.example` to `.env.local` and fill in your Supabase credentials
3. Run the SQL in `supabase/schema.sql` in your Supabase SQL Editor
4. (Optional) Enable Google OAuth in Supabase Auth settings
5. Run `bun install` and `bun run build`

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Changelog
- **2024-12-23**: Initial project setup with JSONBin.io
- **2024-12-23**: Migrated to Supabase for user accounts and data persistence
