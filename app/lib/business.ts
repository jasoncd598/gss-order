/**
 * Supplier details printed on invoices — server-side only. Set these in the
 * environment; an Australian tax invoice must show the supplier's name and ABN.
 */
export const BUSINESS = {
  name:    process.env.BUSINESS_NAME || 'GSS',
  abn:     process.env.BUSINESS_ABN || '',
  address: process.env.BUSINESS_ADDRESS || '',
  email:   process.env.BUSINESS_EMAIL || '',
  phone:   process.env.BUSINESS_PHONE || '',
  /** Shown under "How to pay", e.g. "BSB 062-000 · Acc 1234 5678" */
  bankDetails: process.env.BUSINESS_BANK_DETAILS || '',
};
