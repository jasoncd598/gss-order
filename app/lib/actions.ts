'use server';

import { createClient } from './supabase/server';
import { placeOrder, type NewOrderItem } from './db';

export interface PlaceOrderInput {
  items: NewOrderItem[];
  poRef?: string;
  notes?: string;
}

export interface PlaceOrderResult {
  success: boolean;
  ref?: string;
  error?: string;
}

/**
 * Server Action: places an order and writes to the database.
 * Called from the cart page on "Place Order" click.
 */
export async function placeOrderAction(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) {
    // Company not linked yet — still write the order, just without company_id
    // (will be linked in Phase 2 migration)
    return { success: false, error: 'Company not set up. Please contact support.' };
  }

  const result = await placeOrder(
    supabase,
    profile.company_id,
    user.id,
    input.items,
    input.poRef,
    input.notes,
  );

  if (!result.success) {
    return { success: false, error: 'Failed to place order. Please try again.' };
  }

  return { success: true, ref: result.ref ?? undefined };
}
