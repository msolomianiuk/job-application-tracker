/* eslint-disable new-cap -- route handlers (GET) are capitalized by Next.js convention */
import { beforeEach, describe, expect, mock, test } from 'bun:test';

const jobsRows = [{ id: 'job-1', user_id: 'user-123' }];

const order = mock(async () => ({ data: jobsRows, error: null }));
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

const { GET } = await import('@/app/api/jobs/route');

describe('GET /api/jobs', () => {
  beforeEach(() => {
    getClaims.mockClear();
    getUser.mockClear();
    from.mockClear();
    eq.mockClear();
    getClaims.mockImplementation(async () => ({
      data: { claims: { sub: 'user-123', email: 'a@b.com' } },
      error: null,
    }));
  });

  test('returns 401 without a session and does not query the DB', async () => {
    getClaims.mockImplementation(async () => ({ data: null, error: null }));

    const response = await GET();

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });

  test('returns jobs scoped to the user id from the JWT claims', async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ jobs: jobsRows });
    expect(eq).toHaveBeenCalledWith('user_id', 'user-123');
  });

  test('authenticates via getClaims only - no getUser round-trip', async () => {
    await GET();

    expect(getClaims).toHaveBeenCalledTimes(1);
    expect(getUser).not.toHaveBeenCalled();
  });
});
