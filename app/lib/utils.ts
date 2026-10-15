import type { OrderStatus, ArtworkStatus, PaymentStatus } from './types';

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

/** Registration-stamp classes (see .stamp in globals.css) */
export function orderStatusStyles(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    'Pending Approval': 'stamp stamp-ochre',
    'In Production':    'stamp stamp-blue',
    'Quality Check':    'stamp stamp-plum',
    'Dispatched':       'stamp stamp-green',
    'Delivered':        'stamp stamp-grey',
    'Cancelled':        'stamp stamp-red',
  };
  return map[status] ?? 'stamp stamp-grey';
}

export function paymentStatusStyles(status: PaymentStatus): string {
  const map: Record<PaymentStatus, string> = {
    Unpaid:     'stamp stamp-grey',
    Processing: 'stamp stamp-ochre',
    Paid:       'stamp stamp-green',
  };
  return map[status] ?? 'stamp stamp-grey';
}

export function artworkStatusStyles(status: ArtworkStatus): string {
  const map: Record<ArtworkStatus, string> = {
    'Approved':          'stamp stamp-green',
    'Pending Review':    'stamp stamp-ochre',
    'Revision Required': 'stamp stamp-red',
    'Superseded':        'stamp stamp-grey',
  };
  return map[status] ?? 'stamp stamp-grey';
}
