'use client';

/**
 * UserContext — provides real session data to all client components.
 * Populated server-side via props from the dashboard layout.
 */

import { createContext, useContext, type ReactNode } from 'react';

export interface UserSession {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  companyName: string;
  companyId: string;
  paymentTerms: string;
  creditLimit: number;
  isStaff: boolean;
}

const UserContext = createContext<UserSession>({
  id: '',
  displayName: '',
  firstName: '',
  lastName: '',
  email: '',
  role: 'Viewer',
  companyName: '',
  companyId: '',
  paymentTerms: 'Net 30',
  creditLimit: 0,
  isStaff: false,
});

export function UserProvider({
  value,
  children,
}: {
  value: UserSession;
  children: ReactNode;
}) {
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
