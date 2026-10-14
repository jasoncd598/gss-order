import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Reorder Requests | GSS Admin' };

import { createClient } from '../../../lib/supabase/server';
import { getAllReorderRequests } from '../../../lib/db';
import ReordersClient from './ReordersClient';

export default async function AdminReordersPage() {
  const supabase = await createClient();
  const requests = await getAllReorderRequests(supabase);
  return <ReordersClient requests={requests} />;
}
