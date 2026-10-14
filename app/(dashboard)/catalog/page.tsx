import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Reorder Catalog | GSS Order Portal' };

import { createClient } from '../../lib/supabase/server';
import { getCatalog } from '../../lib/db';
import CatalogClient from './CatalogClient';

export default async function CatalogPage() {
  const supabase = await createClient();
  const items = await getCatalog(supabase);
  return <CatalogClient items={items} />;
}
