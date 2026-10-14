import { createClient } from '../../lib/supabase/server';
import { getArtworkByCompany } from '../../lib/db';
import VaultClient from './VaultClient';

export default async function VaultPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user!.id)
    .single();

  const artwork = await getArtworkByCompany(supabase, profile?.company_id ?? '');

  return <VaultClient artwork={artwork} />;
}
