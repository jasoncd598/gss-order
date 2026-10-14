import { createClient } from '../../lib/supabase/server';
import { getTeamByCompany, getInvitations } from '../../lib/db';
import { isDemoMode } from '../../lib/demo';
import TeamClient from './TeamClient';

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role, companies(name)')
    .eq('id', user!.id)
    .single();

  const company     = Array.isArray(profile?.companies) ? profile.companies[0] : profile?.companies;
  const companyId   = profile?.company_id ?? '';
  const companyName = company?.name ?? user?.user_metadata?.company_name ?? 'Your Company';
  const canManage   = isDemoMode || profile?.role === 'Admin';

  const [members, invitations] = await Promise.all([
    getTeamByCompany(supabase, companyId),
    canManage ? getInvitations(supabase, companyId) : Promise.resolve([]),
  ]);

  return (
    <TeamClient
      members={members}
      invitations={invitations}
      companyName={companyName}
      currentUserId={isDemoMode ? 'usr-001' : user!.id}
      canManage={canManage}
    />
  );
}
