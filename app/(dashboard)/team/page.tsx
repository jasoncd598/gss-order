import { createClient } from '../../lib/supabase/server';
import { getTeamByCompany } from '../../lib/db';
import TeamClient from './TeamClient';

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, companies(name)')
    .eq('id', user!.id)
    .single();

  const company     = Array.isArray(profile?.companies) ? profile.companies[0] : profile?.companies;
  const companyId   = profile?.company_id ?? '';
  const companyName = company?.name ?? user?.user_metadata?.company_name ?? 'Your Company';

  const members = await getTeamByCompany(supabase, companyId);

  return <TeamClient members={members} companyName={companyName} />;
}
