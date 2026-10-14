'use client';

import { useState } from 'react';
import { UserCheck, Lock, Bell, Shield, CheckCircle2, Eye, EyeOff } from 'lucide-react';

type Tab = 'profile' | 'security' | 'notifications';

export default function AccountPage() {
  const [tab, setTab] = useState<Tab>('profile');
  const [saved, setSaved] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile',       label: 'Profile',       icon: UserCheck },
    { id: 'security',      label: 'Security',      icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-200">
        <h1 className="text-xl font-bold text-zinc-900">Account Settings</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Manage your profile, security, and notification preferences.</p>
      </div>

      {/* Avatar card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm flex items-center space-x-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://i.pravatar.cc/150?img=5"
          alt="Sarah Jenkins"
          className="w-16 h-16 rounded-full object-cover border-2 border-amber-400"
        />
        <div className="flex-1">
          <div className="font-bold text-zinc-900 text-base">Sarah Jenkins</div>
          <div className="text-xs text-zinc-500 font-mono">sarah.jenkins@acmepackaging.com.au</div>
          <div className="flex items-center space-x-2 mt-1.5">
            <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">Admin</span>
            <span className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-600 text-[10px] font-mono">Acme Packaging Pty Ltd</span>
          </div>
        </div>
        <button className="text-xs font-semibold text-amber-600 hover:text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors">
          Change Photo
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-zinc-100 p-1 rounded-xl">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              tab === id ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <form onSubmit={handleSave} className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-zinc-800">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1.5">First Name</label>
              <input defaultValue="Sarah" className="w-full border border-zinc-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Last Name</label>
              <input defaultValue="Jenkins" className="w-full border border-zinc-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Work Email</label>
              <input type="email" defaultValue="sarah.jenkins@acmepackaging.com.au" className="w-full border border-zinc-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Phone</label>
              <input type="tel" defaultValue="+61 2 9055 7700" className="w-full border border-zinc-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Job Title</label>
              <input defaultValue="Procurement Manager" className="w-full border border-zinc-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            {saved && (
              <span className="flex items-center space-x-1.5 text-emerald-600 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Changes saved</span>
              </span>
            )}
            <button type="submit" className="ml-auto bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-5 py-2 rounded-lg text-sm transition-colors">
              Save Changes
            </button>
          </div>
        </form>
      )}

      {/* Security Tab */}
      {tab === 'security' && (
        <div className="space-y-4">
          <form onSubmit={handleSave} className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-zinc-800">Change Password</h2>
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Current Password</label>
              <div className="relative">
                <input type={showCurrent ? 'text' : 'password'} placeholder="••••••••" className="w-full border border-zinc-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400 pr-10" />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1.5">New Password</label>
              <div className="relative">
                <input type={showNew ? 'text' : 'password'} placeholder="Min. 8 characters" className="w-full border border-zinc-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400 pr-10" />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Confirm New Password</label>
              <input type="password" placeholder="Repeat new password" className="w-full border border-zinc-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400" />
            </div>
            <div className="flex items-center justify-between pt-2">
              {saved && <span className="flex items-center space-x-1.5 text-emerald-600 text-xs font-semibold"><CheckCircle2 className="w-4 h-4" /><span>Password updated</span></span>}
              <button type="submit" className="ml-auto bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-5 py-2 rounded-lg text-sm transition-colors">Update Password</button>
            </div>
          </form>

          {/* PIN setup */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Shield className="w-4 h-4 text-indigo-500" />
                  <h2 className="text-sm font-bold text-zinc-800">Access PIN</h2>
                </div>
                <p className="text-xs text-zinc-500">Set a 6-digit PIN for quick sign-in on trusted devices.</p>
              </div>
              <button className="text-xs font-bold bg-zinc-900 text-amber-400 px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors">
                Set PIN
              </button>
            </div>
          </div>

          {/* Active sessions */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-800 mb-4">Active Sessions</h2>
            {[
              { device: 'Chrome on macOS', location: 'Sydney, AU', time: 'Now — Current session', current: true },
              { device: 'Safari on iPhone', location: 'Sydney, AU', time: '2 hours ago', current: false },
            ].map((s) => (
              <div key={s.device} className="flex items-center justify-between py-3 border-b border-zinc-50 last:border-0">
                <div>
                  <div className="text-xs font-semibold text-zinc-800">{s.device}</div>
                  <div className="text-[11px] text-zinc-400 font-mono">{s.location} · {s.time}</div>
                </div>
                {s.current ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
                ) : (
                  <button className="text-[11px] font-semibold text-red-500 hover:text-red-700 transition-colors">Revoke</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {tab === 'notifications' && (
        <form onSubmit={handleSave} className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-zinc-800">Email Notification Preferences</h2>
          {[
            { label: 'Order dispatched',           sub: 'When your order leaves the warehouse',      defaultOn: true  },
            { label: 'Order delivered',            sub: 'Delivery confirmation',                     defaultOn: true  },
            { label: 'Reorder confirmed',          sub: 'When production accepts your reorder',      defaultOn: true  },
            { label: 'Artwork proof ready',        sub: 'When a new proof is uploaded for review',   defaultOn: true  },
            { label: 'Revision required',          sub: 'When artwork needs changes before print',   defaultOn: true  },
            { label: 'Invoice generated',          sub: 'When a Xero invoice is created',            defaultOn: false },
            { label: 'Team member invited',        sub: 'When someone joins your company account',   defaultOn: false },
            { label: 'Monthly spend summary',      sub: 'Monthly account spend digest email',        defaultOn: false },
          ].map((pref) => (
            <label key={pref.label} className="flex items-start justify-between cursor-pointer group">
              <div>
                <div className="text-sm font-semibold text-zinc-800 group-hover:text-zinc-900">{pref.label}</div>
                <div className="text-xs text-zinc-400">{pref.sub}</div>
              </div>
              <div className="relative shrink-0 ml-4 mt-0.5">
                <input type="checkbox" defaultChecked={pref.defaultOn} className="sr-only peer" />
                <div className="w-10 h-5 bg-zinc-200 rounded-full peer-checked:bg-amber-400 transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
              </div>
            </label>
          ))}
          <div className="flex items-center justify-between pt-2">
            {saved && <span className="flex items-center space-x-1.5 text-emerald-600 text-xs font-semibold"><CheckCircle2 className="w-4 h-4" /><span>Preferences saved</span></span>}
            <button type="submit" className="ml-auto bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-5 py-2 rounded-lg text-sm transition-colors">Save Preferences</button>
          </div>
        </form>
      )}
    </div>
  );
}
