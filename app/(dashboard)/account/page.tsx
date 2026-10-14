// Server Component wrapper — allows exporting route segment config
// while delegating all UI to the Client Component below.
export const instant = false;

import AccountClient from './AccountClient';

export default function AccountPage() {
  return <AccountClient />;
}
