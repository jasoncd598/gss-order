import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Activity | GSS Order Portal' };

import Link from 'next/link';
import { Bell, BellOff } from 'lucide-react';
import { createClient } from '../../lib/supabase/server';
import { getNotifications } from '../../lib/db';
import { NOTIFICATION_STYLE } from '../../component/notificationMeta';
import MarkAllReadButton from './MarkAllReadButton';
import type { AppNotification } from '../../lib/types';

const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-AU', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });

export default async function NotificationsPage() {
  const supabase = await createClient();
  const notifications = await getNotifications(supabase, 100);
  const unread = notifications.filter((n) => !n.read).length;

  // Group by calendar day, newest first (already ordered by the query)
  const groups: { day: string; items: AppNotification[] }[] = [];
  for (const n of notifications) {
    const day = dayLabel(n.createdAt);
    const last = groups[groups.length - 1];
    if (last?.day === day) last.items.push(n);
    else groups.push({ day, items: [n] });
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center pb-4 border-b border-zinc-200 gap-3">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-amber-500" />
          <h1 className="text-xl font-bold text-zinc-900">Activity &amp; Notifications</h1>
        </div>
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <span className="px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
              {unread} UNREAD
            </span>
          )}
          {unread > 0 && <MarkAllReadButton />}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white border border-dashed border-zinc-300 rounded-xl py-16 text-center">
          <BellOff className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
          <h3 className="font-semibold text-zinc-600 text-sm">No activity yet</h3>
          <p className="text-xs text-zinc-400 mt-1">Order updates, proof approvals and reorder decisions will appear here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((g) => (
            <div key={g.day}>
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 font-mono">{g.day}</div>
              <div className="space-y-3">
                {g.items.map((n) => {
                  const { icon: Icon, color, bg } = NOTIFICATION_STYLE[n.type] ?? NOTIFICATION_STYLE.account;
                  return (
                    <Link
                      key={n.id}
                      href={n.link}
                      className={`flex items-start space-x-4 border rounded-xl p-4 shadow-sm hover:shadow-md hover:border-amber-200 transition-all group ${
                        n.read ? 'bg-white border-zinc-200' : 'bg-amber-50/40 border-amber-200'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1 gap-3">
                          <span className={`text-sm text-zinc-900 group-hover:text-amber-700 transition-colors ${n.read ? 'font-semibold' : 'font-bold'}`}>
                            {n.title}
                          </span>
                          <span className="text-xs text-zinc-400 font-mono shrink-0">{timeLabel(n.createdAt)}</span>
                        </div>
                        {n.body && <p className="text-zinc-500 text-xs leading-relaxed">{n.body}</p>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
