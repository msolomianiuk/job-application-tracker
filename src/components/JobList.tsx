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

const statusLabels: Record<JobStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offered: 'Offered',
  rejected: 'Rejected',
};

export default function JobList({ jobs, onUpdate, onDelete }: JobListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const escapeHtml = (text: string) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const exportToHTML = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job Applications Export - ${new Date().toLocaleDateString()}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2563eb;
      margin-bottom: 10px;
      font-size: 28px;
    }
    .export-date {
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .stats {
      display: flex;
      gap: 15px;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }
    .stat {
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
    }
    .stat-total { background: #e5e7eb; color: #374151; }
    .stat-saved { background: #f3f4f6; color: #4b5563; }
    .stat-applied { background: #dbeafe; color: #1e40af; }
    .stat-interviewing { background: #fef3c7; color: #92400e; }
    .stat-offered { background: #d1fae5; color: #065f46; }
    .stat-rejected { background: #fee2e2; color: #991b1b; }
    .job-list {
      display: grid;
      gap: 20px;
    }
    .job-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      background: #fafafa;
      transition: box-shadow 0.2s;
    }
    .job-card:hover {
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .job-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 12px;
      gap: 15px;
    }
    .job-title {
      font-size: 20px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 4px;
    }
    .company-name {
      font-size: 16px;
      color: #6b7280;
    }
    .status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }
    .status-saved { background: #e5e7eb; color: #374151; }
    .status-applied { background: #dbeafe; color: #1e40af; }
    .status-interviewing { background: #fef3c7; color: #92400e; }
    .status-offered { background: #d1fae5; color: #065f46; }
    .status-rejected { background: #fee2e2; color: #991b1b; }
    .job-link {
      display: inline-block;
      color: #2563eb;
      text-decoration: none;
      margin-bottom: 10px;
      font-size: 14px;
      word-break: break-all;
    }
    .job-link:hover {
      text-decoration: underline;
    }
    .job-notes {
      color: #4b5563;
      font-size: 14px;
      margin-bottom: 10px;
      white-space: pre-wrap;
    }
    .job-footer {
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #9ca3af;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .container {
        box-shadow: none;
        padding: 0;
      }
      .job-card {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Job Applications</h1>
    <p class="export-date">Exported on ${new Date().toLocaleString()}</p>
    
    <div class="stats">
      <div class="stat stat-total"><strong>${jobs.length}</strong> Total</div>
      <div class="stat stat-saved"><strong>${statusCounts.saved || 0}</strong> Saved</div>
      <div class="stat stat-applied"><strong>${statusCounts.applied || 0}</strong> Applied</div>
      <div class="stat stat-interviewing"><strong>${statusCounts.interviewing || 0}</strong> Interviewing</div>
      <div class="stat stat-offered"><strong>${statusCounts.offered || 0}</strong> Offered</div>
      <div class="stat stat-rejected"><strong>${statusCounts.rejected || 0}</strong> Rejected</div>
    </div>

    <div class="job-list">
      ${sortedJobs
    .map(
      (job) => `
        <div class="job-card">
          <div class="job-header">
            <div>
              <div class="job-title">${escapeHtml(job.job_title)}</div>
              <div class="company-name">${escapeHtml(job.company_name)}</div>
            </div>
            <span class="status-badge status-${job.status}">${statusLabels[job.status]}</span>
          </div>
          ${job.url ? `<a href="${escapeHtml(job.url)}" target="_blank" rel="noopener noreferrer" class="job-link">${escapeHtml(job.url)}</a>` : ''}
          ${job.notes ? `<div class="job-notes">${escapeHtml(job.notes)}</div>` : ''}
          <div class="job-footer">
            Added on ${new Date(job.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      `,
    )
    .join('')}
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-applications-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case 'oldest':
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
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
    {} as Record<JobStatus, number>,
  );

  return (
    <div>
      {/* Stats Bar */}
      <div className="flex flex-wrap gap-2 mb-4 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm">
            <span className="font-medium">{jobs.length}</span> Total
          </div>
          <div className="bg-gray-200 dark:bg-gray-600 px-3 py-1 rounded-full text-sm text-gray-800 dark:text-gray-200">
            <span className="font-medium">{statusCounts.saved || 0}</span>{' '}
            Saved
          </div>
          <div className="bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full text-sm text-blue-800 dark:text-blue-300">
            <span className="font-medium">{statusCounts.applied || 0}</span>{' '}
            Applied
          </div>
          <div className="bg-yellow-100 dark:bg-yellow-900 px-3 py-1 rounded-full text-sm text-yellow-800 dark:text-yellow-300">
            <span className="font-medium">
              {statusCounts.interviewing || 0}
            </span>{' '}
            Interviewing
          </div>
          <div className="bg-green-100 dark:bg-green-900 px-3 py-1 rounded-full text-sm text-green-800 dark:text-green-300">
            <span className="font-medium">{statusCounts.offered || 0}</span>{' '}
            Offered
          </div>
          <div className="bg-red-100 dark:bg-red-900 px-3 py-1 rounded-full text-sm text-red-800 dark:text-red-300">
            <span className="font-medium">{statusCounts.rejected || 0}</span>{' '}
            Rejected
          </div>
        </div>
        {jobs.length > 0 && (
          <button
            onClick={exportToHTML}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2"
            title="Export all jobs to HTML"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Export HTML
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative sm:w-64">
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Clear search"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
        <div className="relative">
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterOption)}
            className="appearance-none w-full sm:w-auto pl-3 pr-9 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="saved">Saved</option>
            <option value="applied">Applied</option>
            <option value="interviewing">Interviewing</option>
            <option value="offered">Offered</option>
            <option value="rejected">Rejected</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="appearance-none w-full sm:w-auto pl-3 pr-9 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="company">By Company</option>
            <option value="title">By Title</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Job Cards */}
      {sortedJobs.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {jobs.length === 0 ? (
            <div>
              <p className="text-lg mb-2">No job applications yet</p>
              <p className="text-sm">
                Add your first job application above to get started!
              </p>
            </div>
          ) : (
            <p>No jobs match your search criteria</p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
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
