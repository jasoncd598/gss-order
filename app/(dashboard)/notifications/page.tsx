import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Activity | GSS Order Portal' };

import {
  Bell,
  Package,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  UserPlus,
  DollarSign,
} from 'lucide-react';
import Link from 'next/link';

const ACTIVITY = [
  {
    id: 'a1',
    date: '14 Oct 2026',
    events: [
      { id: 'e1', icon: Package,       iconColor: 'text-emerald-500', iconBg: 'bg-emerald-50',  title: 'Order Dispatched',          body: 'ORD-2026-8812 (Corrugated Shipping Box × 2,500) has been dispatched via TNT Express. Tracking: TNT9284710482',      href: '/order/ord-8812', time: '9:14 AM' },
      { id: 'e2', icon: AlertTriangle,  iconColor: 'text-red-500',     iconBg: 'bg-red-50',      title: 'Artwork Revision Required',  body: 'PLT-7720-F Tissue Wrap – Brand Pattern (v1) requires revisions before it can proceed to production.',                  href: '/vault',         time: '8:03 AM' },
    ],
  },
  {
    id: 'a2',
    date: '13 Oct 2026',
    events: [
      { id: 'e3', icon: RefreshCw,      iconColor: 'text-amber-500',   iconBg: 'bg-amber-50',    title: 'Reorder Confirmed',          body: 'Your reorder request for PLT-5510-A Eco-Mailer Poly Bag (10,000 units) has been accepted. Production starts 15 Oct.', href: '/order/ord-8740', time: '3:45 PM' },
      { id: 'e4', icon: UserPlus,        iconColor: 'text-indigo-500',  iconBg: 'bg-indigo-50',   title: 'Team Invitation Accepted',   body: 'Mia Chen has accepted the invitation and joined as Procurement Manager.',                                            href: '/team',          time: '11:20 AM' },
    ],
  },
  {
    id: 'a3',
    date: '11 Oct 2026',
    events: [
      { id: 'e5', icon: CheckCircle2,    iconColor: 'text-emerald-500', iconBg: 'bg-emerald-50',  title: 'Proof Approved',             body: 'PLT-3301-E Premium Retail Swing Tag v2 has been approved by the production team and is ready for ordering.',         href: '/vault',         time: '10:00 AM' },
      { id: 'e6', icon: DollarSign,      iconColor: 'text-purple-500',  iconBg: 'bg-purple-50',   title: 'Invoice Paid',               body: 'INV-26-8421 ($1,560.00 AUD) has been marked as paid. Balance updated on your account.',                              href: '/order/ord-8421', time: '2:15 PM' },
    ],
  },
  {
    id: 'a4',
    date: '5 Aug 2026',
    events: [
      { id: 'e7', icon: Package,         iconColor: 'text-zinc-400',    iconBg: 'bg-zinc-100',    title: 'Order Delivered',            body: 'ORD-2026-8600 (Foil-Stamped Product Carton × 2,500) has been delivered. Signed by J. Wu at 10:42 AM.',                href: '/order/ord-8600', time: '11:00 AM' },
    ],
  },
];

export default function NotificationsPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-zinc-200">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-amber-500" />
          <h1 className="text-xl font-bold text-zinc-900">Activity &amp; Notifications</h1>
        </div>
        <span className="px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
          3 UNREAD
        </span>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {ACTIVITY.map((group) => (
          <div key={group.id}>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-3 font-mono">
              {group.date}
            </div>
            <div className="space-y-3">
              {group.events.map((event) => {
                const Icon = event.icon;
                return (
                  <Link
                    key={event.id}
                    href={event.href}
                    className="flex items-start space-x-4 bg-white border border-zinc-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-amber-200 transition-all group"
                  >
                    <div className={`w-10 h-10 rounded-full ${event.iconBg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${event.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-zinc-900 text-sm group-hover:text-amber-700 transition-colors">
                          {event.title}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono shrink-0 ml-3">{event.time}</span>
                      </div>
                      <p className="text-zinc-500 text-xs leading-relaxed">{event.body}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-zinc-400 text-xs font-mono py-4">
        — End of activity log —
      </p>
    </div>
  );
}
