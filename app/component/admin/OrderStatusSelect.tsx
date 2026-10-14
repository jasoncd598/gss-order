'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import type { OrderStatus } from '../../lib/types';
import { orderStatusStyles } from '../../lib/utils';
import { updateOrderStatusAction } from '../../lib/actions';

const STATUSES: OrderStatus[] = ['Pending Approval', 'In Production', 'Quality Check', 'Dispatched', 'Delivered', 'Cancelled'];

/** Staff-only inline status changer. Optimistic, reverts on failure. */
export default function OrderStatusSelect({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [current, setCurrent] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function change(next: OrderStatus) {
    const previous = current;
    setCurrent(next);
    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatusAction(orderId, next);
      if (!result.success) {
        setCurrent(previous);
        setError(result.error ?? 'Update failed');
      }
    });
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <select
        value={current}
        disabled={pending}
        onChange={(e) => change(e.target.value as OrderStatus)}
        aria-label="Order status"
        title={error ?? undefined}
        className={`px-2 py-1 rounded text-[10px] font-semibold border cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400 ${orderStatusStyles(current)} ${error ? 'ring-1 ring-red-400' : ''}`}
      >
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      {pending && <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />}
    </div>
  );
}
