import { createClient } from '../../lib/supabase/server';
import { getOrdersByCompany, getReorderRequestsByCompany } from '../../lib/db';
import OrdersClient from './OrdersClient';

export default async function OrderHistoryPage() {
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

  const [orders, reorders] = await Promise.all([
    getOrdersByCompany(supabase, companyId),
    getReorderRequestsByCompany(supabase, companyId),
  ]);

  return <OrdersClient orders={orders} reorders={reorders} companyName={companyName} />;
}
