import { createClient } from '../../lib/supabase/server';
import { getArtworkByCompany, getCatalog } from '../../lib/db';
import { isDemoMode } from '../../lib/demo';
import VaultClient, { type VaultPrice } from './VaultClient';

export default async function VaultPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user!.id)
    .single();

  const role = isDemoMode ? 'Admin' : profile?.role;
  const approver = role === 'Admin' || role === 'Procurement Manager';

  const [artwork, catalog] = await Promise.all([
    getArtworkByCompany(supabase, profile?.company_id ?? ''),
    getCatalog(supabase),
  ]);

  // Reorder prices come from the database (last order of each plate)
  const prices: Record<string, VaultPrice> = {};
  for (const c of catalog) {
    const qty = c.minQuantity ?? c.lastQuantity;
    if (c.unitPrice !== null && qty) prices[c.artworkId] = { unitPrice: c.unitPrice, lastQuantity: qty };
  }

  return <VaultClient artwork={artwork} prices={prices} canReview={approver} canOrder={approver} initialSearch={q?.slice(0, 100) ?? ''} />;
}
