import { createClient } from '@/lib/supabase/server';
import { getUserClaims } from '@/lib/supabase/claims';
import { redirect } from 'next/navigation';
import JobTracker from '@/components/JobTracker';

export default async function Home() {
  const supabase = await createClient();

  // Verified locally from the JWT — no Auth server round-trip
  // (middleware already refreshed the session).
  const claims = await getUserClaims(supabase);

  if (!claims) {
    redirect('/auth/login');
  }

  // Fetch initial jobs
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', claims.sub)
    .order('created_at', { ascending: false });

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 py-4 sm:py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <JobTracker
          initialJobs={jobs || []}
          user={{ id: claims.sub, email: claims.email }}
        />
      </div>
    </main>
  );
}
