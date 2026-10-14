'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Pencil, X, AlertCircle, Loader2 } from 'lucide-react';
import { saveCompanyAction, type CompanyInput } from '../../lib/actions';
import type { AdminCompany } from '../../lib/db';

const TERMS = ['Prepaid', 'COD', 'Net 7', 'Net 14', 'Net 30', 'Net 60'];
const INDUSTRIES = ['Packaging & Manufacturing', 'Retail & FMCG', 'Health & Beauty', 'Food & Beverage', 'Wholesale Distribution', 'Other'];

const field = 'w-full border border-zinc-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400';
const label = 'block text-xs font-semibold text-zinc-600 mb-1';

/** Staff: create a company (no company prop) or edit an existing one. */
export default function CompanyFormModal({ company }: { company?: AdminCompany }) {
  const router = useRouter();
  const editing = !!company;
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const blank: CompanyInput = { name: '', abn: '', industry: INDUSTRIES[0], address: '', contactPhone: '', paymentTerms: 'Net 30', creditLimit: 0, status: 'Active' };
  const fromCompany = (c: AdminCompany): CompanyInput => ({
    id: c.id, name: c.name, abn: c.abn ?? '', industry: c.industry ?? '', address: c.address ?? '',
    contactPhone: c.contact_phone ?? '', paymentTerms: c.payment_terms, creditLimit: Number(c.credit_limit), status: c.status,
  });
  const [form, setForm] = useState<CompanyInput>(company ? fromCompany(company) : blank);
  const set = <K extends keyof CompanyInput>(k: K, v: CompanyInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  function openModal() {
    setForm(company ? fromCompany(company) : blank);
    setError(null);
    setOpen(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveCompanyAction(form);
      if (!result.success) { setError(result.error ?? 'Save failed'); return; }
      setOpen(false);
      if (!editing && result.id) router.push(`/admin/companies/${result.id}`);
    });
  }

  return (
    <>
      {editing ? (
        <button onClick={openModal} className="inline-flex items-center gap-1.5 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 px-3 py-2 rounded text-xs font-semibold">
          <Pencil className="w-3.5 h-3.5" /><span>Edit Details</span>
        </button>
      ) : (
        <button onClick={openModal} className="inline-flex items-center space-x-2 bg-zinc-900 hover:bg-zinc-800 text-amber-400 px-3.5 py-2 rounded text-xs font-bold transition-colors">
          <Building2 className="w-3.5 h-3.5" /><span>Add Company</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <form onSubmit={submit} className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 sticky top-0 bg-white">
              <h2 className="font-bold text-zinc-900 text-sm">{editing ? 'Edit Company' : 'Add Company'}</h2>
              <button type="button" onClick={() => setOpen(false)} className="p-1.5 rounded hover:bg-zinc-100 text-zinc-400" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={label}>Company Legal Name *</label>
                <input required value={form.name} onChange={(e) => set('name', e.target.value)} className={field} />
              </div>
              <div>
                <label className={label}>ABN</label>
                <input value={form.abn} onChange={(e) => set('abn', e.target.value)} placeholder="51 824 753 556" className={field} />
              </div>
              <div>
                <label className={label}>Industry</label>
                <select value={form.industry} onChange={(e) => set('industry', e.target.value)} className={field}>
                  {[...new Set([form.industry || INDUSTRIES[0], ...INDUSTRIES])].map((i) => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Address</label>
                <input value={form.address} onChange={(e) => set('address', e.target.value)} className={field} />
              </div>
              <div>
                <label className={label}>Contact Phone</label>
                <input type="tel" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} className={field} />
              </div>
              <div>
                <label className={label}>Account Status</label>
                <select value={form.status} onChange={(e) => set('status', e.target.value)} className={field}>
                  <option>Active</option><option>Pending</option><option>Suspended</option>
                </select>
              </div>
              <div>
                <label className={label}>Payment Terms</label>
                <select value={form.paymentTerms} onChange={(e) => set('paymentTerms', e.target.value)} className={field}>
                  {[...new Set([form.paymentTerms, ...TERMS])].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Credit Limit (AUD)</label>
                <input
                  type="number" min={0} step={500}
                  value={form.creditLimit}
                  onChange={(e) => set('creditLimit', Number(e.target.value))}
                  className={`${field} font-mono`}
                />
              </div>
            </div>

            {error && (
              <div className="mx-6 mb-4 flex items-start space-x-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
              </div>
            )}

            <div className="px-6 py-4 border-t border-zinc-100 flex justify-end gap-2 sticky bottom-0 bg-white">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-xs text-zinc-600 hover:bg-zinc-100">Cancel</button>
              <button type="submit" disabled={pending} className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-zinc-950 font-bold px-5 py-2 rounded-lg text-xs">
                {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editing ? 'Save Changes' : 'Create Company'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
