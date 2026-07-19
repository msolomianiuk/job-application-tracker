/* eslint-disable new-cap -- route handlers (POST) are capitalized by Next.js convention */
import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test';
import type { NextRequest } from 'next/server';
import { extractCompanyFromUrl, humanizeSlug } from '@/lib/scrape';
import { POST } from '@/app/api/scrape/route';

const realFetch = globalThis.fetch;

afterAll(() => {
  globalThis.fetch = realFetch;
});

function scrapeRequest(url: string): NextRequest {
  return { json: async () => ({ url }) } as unknown as NextRequest;
}

function mockFetchStatus(status: number) {
  globalThis.fetch = mock(async () =>
    new Response('blocked', { status }),
  ) as unknown as typeof fetch;
}

describe('extractCompanyFromUrl', () => {
  test('derives the company from dou.ua company URLs', () => {
    expect(
      extractCompanyFromUrl(
        'jobs.dou.ua',
        'https://jobs.dou.ua/companies/talmatic/vacancies/366367/?from=rs',
      ),
    ).toBe('Talmatic');
  });

  test('handles multi-word slugs', () => {
    expect(
      extractCompanyFromUrl(
        'jobs.dou.ua',
        'https://jobs.dou.ua/companies/nerdy-soft/vacancies/1/',
      ),
    ).toBe('Nerdy Soft');
  });

  test('supports greenhouse and lever URL structures', () => {
    expect(
      extractCompanyFromUrl(
        'job-boards.greenhouse.io',
        'https://job-boards.greenhouse.io/acme-corp/jobs/123',
      ),
    ).toBe('Acme Corp');
    expect(
      extractCompanyFromUrl('jobs.lever.co', 'https://jobs.lever.co/nekohealth/abc'),
    ).toBe('Nekohealth');
  });

  test('returns empty for unrecognized hosts', () => {
    expect(
      extractCompanyFromUrl('example.com', 'https://example.com/careers/1'),
    ).toBe('');
  });

  test('humanizeSlug capitalizes each word', () => {
    expect(humanizeSlug('nerdy-soft')).toBe('Nerdy Soft');
  });
});

describe('POST /api/scrape fallback when the page cannot be fetched', () => {
  beforeEach(() => {
    globalThis.fetch = realFetch;
  });

  test('403 from a dou.ua URL still fills the company from the URL', async () => {
    mockFetchStatus(403);

    const response = await POST(
      scrapeRequest('https://jobs.dou.ua/companies/talmatic/vacancies/366367/?from=rs'),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.companyName).toBe('Talmatic');
    expect(body.jobTitle).toBe('');
    expect(body.error).toContain('403');
  });

  test('network failure on a dou.ua URL also falls back to the URL', async () => {
    globalThis.fetch = mock(async () => {
      throw new Error('connect ECONNREFUSED');
    }) as unknown as typeof fetch;

    const response = await POST(
      scrapeRequest('https://jobs.dou.ua/companies/nerdy-soft/vacancies/1/'),
    );
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.companyName).toBe('Nerdy Soft');
  });

  test('unrecognized host keeps the original error behavior', async () => {
    mockFetchStatus(403);

    const response = await POST(scrapeRequest('https://example.com/careers/1'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch page: 403');
  });

  test('successful fetch still extracts from the page content', async () => {
    globalThis.fetch = mock(async () =>
      new Response(
        '<html><head><title>QA Engineer at Acme | Jobs</title></head><body></body></html>',
        { status: 200 },
      ),
    ) as unknown as typeof fetch;

    const response = await POST(scrapeRequest('https://example.com/careers/1'));
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.jobTitle).toBe('QA Engineer');
    expect(body.companyName).toBe('Acme');
  });

  test('sends a full browser header set with the fetch', async () => {
    const fetchMock = mock(async () => new Response('<html></html>', { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await POST(scrapeRequest('https://example.com/careers/1'));

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['User-Agent']).toContain('Chrome');
    expect(headers['Sec-Fetch-Mode']).toBe('navigate');
    expect(headers['Sec-Ch-Ua-Platform']).toBeDefined();
    expect(headers['Accept-Encoding']).toBeUndefined();
  });
});
