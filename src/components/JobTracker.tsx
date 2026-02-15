'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { JobApplication, JobInsert, JobUpdate } from '@/types/job';
import JobForm from './JobForm';
import JobList from './JobList';

interface JobTrackerProps {
  initialJobs: JobApplication[];
  user: User;
}

export default function JobTracker({ initialJobs, user }: JobTrackerProps) {
  const [jobs, setJobs] = useState<JobApplication[]>(initialJobs);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  const handleAddJob = useCallback(async (jobData: JobInsert) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add job');
      }

      const { job } = await response.json();
      setJobs((prev) => [job, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add job');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleUpdateJob = useCallback(async (id: string, updates: JobUpdate) => {
    setError(null);

    try {
      const response = await fetch('/api/jobs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update job');
      }

      const { job } = await response.json();
      setJobs((prev) =>
        prev.map((j) => (j.id === id ? job : j)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job');
      throw err;
    }
  }, []);

  const handleDeleteJob = useCallback(async (id: string) => {
    setError(null);

    try {
      const response = await fetch(`/api/jobs?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete job');
      }

      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete job');
      throw err;
    }
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar */}
      <div className="w-full lg:w-1/3 space-y-6">
        {/* Header Card */}
        <div className="bg-slate-900 text-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-2">
            Job
            <br />
            Application
            <br />
            Tracker
          </h1>
          <p className="text-gray-400 text-sm mb-6">
            Track your job applications in one place. Paste a job posting URL to
            auto-fill details.
          </p>

          <div className="flex flex-col gap-4 pt-4 border-t border-gray-700">
            <div className="text-sm text-gray-300 break-all">{user.email}</div>
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-md transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        <JobForm onAddJob={handleAddJob} isLoading={isLoading} />
      </div>

      {/* Main Content */}
      <div className="w-full lg:w-2/3 min-w-0">
        <JobList
          jobs={jobs}
          onUpdate={handleUpdateJob}
          onDelete={handleDeleteJob}
        />
      </div>
    </div>
  );
}
