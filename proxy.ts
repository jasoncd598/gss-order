import { type NextRequest } from 'next/server';
import { updateSession } from './app/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Machine-called routes have no user session; they check a signature / secret themselves
    // (CSP reports only get logged)
    '/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|api/notifications/deliver|api/csp-report|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
