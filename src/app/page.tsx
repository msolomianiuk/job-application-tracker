import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import JobTracker from '@/components/JobTracker';
import AuthButton from '@/components/AuthButton';

export default async function Home() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

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
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Job Application Tracker
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your job applications in one place. Paste a job posting URL to auto-fill details.
            </p>
          </div>
          <AuthButton user={user} />
        </div>

        {/* Job Tracker Component */}
        <JobTracker initialJobs={jobs || []} />
      </div>
    </main>
  );
}
