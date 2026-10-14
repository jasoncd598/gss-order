import type { OrderStatus, ArtworkStatus } from './types';

export function formatAUD(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr || dateStr === 'Never') return 'Never';
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function orderStatusStyles(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    'Pending Approval': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'In Production':    'bg-blue-50 text-blue-700 border-blue-200',
    'Quality Check':    'bg-purple-50 text-purple-700 border-purple-200',
    'Dispatched':       'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Delivered':        'bg-zinc-100 text-zinc-600 border-zinc-200',
    'Cancelled':        'bg-red-50 text-red-700 border-red-200',
  };
  return map[status] ?? 'bg-zinc-100 text-zinc-600 border-zinc-200';
}

export function artworkStatusStyles(status: ArtworkStatus): string {
  const map: Record<ArtworkStatus, string> = {
    'Approved':          'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Pending Review':    'bg-amber-50 text-amber-700 border-amber-200',
    'Revision Required': 'bg-red-50 text-red-700 border-red-200',
    'Superseded':        'bg-zinc-100 text-zinc-500 border-zinc-200',
  };
  return map[status] ?? 'bg-zinc-100 text-zinc-600 border-zinc-200';
}
