import { NextResponse } from 'next/server';
import { createClient } from '../../lib/supabase/server';
import { safeNextPath } from '../../lib/site';

/**
 * Supabase Auth callback handler.
 * Supabase redirects here after email confirmation / password reset.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNextPath(searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // On error, send back to login with a message
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
