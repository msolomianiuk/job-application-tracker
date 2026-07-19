import { describe, expect, mock, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import * as nextNavigation from 'next/navigation';

// JobTracker calls useRouter(), which throws outside a mounted app router.
// Mock it here (keeping the real exports) so this file passes regardless of
// which test file runs first.
mock.module('next/navigation', () => ({
  ...nextNavigation,
  useRouter: () => ({ push: () => undefined, refresh: () => undefined }),
}));

// Bun module mocks persist across test files; the real module's only export
// is createClient, which is fully replaced here.
const storageApi = {
  list: mock(async () => ({ data: [], error: null })),
  upload: mock(async () => ({ error: null })),
  remove: mock(async () => ({ error: null })),
  download: mock(async () => ({ data: null, error: null })),
};
mock.module('@/lib/supabase/client', () => ({
  createClient: () => ({ storage: { from: () => storageApi } }),
}));

const { default: CvPanel } = await import('@/components/CvPanel');
const { default: JobTracker } = await import('@/components/JobTracker');

describe('CvPanel', () => {
  test('renders the heading, upload button and file input', () => {
    const html = renderToStaticMarkup(<CvPanel userId="user-123" />);

    expect(html).toContain('My CVs');
    expect(html).toContain('Upload CV');
    expect(html).toContain('data-testid="cv-upload-input"');
    expect(html).toContain('accept=".pdf,.doc,.docx"');
  });

  test('explains the 2-CV retention policy', () => {
    const html = renderToStaticMarkup(<CvPanel userId="user-123" />);

    expect(html).toContain('2 most recent CVs');
  });

  test('shows the loading skeleton before the list is fetched', () => {
    // Effects do not run in a static server render, so the initial
    // pre-fetch state is what gets asserted here.
    const html = renderToStaticMarkup(<CvPanel userId="user-123" />);

    expect(html).toContain('data-testid="cv-list-loading"');
  });
});

describe('JobTracker layout', () => {
  test('renders the thinner form column next to the CV panel', () => {
    const html = renderToStaticMarkup(
      <JobTracker initialJobs={[]} user={{ id: 'user-123', email: 'a@b.com' }} />,
    );

    expect(html).toContain('lg:grid-cols-3');
    expect(html).toContain('lg:col-span-2');
    expect(html).toContain('Add New Job Application');
    expect(html).toContain('data-testid="cv-panel"');
  });

  test('panels stretch to equal height within the row', () => {
    const html = renderToStaticMarkup(
      <JobTracker initialJobs={[]} user={{ id: 'user-123', email: 'a@b.com' }} />,
    );

    // Default grid alignment (stretch) + h-full on the form card keeps the
    // two panels the same height.
    expect(html).not.toContain('items-start');
    expect(html).toMatch(/<form[^>]*h-full/);
  });
});
