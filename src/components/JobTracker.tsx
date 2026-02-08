'use client';

import { useState, useCallback } from 'react';
import { JobApplication, JobInsert, JobUpdate } from '@/types/job';
import JobForm from './JobForm';
import JobList from './JobList';

interface JobTrackerProps {
  initialJobs: JobApplication[];
}

export default function JobTracker({ initialJobs }: JobTrackerProps) {
  const [jobs, setJobs] = useState<JobApplication[]>(initialJobs);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div>
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg">
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

      <JobList
        jobs={jobs}
        onUpdate={handleUpdateJob}
        onDelete={handleDeleteJob}
      />
    </div>
  );
}
