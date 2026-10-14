import { Package, RefreshCw, FileCheck, UserPlus, Building2, type LucideIcon } from 'lucide-react';
import type { NotificationType } from '../lib/types';

export const NOTIFICATION_STYLE: Record<NotificationType, { icon: LucideIcon; color: string; bg: string }> = {
  order:   { icon: Package,   color: 'text-emerald-600', bg: 'bg-emerald-50' },
  reorder: { icon: RefreshCw, color: 'text-amber-600',   bg: 'bg-amber-50' },
  artwork: { icon: FileCheck, color: 'text-indigo-600',  bg: 'bg-indigo-50' },
  team:    { icon: UserPlus,  color: 'text-sky-600',     bg: 'bg-sky-50' },
  account: { icon: Building2, color: 'text-zinc-600',    bg: 'bg-zinc-100' },
};

export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} day${d > 1 ? 's' : ''} ago`;
  return new Date(iso).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
}
