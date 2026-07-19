import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import JobCard from '@/components/JobCard';
import type { JobApplication } from '@/types/job';

const job: JobApplication = {
  id: 'job-1',
  user_id: 'user-1',
  url: 'https://example.com/job',
  job_title: 'QA Engineer',
  company_name: 'Acme',
  status: 'applied',
  notes: '',
  // 23:30 UTC: in any timezone east of UTC this is already July 19 locally.
  // Formatting must pin to UTC so SSR and hydration render identical text
  // (React hydration error #418).
  created_at: '2026-07-18T23:30:00Z',
  updated_at: '2026-07-18T23:30:00Z',
};

const noop = async () => undefined;

describe('JobCard date rendering', () => {
  test('renders the created date in UTC regardless of local timezone', () => {
    const html = renderToStaticMarkup(
      <JobCard job={job} onUpdate={noop} onDelete={noop} />,
    );

    expect(html).toContain('Jul 18, 2026');
    expect(html).not.toContain('Jul 19, 2026');
  });
});

describe('JobCard header layout', () => {
  test('shows the company first, with the title smaller on the same line', () => {
    const html = renderToStaticMarkup(
      <JobCard job={job} onUpdate={noop} onDelete={noop} />,
    );

    expect(html.indexOf('Acme')).toBeLessThan(html.indexOf('QA Engineer'));
    expect(html).toContain('font-semibold">Acme</span>');
    expect(html).toContain(' · ');
    // The title span steps down from the h3's text-lg
    expect(html).toMatch(/text-base[^"]*"> · QA Engineer/);
  });

  test('renders cleanly with no job title - just the company, no separator', () => {
    const html = renderToStaticMarkup(
      <JobCard job={{ ...job, job_title: '' }} onUpdate={noop} onDelete={noop} />,
    );

    expect(html).toContain('Acme');
    expect(html).not.toContain(' · ');
  });
});
