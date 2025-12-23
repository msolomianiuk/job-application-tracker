'use client';

import { useState } from 'react';
import { JobApplication, JobStatus, JobUpdate } from '@/types/job';
import JobCard from './JobCard';

interface JobListProps {
  jobs: JobApplication[];
  onUpdate: (id: string, updates: JobUpdate) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

type SortOption = 'newest' | 'oldest' | 'company' | 'title';
type FilterOption = 'all' | JobStatus;

export default function JobList({ jobs, onUpdate, onDelete }: JobListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredJobs = jobs.filter((job) => {
    // Filter by status
    if (filterBy !== 'all' && job.status !== filterBy) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        job.job_title.toLowerCase().includes(query) ||
        job.company_name.toLowerCase().includes(query) ||
        job.notes.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'company':
        return a.company_name.localeCompare(b.company_name);
      case 'title':
        return a.job_title.localeCompare(b.job_title);
      default:
        return 0;
    }
  });

  const statusCounts = jobs.reduce(
    (acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    },
    {} as Record<JobStatus, number>
  );

  return (
    <div>
      {/* Stats Bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm">
          <span className="font-medium">{jobs.length}</span> Total
        </div>
        <div className="bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full text-sm text-blue-800 dark:text-blue-300">
          <span className="font-medium">{statusCounts.applied || 0}</span> Applied
        </div>
        <div className="bg-yellow-100 dark:bg-yellow-900 px-3 py-1 rounded-full text-sm text-yellow-800 dark:text-yellow-300">
          <span className="font-medium">{statusCounts.interviewing || 0}</span> Interviewing
        </div>
        <div className="bg-green-100 dark:bg-green-900 px-3 py-1 rounded-full text-sm text-green-800 dark:text-green-300">
          <span className="font-medium">{statusCounts.offered || 0}</span> Offered
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search jobs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
        <select
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value as FilterOption)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Status</option>
          <option value="saved">Saved</option>
          <option value="applied">Applied</option>
          <option value="interviewing">Interviewing</option>
          <option value="offered">Offered</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="company">By Company</option>
          <option value="title">By Title</option>
        </select>
      </div>

      {/* Job Cards */}
      {sortedJobs.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {jobs.length === 0 ? (
            <div>
              <p className="text-lg mb-2">No job applications yet</p>
              <p className="text-sm">Add your first job application above to get started!</p>
            </div>
          ) : (
            <p>No jobs match your search criteria</p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
