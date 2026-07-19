/* eslint-disable new-cap -- Home is a server component invoked directly as a function */
import { beforeEach, describe, expect, mock, test } from 'bun:test';
import type { ReactElement } from 'react';
import * as nextNavigation from 'next/navigation';
import JobTracker from '@/components/JobTracker';

const jobsResult: { data: unknown; error: unknown } = {
  data: [{ id: 'job-1' }],
  error: null,
};

const order = mock(async () => jobsResult);
const eq = mock(() => ({ order }));
const select = mock(() => ({ eq }));
const from = mock(() => ({ select }));

type ClaimsResult = {
  data: { claims: { sub: string; email?: string } } | null;
  error: Error | null;
};

const getClaims = mock(async (): Promise<ClaimsResult> => ({
  data: { claims: { sub: 'user-123', email: 'a@b.com' } },
  error: null,
}));
const getUser = mock(async () => ({
  data: { user: { id: 'user-123' } },
  error: null,
}));

mock.module('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getClaims, getUser }, from }),
}));

const redirect = mock((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
// Bun module mocks persist across test files, so keep the real exports and
// override only what this file needs.
mock.module('next/navigation', () => ({
  ...nextNavigation,
  redirect,
  useRouter: () => ({ push: () => undefined, refresh: () => undefined }),
}));

const { default: Home } = await import('@/app/page');

describe('Home page (server component)', () => {
  beforeEach(() => {
    getClaims.mockClear();
    getUser.mockClear();
    from.mockClear();
    eq.mockClear();
    redirect.mockClear();
    getClaims.mockImplementation(async () => ({
      data: { claims: { sub: 'user-123', email: 'a@b.com' } },
      error: null,
    }));
  });

  test('redirects to login when there is no session, without touching the DB', async () => {
    getClaims.mockImplementation(async () => ({ data: null, error: null }));

    await expect(Home()).rejects.toThrow('NEXT_REDIRECT:/auth/login');
    expect(from).not.toHaveBeenCalled();
  });

  test('authenticates with a single local getClaims call - no getUser round-trip', async () => {
    await Home();

    expect(getClaims).toHaveBeenCalledTimes(1);
    expect(getUser).not.toHaveBeenCalled();
  });

  test('fetches jobs scoped to the user id from the JWT claims', async () => {
    await Home();

    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith('jobs');
    expect(eq).toHaveBeenCalledWith('user_id', 'user-123');
  });

  test('renders JobTracker with the fetched jobs and claim email', async () => {
    const page = (await Home()) as ReactElement<{
      children: ReactElement<{ children: ReactElement }>;
    }>;

    const tracker = page.props.children.props.children as ReactElement<{
      initialJobs: unknown[];
      user: { email?: string };
    }>;

    expect(tracker.type).toBe(JobTracker);
    expect(tracker.props.initialJobs).toEqual([{ id: 'job-1' }]);
    expect(tracker.props.user).toEqual({ email: 'a@b.com' });
  });

  test('renders an empty job list when the query returns no data', async () => {
    order.mockImplementationOnce(async () => ({ data: null, error: null }));

    const page = (await Home()) as ReactElement<{
      children: ReactElement<{ children: ReactElement }>;
    }>;
    const tracker = page.props.children.props.children as ReactElement<{
      initialJobs: unknown[];
    }>;

    expect(tracker.props.initialJobs).toEqual([]);
  });
});
