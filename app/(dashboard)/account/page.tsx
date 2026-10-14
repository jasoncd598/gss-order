// Server Component wrapper — allows exporting route segment config
// while delegating all UI to the Client Component below.
export const instant = false;

import AccountClient from './AccountClient';
import { isDemoMode } from '../../lib/demo';

export default function AccountPage() {
  return <AccountClient demo={isDemoMode} />;
}
