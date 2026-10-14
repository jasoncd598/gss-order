import { redirect } from 'next/navigation';
import { createClient } from '../lib/supabase/server';
import SideNav from '../component/navigation/SideNav';
import TopBar from '../component/navigation/TopBar';
import { UserProvider, type UserSession } from '../lib/userContext';
import { CartProvider } from '../lib/cartContext';

// All dashboard routes render with live session data
export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch profile + joined company in one query
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, role, companies(name, payment_terms, credit_limit)')
    .eq('id', user.id)
    .single();

  // Supabase returns joined table as object or array — handle both
  const company = Array.isArray(profile?.companies)
    ? profile.companies[0]
    : profile?.companies;

  const firstName   = profile?.first_name  ?? user.user_metadata?.first_name  ?? '';
  const lastName    = profile?.last_name   ?? user.user_metadata?.last_name   ?? '';
  const displayName = (`${firstName} ${lastName}`.trim() || user.email?.split('@')[0]) ?? 'User';

  // Fall back to metadata stored at signup if company row not linked yet
  const companyName   = company?.name          ?? user.user_metadata?.company_name ?? 'Your Company';
  const paymentTerms  = company?.payment_terms ?? 'Net 30';
  const creditLimit   = company?.credit_limit  ?? 0;

  const session: UserSession = {
    id:           user.id,
    displayName,
    firstName,
    lastName,
    email:        user.email ?? '',
    role:         profile?.role ?? user.user_metadata?.role ?? 'Viewer',
    companyName,
    paymentTerms,
    creditLimit,
  };

  return (
    <CartProvider>
      <UserProvider value={session}>
        <div className="min-h-screen bg-zinc-100 flex font-sans text-zinc-900">
          <SideNav />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <TopBar
              displayName={session.displayName}
              role={session.role}
              email={session.email}
            />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-100">
              {children}
            </main>
          </div>
        </div>
      </UserProvider>
    </CartProvider>
  );
}
