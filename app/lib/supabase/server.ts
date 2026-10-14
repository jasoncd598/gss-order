import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { connection } from 'next/server';
import { isDemoMode, DEMO_USER } from '../demo';

/**
 * Server-side Supabase client.
 * Use this inside Server Components, Route Handlers, and Server Actions.
 */
export async function createClient() {
  // Opt out of prerendering: the Supabase client uses Math.random() internally
  await connection();
  const cookieStore = await cookies();

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll called from a Server Component — safe to ignore,
            // middleware will handle session refresh
          }
        },
      },
    }
  );

  // Demo mode: every server component sees the demo user; DB lookups for it
  // return nothing, so pages fall through to their mock data.
  if (isDemoMode) {
    client.auth.getUser = async () => ({ data: { user: DEMO_USER }, error: null });
  }

  return client;
}
