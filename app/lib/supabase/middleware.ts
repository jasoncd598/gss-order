import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isDemoMode } from '../demo';

export async function updateSession(request: NextRequest) {
  if (isDemoMode) return NextResponse.next({ request });

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — always keep this call
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const publicPaths = ['/login', '/registration', '/forgot-password', '/auth/callback', '/welcome', '/privacy', '/terms'];
  const isPublic    = publicPaths.some((p) => pathname.startsWith(p));
  // Public pages a signed-in user can still open (the rest are sign-in pages)
  const openToAll   = ['/auth/callback', '/welcome', '/privacy', '/terms'].some((p) => pathname.startsWith(p));

  // 0. Signed-out visitors at the homepage see the landing page (URL stays "/")
  if (!user && pathname === '/') {
    const rewrite = NextResponse.rewrite(new URL('/welcome', request.url));
    supabaseResponse.cookies.getAll().forEach((c) => rewrite.cookies.set(c));
    return rewrite;
  }

  // 1. Unauthenticated → login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 2. Authenticated on auth page → dashboard (the landing and legal pages stay viewable)
  if (user && isPublic && !openToAll) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // 3. Two-factor: an account with an authenticator app set up must enter its
  //    code before using the portal (session at aal1 → the code step).
  let aal: { currentLevel: string | null; nextLevel: string | null } | null = null;
  if (user && !isPublic) {
    ({ data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel());
    const needsCode = aal?.nextLevel === 'aal2' && aal.currentLevel !== 'aal2';
    if (needsCode && pathname !== '/two-factor') {
      const url = request.nextUrl.clone();
      url.pathname = '/two-factor';
      url.search = `?next=${encodeURIComponent(pathname + request.nextUrl.search)}`;
      return NextResponse.redirect(url);
    }
    if (!needsCode && pathname === '/two-factor') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 4. Protect /admin/* — only staff can access, and staff must use two-factor
  //    (the database also ignores staff rights without it — migration 009)
  if (user && pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_staff')
      .eq('id', user.id)
      .single();

    if (!profile?.is_staff) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    if (aal?.currentLevel !== 'aal2') {
      const url = request.nextUrl.clone();
      url.pathname = '/account';
      url.search = '?mfa=required';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
