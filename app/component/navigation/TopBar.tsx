'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell, Search, UserCheck, CheckCircle2, Package,
  RefreshCw, AlertTriangle, X, Settings, LogOut,
  ChevronDown, ShoppingCart,
} from 'lucide-react';
import { useCart } from '../../lib/cartContext';

const NOTIFICATIONS = [
  { id: 'n1', icon: Package,       iconColor: 'text-emerald-500', iconBg: 'bg-emerald-50', title: 'Order Dispatched',          body: 'ORD-2026-8812 has been dispatched via TNT Express.',                    time: '2 hours ago', read: false, href: '/order/ord-8812' },
  { id: 'n2', icon: RefreshCw,     iconColor: 'text-amber-500',   iconBg: 'bg-amber-50',   title: 'Reorder Confirmed',          body: 'Your reorder of PLT-5510-A Poly Mailer Bags has been accepted.',        time: '1 day ago',   read: false, href: '/order/ord-8740' },
  { id: 'n3', icon: AlertTriangle, iconColor: 'text-red-500',     iconBg: 'bg-red-50',     title: 'Artwork Revision Required',  body: 'PLT-7720-F Tissue Wrap needs revisions before production.',             time: '2 days ago',  read: false, href: '/vault' },
  { id: 'n4', icon: CheckCircle2,  iconColor: 'text-indigo-500',  iconBg: 'bg-indigo-50',  title: 'Proof Approved',             body: 'PLT-3301-E Premium Retail Swing Tag v2 has been approved.',             time: '3 days ago',  read: true,  href: '/vault' },
  { id: 'n5', icon: Package,       iconColor: 'text-zinc-400',    iconBg: 'bg-zinc-100',   title: 'Order Delivered',            body: 'ORD-2026-8600 has been delivered to your warehouse.',                    time: '5 days ago',  read: true,  href: '/order/ord-8600' },
];

export default function TopBar() {
  const { count } = useCart();
  const [notifOpen, setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="bg-white border-b border-zinc-200 h-16 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-sm lg:pl-6 pl-16">
      {/* Search */}
      <div className="flex items-center flex-1 max-w-xs sm:max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search SKU, Order #, Plate Ref…"
            className="w-full pl-9 pr-4 py-1.5 bg-zinc-50 border border-zinc-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white text-zinc-800"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3 ml-3">
        {/* Cart badge */}
        <Link
          href="/cart"
          className="relative p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded border border-zinc-200 transition-colors"
          aria-label="Cart"
        >
          <ShoppingCart className="w-4 h-4" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 text-zinc-950 text-[9px] font-black rounded-full flex items-center justify-center">
              {count}
            </span>
          )}
        </Link>

        {/* Notification Bell */}
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
                  {unreadCount > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => setNotifications((ns) => ns.map((n) => ({ ...n, read: true })))}
                    className="text-[11px] text-amber-600 hover:text-amber-800 font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-zinc-50">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center text-zinc-400 text-xs">No notifications</div>
                ) : (
                  notifications.map((n) => {
                    const Icon = n.icon;
                    return (
                      <div
                        key={n.id}
                        className={`flex items-start space-x-3 px-4 py-3 hover:bg-zinc-50 transition-colors group ${!n.read ? 'bg-amber-50/30' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-full ${n.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                          <Icon className={`w-4 h-4 ${n.iconColor}`} />
                        </div>
                        <Link href={n.href} onClick={() => setNotifOpen(false)} className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <span className={`text-xs text-zinc-900 ${!n.read ? 'font-bold' : 'font-semibold'}`}>
                              {n.title}
                            </span>
                            {!n.read && <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1 ml-2" />}
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{n.body}</p>
                          <span className="text-[10px] text-zinc-400 font-mono">{n.time}</span>
                        </Link>
                        <button
                          onClick={() => setNotifications((ns) => ns.filter((x) => x.id !== n.id))}
                          className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-zinc-500 transition-opacity shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="px-4 py-2.5 border-t border-zinc-100 bg-zinc-50">
                <Link
                  href="/notifications"
                  onClick={() => setNotifOpen(false)}
                  className="text-[11px] text-amber-600 hover:text-amber-800 font-semibold w-full text-center block"
                >
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
            <div className="bg-zinc-900 text-amber-400 font-bold p-1.5 rounded shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="font-semibold text-zinc-900 leading-tight">Sarah Jenkins</p>
              <p className="text-[10px] text-zinc-500 font-mono leading-tight">Admin</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-zinc-200 rounded-xl shadow-2xl z-50 py-1.5 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-zinc-100">
                <p className="font-semibold text-zinc-900 text-xs">Sarah Jenkins</p>
                <p className="text-[10px] text-zinc-400 font-mono truncate">sarah.jenkins@acmepackaging.com.au</p>
              </div>
              <Link href="/account" onClick={() => setProfileOpen(false)} className="flex items-center space-x-2.5 px-4 py-2.5 text-xs text-zinc-700 hover:bg-zinc-50 transition-colors">
                <Settings className="w-3.5 h-3.5 text-zinc-400" />
                <span>Account Settings</span>
              </Link>
              <Link href="/login" className="flex items-center space-x-2.5 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 transition-colors">
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
