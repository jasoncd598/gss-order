import { redirect } from 'next/navigation';
import { createClient } from '../lib/supabase/server';
import SideNav from '../component/navigation/SideNav';
import TopBar from '../component/navigation/TopBar';

// Dashboard routes all read session cookies at runtime
export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Middleware handles most redirects, but this is a safety net
  if (!user) {
    redirect('/login');
  }

  // Fetch the user's profile from our profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, role, company_id')
    .eq('id', user.id)
    .single();

  const displayName = profile
    ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim()
    : user.email ?? 'User';

  const role = profile?.role ?? 'Viewer';

  return (
    <div className="min-h-screen bg-zinc-100 flex font-sans text-zinc-900">
      <SideNav />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar displayName={displayName} role={role} email={user.email ?? ''} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-100">
          {children}
        </main>
      </div>
    </div>
  );
}
