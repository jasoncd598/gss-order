'use client';

import { useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { markNotificationsReadAction } from '../../lib/actions';

export default function MarkAllReadButton() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(async () => { await markNotificationsReadAction(); })}
      disabled={pending}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-800"
    >
      {pending && <Loader2 className="w-3 h-3 animate-spin" />} Mark all read
    </button>
  );
}
