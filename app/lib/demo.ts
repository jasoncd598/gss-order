import type { User } from '@supabase/supabase-js';

/**
 * Demo mode — set DEMO_MODE=true in .env.local to bypass Supabase auth and
 * browse every screen (customer + staff admin) against mock data.
 * Intended for screenshots and client walkthroughs only. Never enable in production.
 */
export const isDemoMode = process.env.DEMO_MODE === 'true';

export const DEMO_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  aud: 'authenticated',
  email: 's.jenkins@gss-demo.com.au',
  app_metadata: {},
  user_metadata: {
    first_name: 'Sarah',
    last_name: 'Jenkins',
    company_name: 'Acme Packaging Pty Ltd',
    role: 'Admin',
  },
  created_at: '2022-03-14T00:00:00.000Z',
} as User;
