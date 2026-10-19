'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, UserPlus, ChevronRight, ChevronLeft, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';

interface InviteInfo { company_name: string; email: string; role: string }

export default function RegistrationPage() {
  // useSearchParams needs a Suspense boundary so the page shell can prerender
  return (
    <Suspense fallback={<div className="min-h-screen bg-wall" />}>
      <Registration />
    </Suspense>
  );
}

function Registration() {
  const router = useRouter();
  const inviteToken = useSearchParams().get('invite');
  // undefined = loading, null = invalid/expired
  const [invite, setInvite] = useState<InviteInfo | null | undefined>(inviteToken ? undefined : null);
  const [step, setStep] = useState(inviteToken ? 2 : 1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);

  // Step 1 — Company
  const [companyName, setCompanyName] = useState('');
  const [abn, setAbn]                 = useState('');
  const [industry, setIndustry]       = useState('Packaging & Manufacturing');
  const [address, setAddress]         = useState('');
  const [phone, setPhone]             = useState('');

  // Step 2 — User
  const [firstName, setFirstName]   = useState('');
  const [lastName, setLastName]     = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [agreed, setAgreed]         = useState(false);

  useEffect(() => {
    if (!inviteToken) return;
    createClient()
      .rpc('get_invitation', { p_token: inviteToken })
      .then(({ data }) => {
        const info = (data as InviteInfo[] | null)?.[0] ?? null;
        setInvite(info);
        if (info) setEmail(info.email);
        else setStep(1);
      });
  }, [inviteToken]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreed) {
      setError('Please accept the Terms of Service.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: invite && inviteToken
          ? { first_name: firstName, last_name: lastName, invite_token: inviteToken }
          : {
              first_name:   firstName,
              last_name:    lastName,
              company_name: companyName,
              abn,
              industry,
              address,
              phone,
            },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    // Email confirmation off in Supabase → already signed in, go straight in (same as login)
    if (data.session) {
      router.push('/');
      router.refresh();
      return;
    }

    setLoading(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="min-h-screen bg-wall flex items-center justify-center p-4">
        
        <div className="relative bg-label rounded-sm p-10 text-center max-w-md w-full shadow-[0_24px_60px_-24px_rgba(8,14,32,0.75)]">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-zinc-950 font-semibold text-[26px] leading-tight mb-2">Check your email</h1>
          <p className="text-zinc-600 text-sm mb-2">
            We&apos;ve sent a confirmation link to <span className="text-zinc-950 font-semibold">{email}</span>.
          </p>
          <p className="text-zinc-600 text-xs mb-6">
            {invite
              ? `Verify your email, then sign in to join ${invite.company_name}.`
              : 'Verify your email, then sign in. You can browse straight away; ordering unlocks once our team approves your company account (usually within 1 business day).'}
          </p>
          <Link href="/login" className="inline-flex items-center justify-center bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-6 py-2.5 rounded-sm text-sm transition-colors">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-wall flex items-center justify-center p-4">
      

      <div className="relative w-full max-w-lg">
        <Link href="/welcome" className="flex items-baseline justify-center gap-3 mb-8">
          <span className="font-display text-[40px] leading-none text-label tracking-tight">GSS</span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-brass-light">Trade Orders</span>
        </Link>

        <div className="bg-label rounded-sm p-8 sm:p-9 shadow-[0_24px_60px_-24px_rgba(8,14,32,0.75)]">
          {inviteToken && invite === undefined && (
            <div className="flex items-center justify-center py-10 text-zinc-600 text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Checking invitation…
            </div>
          )}
          {inviteToken && invite === null && (
            <div className="mb-4 bg-amber-950/40 border border-amber-800/60 rounded-sm px-3.5 py-3 text-xs text-amber-200">
              This invitation link is invalid or has expired. Ask your company admin for a new one, or register a new company below.
            </div>
          )}
          {invite && (
            <div className="mb-6 bg-amber-400/10 border border-amber-400/30 rounded-sm px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider text-amber-400/80 font-semibold">You&apos;ve been invited</p>
              <p className="text-zinc-950 text-sm font-bold mt-0.5">{invite.company_name}</p>
              <p className="text-zinc-600 text-xs">Joining as <span className="text-amber-700 font-semibold">{invite.role}</span></p>
            </div>
          )}

          {/* Step indicator */}
          {!invite && invite !== undefined && <div className="flex items-center mb-6">
            {['Company Details', 'Your Account'].map((label, i) => {
              const s = i + 1;
              return (
                <div key={s} className="flex items-center">
                  <div className="flex items-center space-x-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                      step === s ? 'bg-amber-400 border-amber-400 text-zinc-950'
                      : step > s  ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-transparent border-zinc-600 text-zinc-500'
                    }`}>{s}</div>
                    <span className={`text-xs font-medium ${step === s ? 'text-zinc-950' : 'text-zinc-600'}`}>{label}</span>
                  </div>
                  {s < 2 && <div className="w-12 h-px bg-zinc-700 mx-3" />}
                </div>
              );
            })}
          </div>}

          {error && (
            <div className="mb-4 flex items-start space-x-2.5 bg-red-50 border border-red-200 rounded-sm px-3.5 py-3">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-red-700 text-xs">{error}</p>
            </div>
          )}

          {invite === undefined ? null : step === 1 ? (
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
              <div>
                <h2 className="text-zinc-950 font-bold text-lg mb-0.5">Company Information</h2>
                <p className="text-zinc-600 text-xs mb-4">Tell us about your business.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Company Legal Name *</label>
                  <input required type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Packaging Pty Ltd" className="w-full bg-white border border-zinc-300 text-zinc-950 text-sm px-3.5 py-2.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-zinc-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">ABN</label>
                  <input type="text" value={abn} onChange={(e) => setAbn(e.target.value)} placeholder="51 824 753 556" className="w-full bg-white border border-zinc-300 text-zinc-950 text-sm px-3.5 py-2.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-zinc-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Industry</label>
                  <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full bg-white border border-zinc-300 text-zinc-950 text-sm px-3.5 py-2.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <option>Packaging &amp; Manufacturing</option>
                    <option>Retail &amp; FMCG</option>
                    <option>Health &amp; Beauty</option>
                    <option>Wholesale Distribution</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Business Address</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="14 Industrial Ave, Wetherill Park NSW 2164" className="w-full bg-white border border-zinc-300 text-zinc-950 text-sm px-3.5 py-2.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-zinc-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Contact Phone</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+61 2 9055 7700" className="w-full bg-white border border-zinc-300 text-zinc-950 text-sm px-3.5 py-2.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-zinc-500" />
                </div>
              </div>
              <button type="submit" className="w-full flex items-center justify-center space-x-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold py-2.5 rounded-sm text-sm transition-colors mt-2">
                <span>Continue</span><ChevronRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <h2 className="text-zinc-950 font-bold text-lg mb-0.5">Your Account</h2>
                <p className="text-zinc-600 text-xs mb-4">Set up your personal login credentials.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">First Name *</label>
                  <input required type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Sarah" className="w-full bg-white border border-zinc-300 text-zinc-950 text-sm px-3.5 py-2.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-zinc-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Last Name *</label>
                  <input required type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Jenkins" className="w-full bg-white border border-zinc-300 text-zinc-950 text-sm px-3.5 py-2.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-zinc-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Work Email *</label>
                  <input required type="email" value={email} readOnly={!!invite} onChange={(e) => setEmail(e.target.value)} placeholder="sarah@company.com.au" className="w-full read-only:opacity-70 bg-white border border-zinc-300 text-zinc-950 text-sm px-3.5 py-2.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-zinc-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Password *</label>
                  <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" className="w-full bg-white border border-zinc-300 text-zinc-950 text-sm px-3.5 py-2.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-zinc-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Confirm Password *</label>
                  <input required type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" className="w-full bg-white border border-zinc-300 text-zinc-950 text-sm px-3.5 py-2.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-zinc-500" />
                </div>
                {!invite && <p className="col-span-2 text-[11px] text-zinc-600 bg-white border border-zinc-300 rounded-sm px-3.5 py-2.5">
                  You&apos;ll be the <span className="text-amber-700 font-semibold">company administrator</span> and can invite colleagues once our team approves your account.
                </p>}
              </div>
              <label className="flex items-start space-x-2 text-xs text-zinc-600 cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 rounded border-zinc-600 bg-white text-amber-700" />
                <span>I agree to the <Link href="/terms" target="_blank" className="text-amber-700 underline">Terms of Service</Link> and <Link href="/privacy" target="_blank" className="text-amber-700 underline">Privacy Policy</Link></span>
              </label>
              <div className="flex space-x-3">
                {!invite && <button type="button" onClick={() => setStep(1)} className="flex items-center space-x-1 border border-zinc-300 text-zinc-700 hover:bg-zinc-100 font-medium py-2.5 px-4 rounded-sm text-xs transition-colors">
                  <ChevronLeft className="w-4 h-4" /><span>Back</span>
                </button>}
                <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center space-x-2 bg-amber-400 hover:bg-amber-300 disabled:bg-amber-400/50 disabled:cursor-not-allowed text-zinc-950 font-bold py-2.5 rounded-sm text-sm transition-colors">
                  <UserPlus className="w-4 h-4" />
                  <span>{loading ? 'Creating account…' : 'Request Portal Access'}</span>
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-zinc-600 text-[11px] mt-5">
            Already have an account?{' '}
            <Link href="/login" className="text-amber-700 hover:text-amber-800 font-medium">Sign in</Link>
          </p>
        </div>

        <div className="mt-5 mx-2 flex items-start gap-3">
          <Building2 className="w-4 h-4 text-brass-light shrink-0 mt-0.5" />
          <p className="text-blue-100 text-xs leading-relaxed">Access is reviewed by our team. You can browse straight away; ordering unlocks once your company account is approved (usually within 1 business day).</p>
        </div>
      </div>
    </div>
  );
}
