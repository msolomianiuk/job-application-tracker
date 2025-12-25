"use client";

import { useState } from "react";
import { JobStatus, ScrapeResult, JobInsert } from "@/types/job";

interface JobFormProps {
  onAddJob: (job: JobInsert) => Promise<void>;
  isLoading?: boolean;
}

export default function JobForm({ onAddJob, isLoading }: JobFormProps) {
  const [url, setUrl] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [status, setStatus] = useState<JobStatus>("saved");
  const [notes, setNotes] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleScrape = async (urlToScrape?: string) => {
    const targetUrl = urlToScrape || url;
    if (!targetUrl) return;

    setIsScraping(true);
    setScrapeError("");

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: targetUrl }),
      });

      const result: ScrapeResult = await response.json();

      if (result.success) {
        setJobTitle(result.jobTitle);
        setCompanyName(result.companyName);
      } else {
        setScrapeError(result.error || "Failed to scrape job details");
      }
    } catch {
      setScrapeError("Failed to connect to scraping service");
    } finally {
      setIsScraping(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text").trim();
    // Check if pasted text looks like a URL
    if (
      pastedText &&
      (pastedText.startsWith("http://") || pastedText.startsWith("https://"))
    ) {
      // Prevent default paste behavior to avoid double insertion
      e.preventDefault();
      // Set the URL immediately and trigger scrape
      setUrl(pastedText);
      // Only auto-scrape if job title and company are empty
      if (!jobTitle && !companyName && !isScraping) {
        // Use setTimeout to ensure state is updated before scraping
        setTimeout(() => handleScrape(pastedText), 0);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobTitle || !companyName) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onAddJob({
        url,
        job_title: jobTitle,
        company_name: companyName,
        status,
        notes,
      });

      // Reset form
      setUrl("");
      setJobTitle("");
      setCompanyName("");
      setStatus("saved");
      setNotes("");
      setScrapeError("");
    } catch (error) {
      console.error("Error adding job:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6"
    >
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Add New Job Application
      </h2>

      {/* URL Input with Scrape Button */}
      <div className="mb-4">
        <label
          htmlFor="url"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Job Posting URL
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onPaste={handlePaste}
            placeholder="https://example.com/job/..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            type="button"
            onClick={() => handleScrape()}
            disabled={!url || isScraping}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isScraping ? "Scraping..." : "Auto-fill"}
          </button>
        </div>
        {scrapeError && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {scrapeError}
          </p>
        )}
      </div>

      {/* Job Title */}
      <div className="mb-4">
        <label
          htmlFor="jobTitle"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Job Title *
        </label>
        <input
          type="text"
          id="jobTitle"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          required
          placeholder="Software Engineer"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Company Name */}
      <div className="mb-4">
        <label
          htmlFor="companyName"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Company Name *
        </label>
        <input
          type="text"
          id="companyName"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
          placeholder="Acme Inc."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Status */}
      <div className="mb-4">
        <label
          htmlFor="status"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as JobStatus)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="saved">Saved</option>
          <option value="applied">Applied</option>
          <option value="interviewing">Interviewing</option>
          <option value="offered">Offered</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Notes */}
      <div className="mb-4">
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Add any notes about this application..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!jobTitle || !companyName || isLoading || isSubmitting}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {isSubmitting ? "Adding..." : "Add Job Application"}
      </button>
    </form>
  );
}
