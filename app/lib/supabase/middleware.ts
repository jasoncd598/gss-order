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

  const publicPaths = ['/login', '/registration', '/forgot-password', '/auth/callback', '/welcome'];
  const isPublic    = publicPaths.some((p) => pathname.startsWith(p));

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

  // 2. Authenticated on auth page → dashboard (the landing page stays viewable)
  if (user && isPublic && !pathname.startsWith('/auth/callback') && !pathname.startsWith('/welcome')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // 3. Protect /admin/* — only staff can access
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
  }

  return supabaseResponse;
}
