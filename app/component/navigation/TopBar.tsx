'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bell, Search, UserCheck, Settings, LogOut, ChevronDown, ShoppingCart,
} from 'lucide-react';
import { useCart } from '../../lib/cartContext';
import { createClient } from '../../lib/supabase/client';
import { markNotificationsReadAction } from '../../lib/actions';
import { NOTIFICATION_STYLE, timeAgo } from '../notificationMeta';
import type { AppNotification } from '../../lib/types';

interface TopBarProps {
  displayName: string;
  role: string;
  email: string;
  notifications: AppNotification[];
}

export default function TopBar({ displayName, role, email, notifications: initialNotifications }: TopBarProps) {
  const router = useRouter();
  const { count } = useCart();
  const [notifOpen, setNotifOpen]     = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [synced, setSynced] = useState(initialNotifications);
  if (synced !== initialNotifications) { setSynced(initialNotifications); setNotifications(initialNotifications); }
  const [query, setQuery] = useState('');
  const [, startTransition] = useTransition();
  const [signingOut, setSigningOut]   = useState(false);
  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markRead(ids?: string[]) {
    setNotifications((ns) => ns.map((n) => (!ids || ids.includes(n.id) ? { ...n, read: true } : n)));
    startTransition(async () => { await markNotificationsReadAction(ids); });
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))     setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  // Initials for avatar fallback
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="bg-white border-b border-zinc-200 h-16 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-sm lg:pl-6 pl-16">
      {/* Search */}
      <form onSubmit={submitSearch} role="search" className="flex items-center flex-1 max-w-xs sm:max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search SKU, Order #, Plate Ref…"
            aria-label="Search orders and artwork"
            className="w-full pl-9 pr-4 py-1.5 bg-zinc-50 border border-zinc-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white text-zinc-800"
          />
        </div>
      </form>

      <div className="flex items-center space-x-2 sm:space-x-3 ml-3">
        {/* Cart badge */}
        <Link href="/cart" className="relative p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded border border-zinc-200 transition-colors" aria-label="Cart">
          <ShoppingCart className="w-4 h-4" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 text-zinc-950 text-[9px] font-black rounded-full flex items-center justify-center">
              {count}
            </span>
          )}
        </Link>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded border border-zinc-200 relative transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 text-zinc-950 text-[9px] font-black rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-zinc-200 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-zinc-900 text-sm">Notifications</span>
                  {unreadCount > 0 && <span className="ml-2 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">{unreadCount} new</span>}
                </div>
                {unreadCount > 0 && (
                  <button onClick={() => markRead()} className="text-[11px] text-amber-600 hover:text-amber-800 font-semibold">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-zinc-50">
                {notifications.length === 0 && (
                  <div className="px-4 py-10 text-center text-xs text-zinc-400">You&apos;re all caught up.</div>
                )}
                {notifications.slice(0, 8).map((n) => {
                  const { icon: Icon, color, bg } = NOTIFICATION_STYLE[n.type] ?? NOTIFICATION_STYLE.account;
                  return (
                    <Link
                      key={n.id}
                      href={n.link}
                      onClick={() => { setNotifOpen(false); if (!n.read) markRead([n.id]); }}
                      className={`flex items-start space-x-3 px-4 py-3 hover:bg-zinc-50 transition-colors ${!n.read ? 'bg-amber-50/40' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <span className={`text-xs text-zinc-900 ${!n.read ? 'font-bold' : 'font-semibold'}`}>{n.title}</span>
                          {!n.read && <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1 ml-2" />}
                        </div>
                        {n.body && <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>}
                        <span className="text-[10px] text-zinc-400 font-mono" suppressHydrationWarning>{timeAgo(n.createdAt)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <div className="px-4 py-2.5 border-t border-zinc-100 bg-zinc-50">
                <Link href="/notifications" onClick={() => setNotifOpen(false)} className="text-[11px] text-amber-600 hover:text-amber-800 font-semibold w-full text-center block">
                  View all activity →
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-zinc-200 hidden sm:block" />

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className="flex items-center space-x-2 text-xs hover:bg-zinc-50 rounded-lg px-2 py-1.5 transition-colors"
          >
            <div className="bg-zinc-900 text-amber-400 font-bold p-1.5 rounded shrink-0 w-8 h-8 flex items-center justify-center text-[11px]">
              {initials || <UserCheck className="w-4 h-4" />}
            </div>
            <div className="hidden sm:block text-left">
              <p className="font-semibold text-zinc-900 leading-tight">{displayName}</p>
              <p className="text-[10px] text-zinc-500 font-mono leading-tight">{role}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-zinc-200 rounded-xl shadow-2xl z-50 py-1.5 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-zinc-100">
                <p className="font-semibold text-zinc-900 text-xs">{displayName}</p>
                <p className="text-[10px] text-zinc-400 font-mono truncate">{email}</p>
              </div>
              <Link href="/account" onClick={() => setProfileOpen(false)} className="flex items-center space-x-2.5 px-4 py-2.5 text-xs text-zinc-700 hover:bg-zinc-50 transition-colors">
                <Settings className="w-3.5 h-3.5 text-zinc-400" />
                <span>Account Settings</span>
              </Link>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{signingOut ? 'Signing out…' : 'Sign Out'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
