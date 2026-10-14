'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, UserPlus, ChevronRight, ChevronLeft } from 'lucide-react';

export default function RegistrationPage() {
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(251,191,36,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative w-full max-w-lg">
        {/* Brand */}
        <div className="flex items-center justify-center space-x-3 mb-8">
          <div className="bg-amber-400 text-zinc-950 font-black px-3 py-2 rounded text-lg tracking-widest shadow-lg">
            GSS
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-wide">ORDER PORTAL</h1>
            <p className="text-amber-400/70 text-[11px] font-mono">B2B Customer Platform</p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-6">
            {['Company Details', 'Your Account'].map((label, i) => {
              const s = i + 1;
              return (
                <div key={s} className="flex items-center space-x-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                    step === s
                      ? 'bg-amber-400 border-amber-400 text-zinc-950'
                      : step > s
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-transparent border-zinc-600 text-zinc-500'
                  }`}>
                    {s}
                  </div>
                  <span className={`text-xs font-medium ${step === s ? 'text-white' : 'text-zinc-500'}`}>
                    {label}
                  </span>
                  {s < 2 && <div className="w-16 h-px bg-zinc-700 mx-2" />}
                </div>
              );
            })}
          </div>

          {step === 1 ? (
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <h2 className="text-white font-bold text-lg mb-0.5">Company Information</h2>
                <p className="text-zinc-400 text-xs mb-4">Tell us about your business so we can set up your account.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Company Legal Name</label>
                  <input
                    type="text"
                    placeholder="Acme Packaging Pty Ltd"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">ABN</label>
                  <input
                    type="text"
                    placeholder="51 824 753 556"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Industry</label>
                  <select className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <option>Packaging & Manufacturing</option>
                    <option>Retail & FMCG</option>
                    <option>Health & Beauty</option>
                    <option>Wholesale Distribution</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Business Address</label>
                  <input
                    type="text"
                    placeholder="14 Industrial Ave, Wetherill Park NSW 2164"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="+61 2 9055 7700"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Approx. Monthly Spend</label>
                  <select className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <option>Under $5,000</option>
                    <option>$5,000 – $20,000</option>
                    <option>$20,000 – $50,000</option>
                    <option>$50,000+</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full flex items-center justify-center space-x-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold py-2.5 rounded-lg text-sm transition-colors mt-2"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <h2 className="text-white font-bold text-lg mb-0.5">Your Account</h2>
                <p className="text-zinc-400 text-xs mb-4">Set up your personal login credentials.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">First Name</label>
                  <input
                    type="text"
                    placeholder="Sarah"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    placeholder="Jenkins"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-zinc-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Work Email</label>
                  <input
                    type="email"
                    placeholder="sarah@company.com.au"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Password</label>
                  <input
                    type="password"
                    placeholder="Min. 8 characters"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Repeat password"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-zinc-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Your Role</label>
                  <select className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                    <option>Procurement Manager</option>
                    <option>Admin</option>
                    <option>Finance</option>
                    <option>Viewer</option>
                  </select>
                </div>
              </div>

              <label className="flex items-start space-x-2 text-xs text-zinc-400 cursor-pointer">
                <input type="checkbox" className="mt-0.5 rounded border-zinc-600 bg-zinc-800 text-amber-400" />
                <span>I agree to the <span className="text-amber-400 underline">Terms of Service</span> and <span className="text-amber-400 underline">Privacy Policy</span></span>
              </label>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center space-x-1 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 font-medium py-2.5 px-4 rounded-lg text-xs transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center space-x-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold py-2.5 rounded-lg text-sm transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Request Portal Access</span>
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-zinc-500 text-[11px] mt-5">
            Already have an account?{' '}
            <Link href="/login" className="text-amber-400 hover:text-amber-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-4 mx-4 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 flex items-start space-x-3">
          <Building2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-zinc-400 text-[11px]">
            Access is reviewed by our team. You'll receive email confirmation within 1 business day once your account is approved.
          </p>
        </div>
      </div>
    </div>
  );
}
