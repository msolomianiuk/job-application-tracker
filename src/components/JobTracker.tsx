'use client';

import { useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { JobApplication, JobInsert, JobUpdate } from '@/types/job';
import JobForm from './JobForm';
import JobList from './JobList';
import CvPanel from './CvPanel';

interface JobTrackerProps {
  initialJobs: JobApplication[];
  user: { id: string; email?: string };
}

export default function JobTracker({ initialJobs, user }: JobTrackerProps) {
  const [jobs, setJobs] = useState<JobApplication[]>(initialJobs);
  const [isLoading, setIsLoading] = useState(false);
  const [isJobFormExpanded, setIsJobFormExpanded] = useState(false);
  const [collapsedPanelHeight, setCollapsedPanelHeight] = useState<number>();
  const [error, setError] = useState<string | null>(null);
  const jobFormColumnRef = useRef<HTMLDivElement>(null);
  const isJobFormExpandedRef = useRef(false);
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

  const handleJobFormExpandedChange = useCallback((expanded: boolean) => {
    if (expanded === isJobFormExpandedRef.current) return;

    if (expanded) {
      const collapsedHeight =
        jobFormColumnRef.current?.getBoundingClientRect().height;
      if (collapsedHeight) setCollapsedPanelHeight(collapsedHeight);
    }

    isJobFormExpandedRef.current = expanded;
    setIsJobFormExpanded(expanded);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Navigation Bar */}
      <div className="bg-slate-900 text-white px-4 py-2 rounded-lg shadow-md flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-3">
          <Link
            href="/"
            className="shrink-0 text-lg font-bold hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-sm transition-colors"
          >
            Job Application Tracker
          </Link>
          <p className="min-w-0 truncate text-xs text-gray-400">
            Track your job applications in one place. Paste a job posting URL to auto-fill details.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-xs text-gray-300 break-all hidden md:block">{user.email}</div>
          <button
            onClick={handleSignOut}
            className="px-3 py-1.5 text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-md transition-colors"
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

      {/* Main Content */}
      <div className="space-y-6">
        <div
          className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${
            isJobFormExpanded ? 'lg:items-start' : 'lg:items-stretch'
          }`}
        >
          <div ref={jobFormColumnRef} className="lg:col-span-2">
            <JobForm
              onAddJob={handleAddJob}
              isLoading={isLoading}
              onExpandedChange={handleJobFormExpandedChange}
            />
          </div>
          <CvPanel
            userId={user.id}
            lockedHeight={
              isJobFormExpanded ? collapsedPanelHeight : undefined
            }
          />
        </div>
        <JobList
          jobs={jobs}
          onUpdate={handleUpdateJob}
          onDelete={handleDeleteJob}
        />
      </div>
    </div>
  );
}
