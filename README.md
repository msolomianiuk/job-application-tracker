# Job Application Tracker

A simple job application tracker built with Next.js 15 that helps users manage their job search process with user authentication and cloud-based data persistence. Hosted at [https://job-application-tracker-self.vercel.app](https://job-application-tracker-self.vercel.app)

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

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- Bun (recommended for package management)
- A Supabase account

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd job-application-tracker
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Create a Supabase project at [https://supabase.com](https://supabase.com)

4. Copy the environment variables:
   - Copy `.env.example` to `.env.local` (if exists, otherwise create `.env.local`)
   - Fill in your Supabase credentials:

     ```
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```

5. Run the SQL schema:
   - Go to your Supabase project's SQL Editor
   - Run the contents of `supabase/schema.sql`

6. (Optional) Enable Google OAuth in Supabase Auth settings

7. Start the development server:

   ```bash
   bun run dev
   ```

8. Open [http://localhost:3000](http://localhost:3000) in your browser

## Testing

### E2E Tests

The project includes end-to-end tests using pytest-playwright.

#### Setup

1. Install Python dependencies:

   ```bash
   pip install -r requirements.txt
   ```

2. Install Playwright browsers:

   ```bash
   playwright install chromium
   ```

3. Configure test user credentials in `.env.local`:

   ```
   TEST_USER_EMAIL=your-test-user@example.com
   TEST_USER_PASSWORD=your-test-password
   ```

   Note: Create a test user in your Supabase project for running tests.

#### Running Tests

1. Start the development server:

   ```bash
   bun run dev
   ```

2. In a separate terminal, run tests:

   ```bash
   bun run test:e2e           # Run all tests
   bun run test:e2e:headed    # Run with visible browser
   bun run test:e2e:smoke     # Run only smoke tests
   ```

   Note: The base URL (<http://localhost:3000>) is configured in `pytest.ini`.

#### Allure Reports

The project uses Allure for beautiful HTML test reports with detailed test execution history, screenshots, and step-by-step breakdowns.

1. After running tests, generate and view the report:

   ```bash
   bun run allure:serve       # Generate and open report in browser
   ```

   Or generate a static report:

   ```bash
   bun run allure:generate    # Generate static HTML report
   bun run allure:open        # Open the generated report
   ```

2. Install Allure CLI (if not already installed):

   ```bash
   # macOS
   brew install allure

   # Linux
   sudo apt-add-repository ppa:qameta/allure
   sudo apt-get update
   sudo apt-get install allure

   # Windows
   scoop install allure
   ```

Allure reports include:

- Test execution timeline and duration
- Feature and story organization
- Severity levels (Critical, Normal, Minor)
- Step-by-step test execution details
- Screenshots on failures (when configured)
- Historical trends across test runs

#### Test Markers

- `@pytest.mark.smoke` - Critical path tests
- `@pytest.mark.critical` - Important functionality tests
- `@pytest.mark.auth` - Authentication-related tests

#### CI/CD

E2E tests run automatically on:

- Push to `main` or `develop` branches (GitHub Actions with local build)
- Pull requests to `main` or `develop` (Vercel preview deployments)
- Manual workflow dispatch

Required GitHub secrets:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `TEST_USER_EMAIL`
- `TEST_USER_PASSWORD`

The Vercel integration workflow waits for preview deployments to complete, then runs E2E tests against the live preview URL.

**Branch Protection**: To make E2E tests required before merging, enable branch protection rules in GitHub Settings → Branches and require the "E2E Tests / e2e-tests" status check.

## Available Scripts

- `bun run dev` - Start the development server
- `bun run build` - Build the project for production
- `bun run start` - Start the production server
- `bun run lint` - Run ESLint
- `bun run test:e2e` - Run E2E tests (requires app running on localhost:3000)
- `bun run test:e2e:headed` - Run E2E tests with browser visible
- `bun run test:e2e:smoke` - Run only smoke tests
- `bun run allure:serve` - Generate and open Allure report in browser
- `bun run allure:generate` - Generate static Allure HTML report
- `bun run allure:open` - Open the generated Allure report

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

## Deployment

This project is configured for deployment. Ensure your environment variables are set in your deployment platform.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `bun run lint` to ensure code quality
5. Submit a pull request

## License

This project is private.
