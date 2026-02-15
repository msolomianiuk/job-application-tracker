import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import JobTracker from '@/components/JobTracker';

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch initial jobs
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 py-4 sm:py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <JobTracker initialJobs={jobs || []} user={user} />
      </div>
    </main>
  );
}
