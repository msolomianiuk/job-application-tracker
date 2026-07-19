import { describe, expect, mock, test } from 'bun:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getUserClaims } from '@/lib/supabase/claims';

function supabaseWithClaims(
  result: { data: unknown; error: unknown },
): SupabaseClient {
  return {
    auth: { getClaims: mock(async () => result) },
  } as unknown as SupabaseClient;
}

describe('getUserClaims', () => {
  test('returns sub and email for a valid session', async () => {
    const supabase = supabaseWithClaims({
      data: { claims: { sub: 'user-123', email: 'a@b.com' } },
      error: null,
    });

    expect(await getUserClaims(supabase)).toEqual({
      sub: 'user-123',
      email: 'a@b.com',
    });
  });

  test('returns null when there is no session', async () => {
    const supabase = supabaseWithClaims({ data: null, error: null });

    expect(await getUserClaims(supabase)).toBeNull();
  });

  test('returns null on auth error', async () => {
    const supabase = supabaseWithClaims({
      data: null,
      error: new Error('bad token'),
    });

    expect(await getUserClaims(supabase)).toBeNull();
  });

  test('returns null when claims have no sub', async () => {
    const supabase = supabaseWithClaims({
      data: { claims: { email: 'a@b.com' } },
      error: null,
    });

    expect(await getUserClaims(supabase)).toBeNull();
  });

  test('omits email when it is not a string', async () => {
    const supabase = supabaseWithClaims({
      data: { claims: { sub: 'user-123', email: 42 } },
      error: null,
    });

    expect(await getUserClaims(supabase)).toEqual({
      sub: 'user-123',
      email: undefined,
    });
  });
});
