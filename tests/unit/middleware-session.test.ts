import { beforeEach, describe, expect, mock, test } from 'bun:test';
import type { NextRequest } from 'next/server';

// The perf-critical contract of updateSession: it must refresh the session
// via getClaims() (local JWT verification) and never call getUser(), which
// costs a network round-trip to the Supabase Auth server on every request.
const getClaims = mock(async () => ({
  data: { claims: { sub: 'user-123' } },
  error: null,
}));
const getUser = mock(async () => ({
  data: { user: { id: 'user-123' } },
  error: null,
}));

mock.module('@supabase/ssr', () => ({
  createServerClient: () => ({ auth: { getClaims, getUser } }),
}));

const { updateSession } = await import('@/lib/supabase/middleware');

function fakeRequest(): NextRequest {
  return {
    cookies: {
      getAll: () => [],
      set: () => undefined,
    },
  } as unknown as NextRequest;
}

describe('updateSession middleware', () => {
  beforeEach(() => {
    getClaims.mockClear();
    getUser.mockClear();
  });

  test('refreshes the session with a single getClaims call', async () => {
    await updateSession(fakeRequest());

    expect(getClaims).toHaveBeenCalledTimes(1);
  });

  test('never calls getUser (network round-trip per request)', async () => {
    await updateSession(fakeRequest());

    expect(getUser).not.toHaveBeenCalled();
  });

  test('returns a response that continues the request chain', async () => {
    const response = await updateSession(fakeRequest());

    expect(response).toBeDefined();
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });
});
