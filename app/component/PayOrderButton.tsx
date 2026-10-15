'use client';

import { useState, useTransition } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { createOrderCheckoutAction } from '../lib/actions';

/** Sends the customer to Stripe Checkout for one order. */
export default function PayOrderButton({ orderId, label = 'Pay by Card' }: { orderId: string; label?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function pay() {
    setError(null);
    startTransition(async () => {
      const result = await createOrderCheckoutAction(orderId);
      if (result.success && result.url) {
        window.location.assign(result.url);
      } else {
        setError(result.error ?? 'Could not start payment');
      }
    });
  }

  return (
    <div className="space-y-2">
      <button
        onClick={pay}
        disabled={pending}
        className="w-full flex items-center justify-center space-x-2 bg-amber-400 hover:bg-amber-300 disabled:bg-amber-400/50 disabled:cursor-not-allowed text-zinc-950 font-bold py-2.5 rounded-lg text-sm transition-colors"
      >
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
        <span>{pending ? 'Opening secure checkout…' : label}</span>
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
