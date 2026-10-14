'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Building2, UserPlus, ChevronRight, ChevronLeft, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';

interface InviteInfo { company_name: string; email: string; role: string }

export default function RegistrationPage() {
  // useSearchParams needs a Suspense boundary so the page shell can prerender
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <Registration />
    </Suspense>
  );
}

function Registration() {
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

    const { error: signUpError } = await supabase.auth.signUp({
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

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(251,191,36,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center max-w-md w-full shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-white font-bold text-xl mb-2">Check your email</h2>
          <p className="text-zinc-400 text-sm mb-2">
            We&apos;ve sent a confirmation link to <span className="text-white font-semibold">{email}</span>.
          </p>
          <p className="text-zinc-500 text-xs mb-6">
            {invite
              ? `Verify your email, then sign in to join ${invite.company_name}.`
              : 'Verify your email, then sign in. You can browse straight away; ordering unlocks once our team approves your company account (usually within 1 business day).'}
          </p>
          <Link href="/login" className="inline-flex items-center justify-center bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-6 py-2.5 rounded-lg text-sm transition-colors">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(251,191,36,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative w-full max-w-lg">
        <div className="flex items-center justify-center space-x-3 mb-8">
          <div className="bg-amber-400 text-zinc-950 font-black px-3 py-2 rounded text-lg tracking-widest shadow-lg">GSS</div>
          <div>
            <h1 className="font-bold text-white text-base tracking-wide">ORDER PORTAL</h1>
            <p className="text-amber-400/70 text-[11px] font-mono">B2B Customer Platform</p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl">
          {inviteToken && invite === undefined && (
            <div className="flex items-center justify-center py-10 text-zinc-400 text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Checking invitation…
            </div>
          )}
          {inviteToken && invite === null && (
            <div className="mb-4 bg-amber-950/40 border border-amber-800/60 rounded-lg px-3.5 py-3 text-xs text-amber-200">
              This invitation link is invalid or has expired. Ask your company admin for a new one, or register a new company below.
            </div>
          )}
          {invite && (
            <div className="mb-6 bg-amber-400/10 border border-amber-400/30 rounded-lg px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-amber-400/80 font-semibold">You&apos;ve been invited</p>
              <p className="text-white text-sm font-bold mt-0.5">{invite.company_name}</p>
              <p className="text-zinc-400 text-xs">Joining as <span className="text-amber-400 font-semibold">{invite.role}</span></p>
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
                    <span className={`text-xs font-medium ${step === s ? 'text-white' : 'text-zinc-500'}`}>{label}</span>
                  </div>
                  {s < 2 && <div className="w-12 h-px bg-zinc-700 mx-3" />}
                </div>
              );
            })}
          </div>}

          {error && (
            <div className="mb-4 flex items-start space-x-2.5 bg-red-950/50 border border-red-800 rounded-lg px-3.5 py-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-300 text-xs">{error}</p>
            </div>
          )}

          {invite === undefined ? null : step === 1 ? (
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
              <div>
                <h2 className="text-white font-bold text-lg mb-0.5">Company Information</h2>
                <p className="text-zinc-400 text-xs mb-4">Tell us about your business.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Company Legal Name *</label>
                  <input required type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Packaging Pty Ltd" className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-zinc-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">ABN</label>
                  <input type="text" value={abn} onChange={(e) => setAbn(e.target.value)} placeholder="51 824 753 556" className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-zinc-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Industry</label>
                  <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <option>Packaging &amp; Manufacturing</option>
                    <option>Retail &amp; FMCG</option>
                    <option>Health &amp; Beauty</option>
                    <option>Wholesale Distribution</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Business Address</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="14 Industrial Ave, Wetherill Park NSW 2164" className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-zinc-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Contact Phone</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+61 2 9055 7700" className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-zinc-500" />
                </div>
              </div>
              <button type="submit" className="w-full flex items-center justify-center space-x-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold py-2.5 rounded-lg text-sm transition-colors mt-2">
                <span>Continue</span><ChevronRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <h2 className="text-white font-bold text-lg mb-0.5">Your Account</h2>
                <p className="text-zinc-400 text-xs mb-4">Set up your personal login credentials.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">First Name *</label>
                  <input required type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Sarah" className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-zinc-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Last Name *</label>
                  <input required type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Jenkins" className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-zinc-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Work Email *</label>
                  <input required type="email" value={email} readOnly={!!invite} onChange={(e) => setEmail(e.target.value)} placeholder="sarah@company.com.au" className="w-full read-only:opacity-70 bg-zinc-800 border border-zinc-700 text-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-zinc-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Password *</label>
                  <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-zinc-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Confirm Password *</label>
                  <input required type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-zinc-500" />
                </div>
                {!invite && <p className="col-span-2 text-[11px] text-zinc-400 bg-zinc-800/60 border border-zinc-700 rounded-lg px-3.5 py-2.5">
                  You&apos;ll be the <span className="text-amber-400 font-semibold">company administrator</span> and can invite colleagues once our team approves your account.
                </p>}
              </div>
              <label className="flex items-start space-x-2 text-xs text-zinc-400 cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 rounded border-zinc-600 bg-zinc-800 text-amber-400" />
                <span>I agree to the <span className="text-amber-400 underline">Terms of Service</span> and <span className="text-amber-400 underline">Privacy Policy</span></span>
              </label>
              <div className="flex space-x-3">
                {!invite && <button type="button" onClick={() => setStep(1)} className="flex items-center space-x-1 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 font-medium py-2.5 px-4 rounded-lg text-xs transition-colors">
                  <ChevronLeft className="w-4 h-4" /><span>Back</span>
                </button>}
                <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center space-x-2 bg-amber-400 hover:bg-amber-300 disabled:bg-amber-400/50 disabled:cursor-not-allowed text-zinc-950 font-bold py-2.5 rounded-lg text-sm transition-colors">
                  <UserPlus className="w-4 h-4" />
                  <span>{loading ? 'Creating account…' : 'Request Portal Access'}</span>
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-zinc-500 text-[11px] mt-5">
            Already have an account?{' '}
            <Link href="/login" className="text-amber-400 hover:text-amber-300 font-medium">Sign in</Link>
          </p>
        </div>

        <div className="mt-4 mx-4 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 flex items-start space-x-3">
          <Building2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-zinc-400 text-[11px]">Access is reviewed by our team. You&apos;ll receive email confirmation within 1 business day once your account is approved.</p>
        </div>
      </div>
    </div>
  );
}
