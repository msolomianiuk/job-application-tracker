import type { SupabaseClient } from '@supabase/supabase-js';

export interface UserClaims {
  sub: string;
  email?: string;
}

/**
 * Returns the authenticated user's JWT claims, or null when there is no
 * valid session.
 *
 * Uses getClaims() instead of getUser(): with asymmetric JWT signing keys
 * enabled on the Supabase project, the token is verified locally against
 * the project's public keys, avoiding a network round-trip to the Auth
 * server on every request. (With legacy symmetric keys it transparently
 * falls back to a server-side check, so behavior is unchanged.)
 */
export async function getUserClaims(
  supabase: SupabaseClient,
): Promise<UserClaims | null> {
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    return null;
  }

  return {
    sub: data.claims.sub,
    email: typeof data.claims.email === 'string' ? data.claims.email : undefined,
  };
}
