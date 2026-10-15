// Server Component wrapper — allows exporting route segment config
// while delegating all UI to the Client Component below.
export const instant = false;

import AccountClient from './AccountClient';
import { isDemoMode } from '../../lib/demo';

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ mfa?: string }> }) {
  // ?mfa=required — a staff member sent here to set up two-factor before using admin
  const { mfa } = await searchParams;
  return <AccountClient demo={isDemoMode} mfaRequired={mfa === 'required'} />;
}
