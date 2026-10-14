import { redirect } from 'next/navigation';
import { createClient } from '../lib/supabase/server';
import SideNav from '../component/navigation/SideNav';
import TopBar from '../component/navigation/TopBar';
import { UserProvider, type UserSession } from '../lib/userContext';
import { CartProvider } from '../lib/cartContext';
import { isDemoMode } from '../lib/demo';
import { getNotifications } from '../lib/db';

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
    .select('first_name, last_name, role, is_staff, company_id, companies(name, payment_terms, credit_limit, status)')
    .eq('id', user.id)
    .single();

  // Supabase returns joined table as object or array — normalise both
  const company = Array.isArray(profile?.companies)
    ? profile.companies[0]
    : profile?.companies;

  const firstName   = profile?.first_name ?? user.user_metadata?.first_name ?? '';
  const lastName    = profile?.last_name  ?? user.user_metadata?.last_name  ?? '';
  const displayName = (`${firstName} ${lastName}`.trim() || user.email?.split('@')[0]) ?? 'User';

  // Fall back to signup metadata while company row is being linked
  const companyName  = company?.name          ?? user.user_metadata?.company_name ?? 'Your Company';
  const paymentTerms = company?.payment_terms ?? 'Net 30';
  const creditLimit  = company?.credit_limit  ?? (isDemoMode ? 35000 : 0);
  const companyStatus: string | undefined = isDemoMode ? 'Active' : company?.status;
  const isStaffUser  = isDemoMode || (profile?.is_staff ?? false);

  const session: UserSession = {
    id:          user.id,
    displayName,
    firstName,
    lastName,
    email:       user.email ?? '',
    // Never trust signup metadata for permissions — no profile means least privilege
    role:        isDemoMode ? 'Admin' : (profile?.role ?? 'Viewer'),
    isStaff:     isStaffUser,
    companyId:   profile?.company_id ?? '',
    companyName,
    paymentTerms,
    creditLimit,
  };

  const notifications = await getNotifications(supabase, 20);

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
              notifications={notifications}
            />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-100">
              {!isStaffUser && companyStatus !== 'Active' && (
                <div className={`max-w-7xl mx-auto mb-5 rounded-lg border px-4 py-3 text-xs ${
                  companyStatus === 'Suspended'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  {companyStatus === 'Suspended'
                    ? <><strong>Account on hold.</strong> Ordering is paused for {companyName}. Please contact our accounts team.</>
                    : <><strong>Account awaiting approval.</strong> You can browse the portal now; ordering and reorders unlock once our team approves {companyName}.</>}
                </div>
              )}
              {children}
            </main>
          </div>
        </div>
      </UserProvider>
    </CartProvider>
  );
}
